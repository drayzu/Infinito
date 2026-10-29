import { defineConfig, type Plugin } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, sep } from 'node:path';

/**
 * Dev only: the studies can save what they render (contact sheets, frames) into the project, so
 * captures land as files without a screenshot tool. POST /__guardar?f=docs/estudios/x.jpg with the
 * image bytes as the body. Paths stay inside docs/ and capturas/.
 */
function guardar(): Plugin {
  return {
    name: 'guardar',
    configureServer(server) {
      server.middlewares.use('/__guardar', (req, res) => {
        const f = new URL(req.url ?? '', 'http://x').searchParams.get('f') ?? '';
        const rel = normalize(f);
        const top = rel.split(sep)[0];
        if (req.method !== 'POST' || (top !== 'docs' && top !== 'capturas') || rel.includes('..')) {
          res.statusCode = 400;
          res.end('no');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const out = join(server.config.root, rel);
          mkdirSync(dirname(out), { recursive: true });
          writeFileSync(out, Buffer.concat(chunks));
          res.end('ok');
        });
      });
    },
  };
}

// Infinito: the journey (index.html) and the phase-0 studies (estudios/). Port 5203.
export default defineConfig({
  base: './',
  plugins: [guardar()],
  server: { port: 5203 },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        estudios: 'estudios/index.html',
        doble: 'estudios/doble.html',
      },
    },
  },
});
