const http = require('http');
const fs = require('fs');
const path = require('path');

const SCENES_DIR = path.resolve(__dirname, '..', 'public', 'scenes');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  
  if (req.method === 'POST' && req.url === '/upload') {
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
      try {
        const buf = Buffer.concat(body);
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)/);
        
        if (!boundaryMatch) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No boundary' }));
          return;
        }
        
        const boundary = boundaryMatch[1];
        const parts = {};
        const boundaryBuf = Buffer.from('--' + boundary);
        let start = buf.indexOf(boundaryBuf) + boundaryBuf.length + 2;
        
        while (true) {
          const end = buf.indexOf(boundaryBuf, start);
          if (end === -1) break;
          const part = buf.slice(start, end - 2);
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) { start = end + boundaryBuf.length + 2; continue; }
          const headers = part.slice(0, headerEnd).toString();
          const data = part.slice(headerEnd + 4);
          const nameMatch = headers.match(/name="([^"]+)"/);
          const filenameMatch = headers.match(/filename="([^"]+)"/);
          if (nameMatch) {
            parts[nameMatch[1]] = filenameMatch ? { filename: filenameMatch[1], data } : data.toString();
          }
          start = end + boundaryBuf.length + 2;
        }
        
        let metaParsed = {};
        if (parts.metadata) {
          try {
            metaParsed = JSON.parse(parts.metadata.replace(/\r/g, '').trim());
          } catch(e) {
            console.error('Meta parse error:', e.message);
          }
        }
        
        const slug = metaParsed.slug || 'scene';
        const sceneDir = path.join(SCENES_DIR, slug);
        fs.mkdirSync(sceneDir, { recursive: true });
        
        for (const [key, file] of Object.entries(parts)) {
          if (key === 'metadata') continue;
          if (!file || !file.filename) continue;
          let filename = file.filename;
          if (filename.endsWith('.glb') || filename.endsWith('.gltf')) filename = 'scene.glb';
          fs.writeFileSync(path.join(sceneDir, filename), file.data);
        }
        
        fs.writeFileSync(path.join(sceneDir, 'meta.json'), JSON.stringify(metaParsed, null, 2));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, slug }));
      } catch(e) {
        console.error('Upload error:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message, stack: e.stack }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(3459, () => console.log('Test service on 3459'));