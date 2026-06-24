const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 3456;
const SCENES_DIR = path.resolve(__dirname, '..', 'public', 'scenes');
const PROJECT_ROOT = path.resolve(__dirname, '..');

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
        const metadata = parts.metadata ? JSON.parse(parts.metadata) : {};
        const slug = metadata.slug || 'scene';
        
        const sceneDir = path.join(SCENES_DIR, slug);
        fs.mkdirSync(sceneDir, { recursive: true });
        
        const scanResults = [];
        
        for (const [key, file] of Object.entries(parts)) {
          if (key === 'metadata') continue;
          if (!file || !file.filename) continue;
          
          let filename = file.filename;
          if (filename.endsWith('.glb') || filename.endsWith('.gltf')) filename = 'scene.glb';
          
          const filePath = path.join(sceneDir, filename);
          fs.writeFileSync(filePath, file.data);
          
          const scan = virusScan(filePath);
          scanResults.push({ file: filename, ...scan });
          
          if (!scan.clean) {
            fs.unlinkSync(filePath);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Virus detected in ${filename}`, details: scan.reason }));
            return;
          }
        }
        
        if (metadata) {
          const metaClean = metadata.replace(/\r/g, '').trim();
          fs.writeFileSync(path.join(sceneDir, 'meta.json'), JSON.stringify(JSON.parse(metaClean), null, 2));
        }
        
        const pushed = gitCommit(slug, metadata);
        
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
  console.log(`  Port: ${PORT}`);
  console.log(`  Scenes: ${SCENES_DIR}`);
  console.log(`  Health: http://localhost:${PORT}/health\n`);
});