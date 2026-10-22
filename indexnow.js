'use strict';

/**
 * Dev Orbit Tech — IndexNow Submitter
 * Sends every URL in sitemap.xml to IndexNow (Bing, Yandex, Seznam, Naver...).
 * Bing's index also feeds ChatGPT Search and Microsoft Copilot.
 *
 * Usage (after deploying): npm run indexnow
 */

const fs = require('fs');
const path = require('path');
const config = require('./site.config');

const root = __dirname;
const keyFile = fs.readdirSync(root).find(f => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) {
  console.error('IndexNow key file (<32 hex chars>.txt) not found in project root.');
  process.exit(1);
}
const key = fs.readFileSync(path.join(root, keyFile), 'utf8').trim();
const host = new URL(config.siteUrl).host;
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

(async () => {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `${config.siteUrl}/${keyFile}`, urlList })
  });
  console.log(`[IndexNow] Submitted ${urlList.length} URLs for ${host} → HTTP ${res.status}`);
  if (!res.ok && res.status !== 202) process.exit(1);
})();
