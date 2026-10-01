import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist-full');
createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  try {
    let body;
    let type;
    if (url.pathname === '/') {
      body = (await readFile('demo/index.html', 'utf8'))
        .replace('<html lang="zh-CN">', '<html lang="zh-CN" data-bili-ambient-demo>')
        .replace('0.1.0', '0.2.0 FULL')
        .replace('<body><main>', '<body><div id="biliMainHeader"><div class="bili-header"><div class="bili-header__bar" style="position:fixed;top:0;left:0;width:100%;height:45px;z-index:20;background:#fff"><div class="left-entry"><span>顶栏测试</span><svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="#00aeec"/></svg></div></div></div></div><main>')
        .replace('<div class="bpx-player-video-wrap">', '<div class="bpx-player-video-area" style="position:relative;height:100%;background:#000"><div class="bpx-player-video-perch" style="position:relative;height:100%;display:flex;align-items:center"><div class="bpx-player-video-wrap" style="height:100%;width:100%">')
        .replace('</video></div>', '</video></div></div></div>')
        .replace('<script type="module" src="/bundle.js"></script>', '<script src="/full-shim.js"></script><script src="/full-demo.js"></script><script src="/content.js"></script>');
      type = 'text/html; charset=utf-8';
    } else if (['/full-shim.js','/full-demo.js'].includes(url.pathname)) {
      body = await readFile(`demo${url.pathname}`); type = 'text/javascript';
    } else {
      const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
      if (!file.startsWith(`${root}${path.sep}`)) throw new Error('Invalid path');
      body = await readFile(file);
      type = { '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.html':'text/html' }[path.extname(file)] || 'text/plain';
      if (url.pathname === '/options.html') body = body.toString().replace('<script src="options.js">', '<script src="/full-shim.js"></script><script src="options.js">');
    }
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control':'no-store' }); response.end(body);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(4319, '127.0.0.1', () => console.log('Full engine lab: http://127.0.0.1:4319'));
