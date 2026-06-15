const fs = require('fs');
const https = require('https');
const path = require('path');

const imagesDir = path.join(__dirname, '..', 'frontend', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const files = [
  'rice.jpg', 'flour.jpg', 'milk.jpg', 'bread.jpg', 'eggs.jpg',
  'potatoes.jpg', 'onions.jpg', 'tomatoes.jpg', 'bananas.jpg', 'apples.jpg',
  'oil.jpg', 'sugar.jpg', 'salt.jpg', 'biscuits.jpg', 'tea.jpg'
];

console.log('Downloading placeholder images...');

let count = 0;
files.forEach((file) => {
  const url = `https://picsum.photos/seed/${file}/400/300`;
  const filePath = path.join(imagesDir, file);
  
  // Follow redirects (Picsum redirects to actual image)
  https.get(url, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      https.get(res.headers.location, (imgRes) => {
        imgRes.pipe(fs.createWriteStream(filePath));
        imgRes.on('end', () => {
          console.log(`✅ Downloaded ${file}`);
          count++;
          if (count === files.length) {
            console.log('🎉 All images downloaded successfully!');
          }
        });
      });
    } else {
      res.pipe(fs.createWriteStream(filePath));
      res.on('end', () => {
        console.log(`✅ Downloaded ${file}`);
        count++;
        if (count === files.length) {
          console.log('🎉 All images downloaded successfully!');
        }
      });
    }
  }).on('error', (err) => {
    console.error(`❌ Failed to download ${file}: ${err.message}`);
  });
});
