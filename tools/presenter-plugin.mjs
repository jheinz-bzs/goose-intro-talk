import fs from 'node:fs';
import path from 'node:path';

const PAGES = {'/audience': '/audience.html', '/presenter': '/presenter.html'};
const NOTES_ENDPOINT = '/api/live-notes';
const NOTES_FILE = 'notes/live-notes.json';

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// The Canvas Commons plugin only claims "/" and project names, so these
// routes are rewritten to the root HTML files before Vite's own fallback.
export default function presenterPages() {
  const install = server => {
    const file = path.resolve(server.config.root, NOTES_FILE);

    server.middlewares.use(async (req, res, next) => {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;

      if (PAGES[pathname]) {
        req.url = PAGES[pathname];
        return next();
      }
      if (pathname !== NOTES_ENDPOINT) return next();

      res.setHeader('Content-Type', 'application/json');
      try {
        if (req.method === 'GET') {
          res.end(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '{}');
        } else if (req.method === 'POST') {
          const body = JSON.parse(await readBody(req));
          fs.mkdirSync(path.dirname(file), {recursive: true});
          fs.writeFileSync(file, JSON.stringify(body, null, 2) + '\n');
          res.end('{"ok":true}');
        } else {
          res.statusCode = 405;
          res.end('{"error":"method not allowed"}');
        }
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({error: String(error)}));
      }
    });
  };

  return {
    name: 'presenter-pages',
    configureServer: install,
    configurePreviewServer: install,
  };
}
