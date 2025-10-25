const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const svgIcon = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9945FF"/>
      <stop offset="50%" stop-color="#14F195"/>
      <stop offset="100%" stop-color="#00D4FF"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <text x="256" y="280" font-size="256" font-weight="bold" text-anchor="middle" fill="white">⚡</text>
</svg>`;

// Copy to various icon sizes (simplified - in production you'd use a proper image library)
const icons = [
  { name: 'pwa-192x192.png', size: '192x192' },
  { name: 'pwa-512x512.png', size: '512x512' },
  { name: 'apple-touch-icon.png', size: '180x180' },
  { name: 'favicon-32x32.png', size: '32x32' },
  { name: 'favicon-16x16.png', size: '16x16' }
];

// Create masked icon SVG
const maskedIcon = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#9945FF"/>
  <text x="256" y="280" font-size="256" font-weight="bold" text-anchor="middle" fill="white">⚡</text>
</svg>`;

const publicDir = path.join(__dirname, '../client/public');

// For now, create placeholder files with instructions
icons.forEach(icon => {
  const filePath = path.join(publicDir, icon.name);
  if (!fs.existsSync(filePath)) {
    console.log(`Please create ${icon.name} (${icon.size}) manually or use an online tool`);
  }
});

// Create masked icon SVG
fs.writeFileSync(path.join(publicDir, 'masked-icon.svg'), maskedIcon);
console.log('✅ Created masked-icon.svg');

console.log('\n📝 Note: You need to create PNG icons manually or use the HTML generator I created.');
console.log('For now, PWA will work but icons will be missing until you add them.');

