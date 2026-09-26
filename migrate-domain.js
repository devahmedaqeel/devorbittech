/**
 * DEV ORBIT TECH — DOMAIN MIGRATION UTILITY
 * 
 * Use this script ONLY in the future when your custom domain (devorbittech.org)
 * is fully verified, DNS-connected, and active on Vercel.
 * 
 * Usage:
 *   node migrate-domain.js --to-org       # Switches canonicals, sitemap, and OG to devorbittech.org
 *   node migrate-domain.js --to-vercel    # Switches canonicals, sitemap, and OG back to devorbittech.vercel.app
 */

const fs = require('fs');
const path = require('path');

const root = __dirname;
const targetDomainArg = process.argv[2];

const VERCEL_DOMAIN = 'https://devorbittech.vercel.app';
const ORG_DOMAIN    = 'https://devorbittech.org';

let fromDomain, toDomain;
if (targetDomainArg === '--to-org') {
  fromDomain = VERCEL_DOMAIN;
  toDomain   = ORG_DOMAIN;
  console.log(`\n🔄 Switching domain to: ${ORG_DOMAIN} ...\n`);
} else if (targetDomainArg === '--to-vercel') {
  fromDomain = ORG_DOMAIN;
  toDomain   = VERCEL_DOMAIN;
  console.log(`\n🔄 Switching domain to: ${VERCEL_DOMAIN} ...\n`);
} else {
  console.log(`
Usage:
  node migrate-domain.js --to-org       (Switch canonicals to https://devorbittech.org)
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
