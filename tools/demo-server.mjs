import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';

await mkdir('demo', { recursive: true });
const bundle = await rollup({ input: 'demo/demo.js', plugins: [resolve()] });
await bundle.write({ file: 'demo/bundle.js', format: 'es', sourcemap: true });
await bundle.close();
const files = new Map([
  ['/', ['demo/index.html', 'text/html; charset=utf-8']],
  ['/bundle.js', ['demo/bundle.js', 'text/javascript; charset=utf-8']],
  ['/theme.css', ['src/bilibili/theme.css', 'text/css; charset=utf-8']],
]);
createServer(async (request, response) => {
  const entry = files.get(new URL(request.url, 'http://localhost').pathname);
  if (!entry) { response.writeHead(404); response.end('Not found'); return; }
  try {
    response.writeHead(200, { 'Content-Type': entry[1], 'Cache-Control': 'no-store' });
    response.end(await readFile(entry[0]));
  } catch { response.writeHead(500); response.end('Read error'); }
}).listen(4318, '127.0.0.1', () => console.log('Local playback lab: http://127.0.0.1:4318'));
