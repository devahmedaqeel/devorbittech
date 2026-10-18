'use strict';

/**
 * Dev Orbit Tech — Automated Sitemap Generator
 * Reads central domain configuration from site.config.js or process.env.SITE_URL.
 * Discovers all public indexable pages and compiles sitemap.xml.
 */

const fs = require('fs');
const path = require('path');
const config = require('./site.config');

const root = __dirname;
const siteUrl = config.siteUrl;

console.log(`[Sitemap Generator] Compiling sitemap using domain: ${siteUrl}`);

// Define known core priorities and frequencies
function getRouteMetadata(route) {
  if (route === '/') {
    return { changefreq: 'weekly', priority: '1.0' };
  }
  if (route === '/about' || route === '/global-software-development') {
    return { changefreq: 'monthly', priority: '0.85' };
  }
  if (route === '/services' || route === '/projects') {
    return { changefreq: 'monthly', priority: '0.95' };
  }
  if (route === '/contact' || route === '/training') {
    return { changefreq: 'monthly', priority: '0.85' };
  }
  if (route === '/case-studies' || route === '/blog') {
    return { changefreq: 'weekly', priority: '0.90' };
  }
  if (route.startsWith('/services/')) {
    if (route.includes('ui-ux-design')) return { changefreq: 'monthly', priority: '0.85' };
    return { changefreq: 'monthly', priority: '0.95' };
  }
  if (route.startsWith('/blog/')) {
    if (route.includes('cost') || route.includes('create-a-website') || route.includes('professional-company-website')) {
      return { changefreq: 'monthly', priority: '0.85' };
    }
    return { changefreq: 'monthly', priority: '0.80' };
  }
  return { changefreq: 'monthly', priority: '0.80' };
}

function findIndexableHtmlFiles(dir, list = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name === 'node_modules' || item.name === 'frontend' || item.name.startsWith('.')) {
      continue;
    }
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      findIndexableHtmlFiles(full, list);
    } else if (item.isFile() && item.name.endsWith('.html')) {
      // Exclude error pages
      if (item.name === '404.html' || item.name === '500.html') continue;
      list.push(full);
    }
  }
  return list;
}

const htmlFiles = findIndexableHtmlFiles(root);
const entries = [];

htmlFiles.forEach(file => {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  let route = '';
  if (rel === 'index.html') {
    route = '/';
  } else if (rel.endsWith('/index.html')) {
    route = '/' + rel.replace(/\/index\.html$/, '');
  } else if (rel.endsWith('.html')) {
    route = '/' + rel.replace(/\.html$/, '');
  }

  const stat = fs.statSync(file);
  const lastmod = stat.mtime.toISOString().split('T')[0];
  const meta = getRouteMetadata(route);

  entries.push({
    loc: `${siteUrl}${route === '/' ? '/' : route}`,
    lastmod,
    changefreq: meta.changefreq,
    priority: meta.priority,
    route
  });
});

// Sort entries logically: homepage first, then hubs, then services, then blog
entries.sort((a, b) => {
  if (a.route === '/') return -1;
  if (b.route === '/') return 1;
  const rank = r => {
    if (r === '/about') return 1;
    if (r === '/global-software-development') return 2;
    if (r === '/case-studies') return 3;
    if (r === '/blog') return 4;
    if (r.startsWith('/services/')) return 5;
    if (r.startsWith('/blog/')) return 6;
    return 7;
  };
  const diff = rank(a.route) - rank(b.route);
  if (diff !== 0) return diff;
  return a.route.localeCompare(b.route);
});

// Build XML content
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

let currentCategory = '';
entries.forEach(item => {
  let cat = '';
  if (item.route === '/' || item.route === '/about' || item.route === '/global-software-development' || item.route === '/case-studies' || item.route === '/blog') {
    cat = 'Core Company Pages';
  } else if (item.route.startsWith('/services/')) {
    cat = 'Dedicated Service Pages';
  } else if (item.route.startsWith('/blog/')) {
    cat = 'Technical Blog Articles';
  }

  if (cat && cat !== currentCategory) {
    currentCategory = cat;
    xml += `\n  <!-- ${cat} -->\n`;
  }

  xml += `  <url>\n`;
  xml += `    <loc>${item.loc}</loc>\n`;
  xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
  xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
  xml += `    <priority>${item.priority}</priority>\n`;
  xml += `  </url>\n`;
});

xml += `</urlset>\n`;

// Write to root and frontend/
fs.writeFileSync(path.join(root, 'sitemap.xml'), xml, 'utf8');
console.log(`  ✓ Written ${entries.length} URLs to sitemap.xml`);

const frontendSitemap = path.join(root, 'frontend', 'sitemap.xml');
if (fs.existsSync(path.join(root, 'frontend'))) {
  fs.writeFileSync(frontendSitemap, xml, 'utf8');
  console.log(`  ✓ Written ${entries.length} URLs to frontend/sitemap.xml`);
}

console.log(`[Sitemap Generator] Complete. Total verified pages: ${entries.length}`);
