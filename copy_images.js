const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\0a1b3137-6c59-4ef9-ba11-931ade2cb715';
const destDir = path.join(__dirname, 'images');
const frontendDestDir = path.join(__dirname, 'frontend', 'images');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
if (!fs.existsSync(frontendDestDir)) fs.mkdirSync(frontendDestDir, { recursive: true });

const filesToCopy = [
  { src: 'medireport_ai_preview_1784748580744.png', dest: 'medireport-ai-preview.png' },
  { src: 'blissful_blinds_preview_1784748601218.png', dest: 'blissfulblinds-preview.png' },
  { src: 'devsync_ai_preview_1784748623980.png', dest: 'devsync-ai-preview.png' },
  { src: 'ofm_mobile_preview_1784748643238.png', dest: 'ofm-preview.png' },
  { src: 'devorbittech_platform_preview_1784749289560.png', dest: 'devorbittech-platform-preview.png' },
  { src: 'portfolio_banner_preview_1784749168719.png', dest: 'portfolio-banner-preview.png' }
];

filesToCopy.forEach(item => {
  const fullSrc = path.join(srcDir, item.src);
  const fullDest = path.join(destDir, item.dest);
  const fullFrontendDest = path.join(frontendDestDir, item.dest);

  if (fs.existsSync(fullSrc)) {
    fs.copyFileSync(fullSrc, fullDest);
    fs.copyFileSync(fullSrc, fullFrontendDest);
    console.log(`Copied ${item.src} -> ${item.dest}`);
  } else {
    console.warn(`File not found: ${fullSrc}`);
  }
});

// Also copy logo.jpg and founder.jpg to frontend/images if missing
['logo.jpg', 'founder.jpg'].forEach(file => {
  const s = path.join(destDir, file);
  const d = path.join(frontendDestDir, file);
  if (fs.existsSync(s)) fs.copyFileSync(s, d);
});

console.log('Image copy script completed successfully.');
