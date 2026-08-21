const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createCircularBlackFavicon() {
  const inputPath = 'C:\\Users\\abhis\\.gemini\\antigravity-ide\\brain\\bd854cc3-17ce-4ee4-b5d1-ed57c889c5b9\\media__1786128554263.png';
  
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Extract raw RGBA pixels to make background transparent first
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 28;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (r <= threshold && g <= threshold && b <= threshold) {
      data[i + 3] = 0; // Transparent
    }
  }

  // Tightly trimmed transparent emblem
  const trimmedEmblem = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
  .trim()
  .png()
  .toBuffer();

  // Create an elegant SVG Circular Black Badge with subtle Red Halo Border
  const circleSvg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="252" fill="#060608" stroke="#ef4444" stroke-width="8" />
    </svg>
  `;

  // Scale emblem to fit comfortably and boldly inside the circle
  const resizedEmblem = await sharp(trimmedEmblem)
    .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Composite the circle background with the transparent logo emblem
  const circularIcon512 = await sharp(Buffer.from(circleSvg))
    .composite([
      {
        input: resizedEmblem,
        gravity: 'center',
      }
    ])
    .png({ compressionLevel: 9, quality: 90 })
    .toBuffer();

  // Create 32x32 compact favicon
  const circularIcon32 = await sharp(circularIcon512)
    .resize(32, 32, { fit: 'contain' })
    .png({ compressionLevel: 9, quality: 85 })
    .toBuffer();

  const iconTargets = [
    { path: 'src/app/icon.png', buf: circularIcon512 },
    { path: 'public/icon.png', buf: circularIcon512 },
    { path: 'src/app/apple-icon.png', buf: circularIcon512 },
    { path: 'public/apple-icon.png', buf: circularIcon512 },
    { path: 'src/app/favicon.ico', buf: circularIcon32 },
    { path: 'public/favicon.ico', buf: circularIcon32 },
    { path: 'public/Logo1.png', buf: circularIcon512 },
  ];

  for (const target of iconTargets) {
    const fullPath = path.resolve(__dirname, '..', target.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, target.buf);
    const stat = fs.statSync(fullPath);
    console.log(`Saved circular black icon to: ${target.path} (${(stat.size / 1024).toFixed(1)} KB)`);
  }
  console.log('Circular black badge favicon created successfully!');
}

createCircularBlackFavicon().catch(console.error);
