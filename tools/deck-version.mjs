import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Changes whenever a scene or the scene list changes, which invalidates cached thumbnails.
export function deckVersion(root = process.cwd()) {
  const hash = crypto.createHash('sha1');
  const files = [path.join(root, 'src/scene-list.ts'), path.join(root, 'src/project.meta')];
  const scenes = path.join(root, 'src/scenes');
  for (const name of fs.readdirSync(scenes).sort()) files.push(path.join(scenes, name));
  for (const file of files) hash.update(file).update(fs.readFileSync(file));
  return hash.digest('hex').slice(0, 12);
}
