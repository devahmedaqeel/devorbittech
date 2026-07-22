const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'images', 'logo.jpg');
const dest1 = path.join(__dirname, 'favicon.ico');
const dest2 = path.join(__dirname, 'frontend', 'favicon.ico');
const dest3 = path.join(__dirname, 'frontend', 'images', 'logo.jpg');

fs.mkdirSync(path.join(__dirname, 'frontend', 'images'), { recursive: true });

fs.copyFileSync(src, dest1);
fs.copyFileSync(src, dest2);
fs.copyFileSync(src, dest3);

console.log('Favicon copied successfully to all target locations.');
