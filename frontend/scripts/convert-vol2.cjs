const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.resolve(__dirname, '../../../goc tcg/vol 2');
const outputDir = path.resolve(__dirname, '../public/images/vol2');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.match(/\.(png|jpe?g)$/i)) {
      let relativePath = path.relative(inputDir, filePath);
      
      // We want to flatten the structure slightly or preserve it. Let's just flatten to lowercase base names
      // to make it easier to reference.
      const baseName = path.basename(file, path.extname(file)).toLowerCase();
      const newFileName = `${baseName}.webp`;
      const outputPath = path.join(outputDir, newFileName);

      console.log(`Converting ${relativePath} to ${newFileName}...`);

      sharp(filePath)
        .webp({ quality: 80 })
        .toFile(outputPath)
        .then(() => {
          console.log(`Successfully converted ${newFileName}`);
        })
        .catch(err => {
          console.error(`Error converting ${filePath}:`, err);
        });
    }
  });
}

processDirectory(inputDir);
