#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

console.log('🔧 Injecting Plausible Analytics script...');

if (fs.existsSync(indexHtmlPath)) {
  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Check if plausible script is already present
  if (!htmlContent.includes('plausible.io/js/script.js')) {
    // Inject plausible script before closing head tag
    const plausibleScript = '    <!-- Plausible Analytics -->\n    <script defer data-domain="agentlog.scalebase.io" src="https://plausible.io/js/script.js"></script>\n  </head>';
    htmlContent = htmlContent.replace('</head>', plausibleScript);
    
    fs.writeFileSync(indexHtmlPath, htmlContent);
    console.log('✅ Plausible Analytics script injected successfully!');
  } else {
    console.log('ℹ️ Plausible Analytics script already present');
  }
} else {
  console.log('⚠️ index.html not found in dist directory');
} 