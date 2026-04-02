// Genererar alla ikonvarianter från assets/ic_launcher.png
// Kör med: node generate-icons.js

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, 'assets', 'ic_launcher.png');

async function resize(src, dest, size, { flatten = false } = {}) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  let pipeline = sharp(src).resize(size, size);
  if (flatten) pipeline = pipeline.flatten({ background: '#ffffff' });
  await pipeline.png().toFile(dest);
  console.log(`  ${size}x${size} → ${dest}`);
}

async function resizeRound(src, dest, size) {
  // Scale content to 85% and center in canvas so edge rings aren't clipped
  const contentSize = Math.round(size * 0.85);
  const pad = Math.floor((size - contentSize) / 2);
  const circle = Buffer.from(
    `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}"/></svg>`
  );
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(src)
    .resize(contentSize, contentSize)
    .extend({
      top: pad, bottom: size - contentSize - pad,
      left: pad, right: size - contentSize - pad,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .composite([{ input: circle, blend: 'dest-in' }])
    .png()
    .toFile(dest);
  console.log(`  ${size}x${size} round → ${dest}`);
}

async function main() {
  // Android mipmap sizes
  const android = [
    { dir: 'mipmap-mdpi',    size: 48  },
    { dir: 'mipmap-hdpi',    size: 72  },
    { dir: 'mipmap-xhdpi',   size: 96  },
    { dir: 'mipmap-xxhdpi',  size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  // Adaptive icon foreground sizes (108dp scale, content in center 72dp)
  const foregroundSizes = {
    'mipmap-mdpi':    108,
    'mipmap-hdpi':    162,
    'mipmap-xhdpi':   216,
    'mipmap-xxhdpi':  324,
    'mipmap-xxxhdpi': 432,
  };

  const base = 'android/app/src/main/res';

  console.log('Android ikoner...');
  for (const { dir, size } of android) {
    await resize(SRC, `${base}/${dir}/ic_launcher.png`, size);
    await resizeRound(SRC, `${base}/${dir}/ic_launcher_round.png`, size);
    await resize(SRC, `${base}/${dir}/ic_launcher_foreground.png`, foregroundSizes[dir]);
  }

  // iOS AppIcon
  const iosIcons = [
    { name: 'Icon-20@1x.png',   size: 20  },
    { name: 'Icon-20@2x.png',   size: 40  },
    { name: 'Icon-20@3x.png',   size: 60  },
    { name: 'Icon-29@1x.png',   size: 29  },
    { name: 'Icon-29@2x.png',   size: 58  },
    { name: 'Icon-29@3x.png',   size: 87  },
    { name: 'Icon-40@1x.png',   size: 40  },
    { name: 'Icon-40@2x.png',   size: 80  },
    { name: 'Icon-40@3x.png',   size: 120 },
    { name: 'Icon-60@2x.png',   size: 120 },
    { name: 'Icon-60@3x.png',   size: 180 },
    { name: 'Icon-76@1x.png',   size: 76  },
    { name: 'Icon-76@2x.png',   size: 152 },
    { name: 'Icon-83.5@2x.png', size: 167 },
    { name: 'Icon-1024@1x.png', size: 1024},
  ];

  const iosBase = 'ios/TimerApp/Images.xcassets/AppIcon.appiconset';
  console.log('\niOS AppIcon...');
  for (const { name, size } of iosIcons) {
    await resize(SRC, `${iosBase}/${name}`, size, { flatten: true });
  }

  // iOS SplashIcon
  const splashBase = 'ios/TimerApp/Images.xcassets/SplashIcon.imageset';
  console.log('\niOS SplashIcon...');
  await resize(SRC, `${splashBase}/Icon-60@2x.png`, 120, { flatten: true });
  await resize(SRC, `${splashBase}/Icon-60@3x.png`, 180, { flatten: true });

  console.log('\nKlart!');
}

main().catch(err => { console.error(err); process.exit(1); });
