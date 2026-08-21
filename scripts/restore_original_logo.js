const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function restoreOriginalLogo() {
  const originalLogoPath = path.resolve(__dirname, '../public/Picsart_26-02-28_15-00-18-140.png');

  if (!fs.existsSync(originalLogoPath)) {
    console.error('Original logo file not found!');
    return;
  }

  // 1. Trim transparent borders tightly around the original logo
  const trimmedLogoBuffer = await sharp(originalLogoPath)
    .trim()
    .png()
    .toBuffer();

  // 2. Restore main website logos (Logo1.png, logo2.png, logo.png, next-gear-login-logo.png)
  const siteTargets = [
    'public/Logo1.png',
    'public/logo2.png',
    'public/logo.png',
    'public/next-gear-login-logo.png',
  ];

  for (const t of siteTargets) {
    const fullPath = path.resolve(__dirname, '..', t);
    fs.writeFileSync(fullPath, trimmedLogoBuffer);
    console.log(`[RESTORED] Site logo: ${t}`);
  }

  // 3. Generate clean transparent site icon (favicon) with NO red circle and NO black disc
  const favicon512 = await sharp(trimmedLogoBuffer)
    .resize(500, 500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, quality: 90 })
    .toBuffer();

  const favicon32 = await sharp(trimmedLogoBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, quality: 85 })
    .toBuffer();

  const iconTargets = [
    { path: 'src/app/icon.png', buf: favicon512 },
    { path: 'public/icon.png', buf: favicon512 },
    { path: 'src/app/apple-icon.png', buf: favicon512 },
    { path: 'public/apple-icon.png', buf: favicon512 },
    { path: 'src/app/favicon.ico', buf: favicon32 },
    { path: 'public/favicon.ico', buf: favicon32 },
  ];

  for (const item of iconTargets) {
    const fullPath = path.resolve(__dirname, '..', item.path);
    fs.writeFileSync(fullPath, item.buf);
    console.log(`[RESTORED] Clean transparent icon (no circle): ${item.path}`);
  }

  console.log('Original logos and clean icons restored successfully!');
}

restoreOriginalLogo().catch(console.error);
