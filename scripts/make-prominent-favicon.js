const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createProminentFavicon() {
  const inputPath = 'C:\\Users\\abhis\\.gemini\\antigravity-ide\\brain\\bd854cc3-17ce-4ee4-b5d1-ed57c889c5b9\\media__1786128554263.png';
  
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Extract raw RGBA pixels
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 28; // Pixels darker than threshold become transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (r <= threshold && g <= threshold && b <= threshold) {
      data[i + 3] = 0; // Transparent
    }
  }

  // Create transparent buffer and trim tightly to the graphic
  const trimmedEmblem = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
  .trim() // Tightly trim transparent borders
  .png()
  .toBuffer();

  // Create high-res 512x512 square icon with maximum size (fills 96% of the tab icon space)
  const bigFaviconBuffer = await sharp(trimmedEmblem)
    .resize(500, 500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 6,
      bottom: 6,
      left: 6,
      right: 6,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const iconTargets = [
    'src/app/icon.png',
    'public/icon.png',
    'src/app/apple-icon.png',
    'public/apple-icon.png',
    'public/favicon.ico',
    'src/app/favicon.ico',
    'public/Logo1.png',
  ];

  for (const target of iconTargets) {
    const fullPath = path.resolve(__dirname, '..', target);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, bigFaviconBuffer);
    console.log(`Saved big prominent icon to: ${target}`);
  }
  console.log('Big prominent tab favicon created successfully!');
}

createProminentFavicon().catch(console.error);
