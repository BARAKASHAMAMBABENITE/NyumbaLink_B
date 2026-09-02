import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/pwa-icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  console.log('Generating PNG icons from SVG...');

  // 1. 192x192 PWA standard icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-icon-192.png');
  console.log('Generated public/pwa-icon-192.png');

  // 2. 512x512 PWA splash / high-res icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-icon-512.png');
  console.log('Generated public/pwa-icon-512.png');

  // 3. 180x180 Apple Touch Icon for iOS Safari / Add to Home Screen
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Generated public/apple-touch-icon.png');

  // 4. 32x32 standard browser favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.png');
  console.log('Generated public/favicon.png');

  // 5. OpenGraph preview banner (1200x630) with rich branding
  const ogSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="nyumbaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF4B6E"/>
        <stop offset="35%" stop-color="#FF385C"/>
        <stop offset="70%" stop-color="#E61E4D"/>
        <stop offset="100%" stop-color="#D70466"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#FF385C" flood-opacity="0.4"/>
      </filter>
    </defs>

    <rect width="1200" height="630" fill="url(#bg)"/>
    
    <!-- Decorative subtle ambient circles -->
    <circle cx="200" cy="150" r="280" fill="#FF385C" fill-opacity="0.08" filter="blur(60px)"/>
    <circle cx="1000" cy="480" r="320" fill="#FBBF24" fill-opacity="0.05" filter="blur(80px)"/>

    <!-- Left Badge Icon -->
    <g transform="translate(140, 165)" filter="url(#glow)">
      <rect x="0" y="0" width="300" height="300" rx="68" fill="url(#nyumbaGrad)"/>
      <rect x="2" y="2" width="296" height="296" rx="66" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.3"/>
      <g transform="translate(32, 32) scale(9.8)">
        <path d="M14 6.5V4h4v5" stroke="#FBBF24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M10 21v-4a2 2 0 012-2h0a2 2 0 012 2v4" fill="#FFFFFF" fill-opacity="0.25" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 10.5V20a1 1 0 001 1h4V12h4v9h4a1 1 0 001-1V10.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M3 10.5L12 3l9 7.5" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <rect x="7" y="13" width="2" height="2" rx="0.5" fill="#FFFFFF"/>
        <rect x="15" y="13" width="2" height="2" rx="0.5" fill="#FFFFFF"/>
      </g>
    </g>

    <!-- Right Brand Title and Description -->
    <text x="500" y="270" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="76" fill="#FFFFFF">
      Nyumba<tspan fill="#FF385C">Link</tspan>
    </text>
    
    <text x="500" y="340" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="28" fill="#FBBF24" letter-spacing="1">
      Plateforme Immobilière Officielle de Bukavu
    </text>

    <text x="500" y="400" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="22" fill="#94A3B8">
      Achetez, louez et explorez des maisons, parcelles &amp; appartements
    </text>

    <text x="500" y="435" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="20" fill="#64748B">
      Ibanda • Kadutu • Bagira — Avec Cartographie Interactive Leaflet &amp; IA
    </text>
  </svg>
  `;

  await sharp(Buffer.from(ogSvg))
    .png()
    .toFile('public/og-image.png');
  console.log('Generated public/og-image.png');

  console.log('All icons generated successfully!');
}

generate().catch(console.error);
