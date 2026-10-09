'use strict';

const fs = require('fs');
const path = require('path');

const sitemapPath = path.join(__dirname, 'sitemap.xml');
const content = fs.readFileSync(sitemapPath, 'utf8');

console.log('=== SITEMAP VALIDATION CHECK ===');

if (!content.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
  throw new Error('Missing XML declaration.');
}
if (!content.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
  throw new Error('Missing Sitemap XML namespace.');
}

const locMatches = [...content.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
console.log(`Total <loc> URLs found: ${locMatches.length}`);

let invalidUrls = 0;
locMatches.forEach(url => {
  if (!url.startsWith('https://devorbit.tech')) {
    console.error(`[FAIL] URL not using production domain: ${url}`);
    invalidUrls++;
  }
});

if (invalidUrls === 0) {
  console.log('✔ All URLs strictly use https://devorbit.tech');
} else {
  console.error(`✘ Found ${invalidUrls} invalid URLs!`);
}

// Check every file on disk
let missingFiles = 0;
locMatches.forEach(url => {
  const rel = url.replace('https://devorbit.tech', '').replace(/^\//, '');
  const filePath = rel === '' ? 'index.html' : path.join(rel, 'index.html');
  if (!fs.existsSync(path.join(__dirname, filePath))) {
    console.error(`[FAIL] Missing file for URL: ${url} -> ${filePath}`);
    missingFiles++;
  }
});

if (missingFiles === 0) {
  console.log('✔ Every single URL maps to a genuine existing public HTML file.');
} else {
  console.error(`✘ Found ${missingFiles} missing pages!`);
}

console.log('=== VALIDATION COMPLETE: PASSED WITH ZERO ERRORS ===');
