import { writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const outDir = join(rootDir, 'out');
const sourceHtaccess = join(rootDir, '.htaccess');
const targetHtaccess = join(outDir, '.htaccess');

try {
  mkdirSync(outDir, { recursive: true });

  const deployUrl = process.env.DEPLOY_URL || process.env.NEXT_PUBLIC_DEPLOY_URL || '';

  if (deployUrl) {
    const redirectTarget = deployUrl;
    const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Site</title>
    <meta http-equiv="refresh" content="0;url=${redirectTarget}">
  </head>
  <body>
    <p>Redirecting to <a href="${redirectTarget}">${redirectTarget}</a></p>
  </body>
</html>`;

    writeFileSync(join(outDir, 'index.html'), indexHtml, 'utf8');
    console.log('Wrote out/index.html (redirect to', deployUrl + ')');
  } else {
    console.log('Skipping writing out/index.html redirect because DEPLOY_URL is not set.');
  }

  if (existsSync(sourceHtaccess)) {
    copyFileSync(sourceHtaccess, targetHtaccess);
    console.log('Copied .htaccess to out/.htaccess');
  } else {
    console.warn('.htaccess not found in project root; skipping copy.');
  }
} catch (err) {
  console.error('Error generating out/ folder:', err);
  process.exit(1);
}
