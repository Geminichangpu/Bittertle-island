import { spawn } from 'node:child_process';
import { createReadStream, statSync } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('./展示版/', import.meta.url)));
const host = '127.0.0.1';
const port = 5186;
const url = 'http://' + host + ':' + port + '/';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

if (!statSync(path.join(root, 'index.html')).isFile()) {
  throw new Error('找不到只读展示入口。');
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  try {
    const pathname = decodeURIComponent(new URL(req.url, url).pathname);
    const parts = (pathname === '/' ? '/index.html' : pathname).slice(1).split('/');
    if (parts.some(part => !part || part === '.' || part === '..' || /[\\:\0]/.test(part))) {
      res.writeHead(400).end();
      return;
    }

    const file = await realpath(path.join(root, ...parts));
    const relative = path.relative(root, file);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
      res.writeHead(404).end();
      return;
    }

    const info = await stat(file);
    if (!info.isFile()) {
      res.writeHead(404).end();
      return;
    }

    res.writeHead(200, {
      'Content-Type': types[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': /[\/]island-surfaces[\/][a-f0-9]{32}\.(png|jpg)$/.test(pathname) ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = createReadStream(file);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : 404).end();
  }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? '5186 端口已被占用。请关闭原沙盘窗口后重试。' : error.message);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log('比特尔特岛  ' + url);
  console.log('关闭此窗口即可退出沙盘。');
  if (process.env.ISLAND_NO_BROWSER === '1') return;

  const browser = spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  browser.on('error', () => console.error('请在浏览器中打开 ' + url));
  browser.unref();
});
