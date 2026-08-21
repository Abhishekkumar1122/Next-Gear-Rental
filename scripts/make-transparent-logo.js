const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processLogo() {
  const inputPath = 'C:\\Users\\abhis\\.gemini\\antigravity-ide\\brain\\bd854cc3-17ce-4ee4-b5d1-ed57c889c5b9\\media__1786128554263.png';
  
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Extract raw RGBA pixels
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 22; // Pixels darker than threshold become transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (r <= threshold && g <= threshold && b <= threshold) {
      data[i + 3] = 0; // Set Alpha to 0 (transparent)
    }
  }

  // Create transparent PNG buffer
  const transparentBuffer = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
  .trim() // Trim transparent edges so logo emblem is centered & maximized
  .png()
  .toBuffer();

  const targets = [
    'public/logo2.png',
    'public/logo.png',
    'public/Logo1.png',
    'public/next-gear-login-logo.png',
    'public/icon.png',
    'src/app/icon.png',
    'src/app/apple-icon.png',
    'public/apple-icon.png',
    'public/favicon.ico',
    'src/app/favicon.ico',
  ];

  for (const target of targets) {
    const fullPath = path.resolve(__dirname, '..', target);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    
    if (target.includes('icon.png') || target.includes('favicon')) {
      // Create high-res 512x512 square icon with transparent padding
      await sharp(transparentBuffer)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(fullPath);
    } else {
      fs.writeFileSync(fullPath, transparentBuffer);
    }
    console.log(`Saved transparent logo to: ${target}`);
  }
  console.log('All transparent logo and favicon assets generated successfully!');
}

processLogo().catch(console.error);
