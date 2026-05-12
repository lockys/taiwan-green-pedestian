import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = 'dist';
const editorDir = join(distDir, 'editor');
const rootHtml = join(distDir, 'index.html');
const modernHtml = join(distDir, 'html', 'index', 'index.html');
const customDomain = 'green-ped.calvinjeng.io';

mkdirSync(editorDir, { recursive: true });

if (!existsSync(rootHtml) && existsSync(modernHtml)) {
  copyFileSync(modernHtml, rootHtml);
}

copyFileSync(rootHtml, join(editorDir, 'index.html'));
copyFileSync(rootHtml, join(distDir, '404.html'));
writeFileSync(join(distDir, '.nojekyll'), '');
writeFileSync(join(distDir, 'CNAME'), `${customDomain}\n`);
