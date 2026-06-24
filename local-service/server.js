const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

const PORT = process.env.PORT || 3456;
const HTTPS_PORT = process.env.HTTPS_PORT || 3457;
const SCENES_DIR = path.resolve(__dirname, '..', 'public', 'scenes');
const PROJECT_ROOT = path.resolve(__dirname, '..');

function jsonClean(s) { return s.replace(/\r/g, '').replace(/\n/g, '').trim(); }

function parseMultipart(body, boundary) {
  const parts = {};
  const boundaryBuf = Buffer.from(`--${boundary}`);
  let start = body.indexOf(boundaryBuf) + boundaryBuf.length + 2;
  
  while (true) {
    const end = body.indexOf(boundaryBuf, start);
    if (end === -1) break;
    
    const part = body.slice(start, end - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = end + boundaryBuf.length + 2; continue; }
    
    const headers = part.slice(0, headerEnd).toString();
    const data = part.slice(headerEnd + 4);
    
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    
    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch) {
        parts[name] = { filename: filenameMatch[1], data };
      } else {
        parts[name] = data.toString();
      }
    }
    
    start = end + boundaryBuf.length + 2;
  }
  return parts;
}

function virusScan(filePath) {
  try {
    const defenderPath = 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe';
    if (!fs.existsSync(defenderPath)) {
      console.log('[WARN] Windows Defender not found, skipping scan');
      return { clean: true, reason: 'defender not found' };
    }
    const result = execSync(`"${defenderPath}" -Scan -ScanType 3 -File "${filePath}"`, { encoding: 'utf-8', timeout: 30000 });
    if (result.includes('found no threats') || result.includes('No threats')) {
      return { clean: true };
    }
    return { clean: false, reason: result };
  } catch (err) {
    if (err.message.includes('found no threats') || err.message.includes('No threats')) {
      return { clean: true };
    }
    console.error('[WARN] Virus scan failed:', err.message);
    return { clean: true, reason: 'scan error' };
  }
}

function gitCommit(slug, metadata) {
  try {
    execSync(`git add "public/scenes/${slug}/"`, { cwd: PROJECT_ROOT });
    const msg = metadata ? `feat: add scene ${slug} (author: ${metadata.author || 'unknown'})` : `feat: add scene ${slug}`;
    execSync(`git commit -m "${msg}"`, { cwd: PROJECT_ROOT });
    execSync(`git push origin master`, { cwd: PROJECT_ROOT, timeout: 30000 });
    console.log(`[OK] Git push done for ${slug}`);
    return true;
  } catch (err) {
    console.error('[ERROR] Git push failed:', err.message);
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', scenes: SCENES_DIR }));
    return;
  }
  
  if (req.method === 'POST' && req.url === '/upload') {
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', async () => {
      try {
        const buf = Buffer.concat(body);
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)/);
        
        if (!boundaryMatch) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No boundary' }));
          return;
        }
        
        const parts = parseMultipart(buf, boundaryMatch[1]);
        let metaParsed = {};
        if (parts.metadata) {
          try {
            metaParsed = JSON.parse(parts.metadata.replace(/\r/g, '').trim());
          } catch(e) {
            metaParsed = {};
          }
        }
        const slug = metaParsed.slug || 'scene';
        let sceneDir = path.join(SCENES_DIR, slug);
        fs.mkdirSync(sceneDir, { recursive: true });
        
        const scanResults = [];
        let zipExtracted = false;
        
        for (const [key, file] of Object.entries(parts)) {
          if (key === 'metadata') continue;
          if (!file || !file.filename) continue;
          
          if (file.filename.endsWith('.zip')) {
            try {
              const zip = new AdmZip(file.data);
              const entries = zip.getEntries();
              for (const entry of entries) {
                if (entry.entryName.endsWith('.glb') || entry.entryName.endsWith('.gltf')) {
                  const glbPath = path.join(sceneDir, 'scene.glb');
                  fs.writeFileSync(glbPath, entry.getData());
                  const scan = virusScan(glbPath);
                  scanResults.push({ file: 'scene.glb', ...scan });
                  if (!scan.clean) { fs.unlinkSync(glbPath); res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Virus in scene.glb', details: scan.reason })); return; }
                } else if (entry.entryName.endsWith('.json') && !entry.entryName.startsWith('__MACOSX')) {
                  const jsonContent = entry.getData().toString('utf-8');
                  try { metaParsed = JSON.parse(jsonClean(jsonContent)); } catch(e) {}
                }
              }
              zipExtracted = true;
            } catch(e) {
              console.error('[WARN] ZIP extract failed:', e.message);
            }
          } else {
            let filename = file.filename;
            if (filename.endsWith('.glb') || filename.endsWith('.gltf')) filename = 'scene.glb';
            const filePath = path.join(sceneDir, filename);
            fs.writeFileSync(filePath, file.data);
            const scan = virusScan(filePath);
            scanResults.push({ file: filename, ...scan });
            if (!scan.clean) { fs.unlinkSync(filePath); res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: `Virus in ${filename}`, details: scan.reason })); return; }
          }
        }
        
        if (metaParsed.slug || zipExtracted) {
          try {
            const finalSlug = metaParsed.slug || slug;
            const finalDir = path.join(SCENES_DIR, finalSlug);
            if (finalDir !== sceneDir) fs.mkdirSync(finalDir, { recursive: true });
            fs.writeFileSync(path.join(finalDir, 'meta.json'), JSON.stringify(metaParsed, null, 2));
            sceneDir = finalDir;
          } catch(e) {
            fs.writeFileSync(path.join(sceneDir, 'meta.json'), JSON.stringify(metaParsed || {}, null, 2));
          }
        }
        
        const pushed = gitCommit(slug, metaParsed);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, slug, gitPushed: pushed, scan: scanResults }));
      } catch (err) {
        console.error('[ERROR]', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n  Blender to Web Local Service`);
  console.log(`  HTTP:  http://localhost:${PORT}`);
  console.log(`  Scenes: ${SCENES_DIR}`);
  console.log(`  Health: http://localhost:${PORT}/health\n`);
  
  const certPath = path.join(__dirname, 'cert.pem');
  const keyPath = path.join(__dirname, 'key.pem');
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    https.createServer(httpsOptions, server.listeners('request')[0]).listen(HTTPS_PORT, () => {
      console.log(`  HTTPS: https://localhost:${HTTPS_PORT}`);
      console.log(`  Health: https://localhost:${HTTPS_PORT}/health\n`);
    });
  }
});