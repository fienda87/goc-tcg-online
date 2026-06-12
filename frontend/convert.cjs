const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDir = path.join(__dirname, 'public', 'images');

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile() && fullPath.toLowerCase().endsWith('.png')) {
      const webpPath = fullPath.replace(/\.png$/i, '.webp');
      console.log(`Converting: ${fullPath} -> ${webpPath}`);
      try {
        await sharp(fullPath)
          .webp({ quality: 80 })
          .toFile(webpPath);
        console.log(`Success, deleting original: ${fullPath}`);
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error(`Error converting ${fullPath}:`, err);
      }
    }
  }
}

async function run() {
  console.log('Starting conversion...');
  await processDirectory(targetDir);
  console.log('Done!');
}

run();
