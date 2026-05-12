import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = 'dist';
const editorDir = join(distDir, 'editor');

mkdirSync(editorDir, { recursive: true });
copyFileSync(join(distDir, 'index.html'), join(editorDir, 'index.html'));
copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'));
writeFileSync(join(distDir, '.nojekyll'), '');
