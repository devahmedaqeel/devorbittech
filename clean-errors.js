const fs = require('fs');
const path = require('path');

const root404 = path.join(__dirname, '404.html');
const root500 = path.join(__dirname, '500.html');

if (fs.existsSync(root404)) fs.unlinkSync(root404);
if (fs.existsSync(root500)) fs.unlinkSync(root500);

console.log('Root duplicate 404.html and 500.html removed.');
