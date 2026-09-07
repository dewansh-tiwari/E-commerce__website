import fs from 'fs';
import path from 'path';
import https from 'https';

const cakeImages = [
  {
    name: 'dutch-truffle-cake.jpg',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'theobroma-chocolate-cake.jpg',
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'red-velvet-cake.jpg',
    url: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'black-forest-cake.jpg',
    url: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'fresh-fruit-cake.jpg',
    url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'blueberry-cheesecake.jpg',
    url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'choco-lava-cake.jpg',
    url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&auto=format&fit=crop&q=80'
  },
  {
    name: 'butterscotch-crunch-cake.jpg',
    url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&auto=format&fit=crop&q=80'
  }
];

const destDir = path.resolve('../frontend/public/products/official');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(dest);
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  console.log('Downloading Swiggy Instamart cakes images to', destDir);
  for (const item of cakeImages) {
    const dest = path.join(destDir, item.name);
    try {
      await download(item.url, dest);
      console.log(`✓ Downloaded ${item.name}`);
    } catch (err) {
      console.error(`✗ Error downloading ${item.name}:`, err.message);
    }
  }
  console.log('Done downloading cake images!');
}

run();
