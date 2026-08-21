const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function optimizeIcons() {
  const iconPath = 'src/app/icon.png';
  if (!fs.existsSync(iconPath)) return;

  const image = sharp(iconPath);
  
  // Compress 32x32 for super fast favicon (1-2 KB)
  const buf32 = await sharp(iconPath)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, quality: 85 })
    .toBuffer();

  // Compress 192x192 for high-res crisp tab icon (12-18 KB instead of 897 KB)
  const buf192 = await sharp(iconPath)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, quality: 85 })
    .toBuffer();

  const files = [
    { path: 'src/app/icon.png', buf: buf192 },
    { path: 'public/icon.png', buf: buf192 },
    { path: 'src/app/apple-icon.png', buf: buf192 },
    { path: 'public/apple-icon.png', buf: buf192 },
    { path: 'public/favicon.ico', buf: buf32 },
    { path: 'src/app/favicon.ico', buf: buf32 },
  ];

  for (const f of files) {
    const fullPath = path.resolve(__dirname, '..', f.path);
    fs.writeFileSync(fullPath, f.buf);
    const stat = fs.statSync(fullPath);
    console.log(`Optimized ${f.path}: ${(stat.size / 1024).toFixed(1)} KB`);
  }
  console.log('All icons optimized for lightning fast loading!');
}

optimizeIcons().catch(console.error);
