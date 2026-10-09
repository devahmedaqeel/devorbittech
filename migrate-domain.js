/**
 * DEV ORBIT TECH — DOMAIN MIGRATION UTILITY
 * 
 * Production Domain: https://devorbit.tech
 * Legacy Domain:     https://devorbittech.vercel.app
 * 
 * Usage:
 *   node migrate-domain.js --to-prod      # Switches canonicals, sitemap, and OG to https://devorbit.tech
 *   node migrate-domain.js --to-vercel    # Switches canonicals, sitemap, and OG back to https://devorbittech.vercel.app
 */

const fs = require('fs');
const path = require('path');

const root = __dirname;
const targetDomainArg = process.argv[2];

const PROD_DOMAIN   = 'https://devorbit.tech';
const VERCEL_DOMAIN = 'https://devorbittech.vercel.app';

let fromDomain, toDomain;
if (targetDomainArg === '--to-prod') {
  fromDomain = VERCEL_DOMAIN;
  toDomain   = PROD_DOMAIN;
  console.log(`\n🔄 Switching domain to production: ${PROD_DOMAIN} ...\n`);
} else if (targetDomainArg === '--to-vercel') {
  fromDomain = PROD_DOMAIN;
  toDomain   = VERCEL_DOMAIN;
  console.log(`\n🔄 Switching domain to Vercel: ${VERCEL_DOMAIN} ...\n`);
} else {
  console.log(`
Usage:
  node migrate-domain.js --to-prod      (Switch canonicals to https://devorbit.tech)
  node migrate-domain.js --to-vercel    (Switch canonicals to https://devorbittech.vercel.app)
  `);
  process.exit(0);
}

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(fromDomain)) {
    content = content.split(fromDomain).join(toDomain);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Updated ${path.relative(root, filePath)}`);
  }
}

function walk(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && item.name !== 'node_modules' && !item.name.startsWith('.')) {
      walk(full);
    } else if (item.isFile() && (item.name.endsWith('.html') || item.name.endsWith('.xml') || item.name === 'robots.txt')) {
      replaceInFile(full);
    }
  }
}

walk(root);
console.log(`\n✅ Domain migration complete!\n`);
