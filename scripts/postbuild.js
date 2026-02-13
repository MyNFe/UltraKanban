/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
const serverJsPath = path.join(standaloneDir, 'server.js');

// New server.js content with env loading - ALWAYS override DATABASE_URL
const newServerJs = `const path = require('path')
const fs = require('fs')

// Load environment variables from .env file
// IMPORTANT: Always override DATABASE_URL from file
const envPath = path.join(__dirname, '.env')
const envLocalPath = path.join(__dirname, '.env.local')

// Load .env.local first (higher priority)
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  envContent.split('\\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      // Always set DATABASE_URL, otherwise only if not set
      if (key === 'DATABASE_URL' || !process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

// Load .env
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      // Always set DATABASE_URL, otherwise only if not set
      if (key === 'DATABASE_URL' || !process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const dir = path.join(__dirname)

process.env.NODE_ENV = 'production'
process.chdir(__dirname)

const currentPort = parseInt(process.env.PORT, 10) || 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

let keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10)

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify({"distDir":"./.next","cacheComponents":false,"output":"standalone","trailingSlash":false,"images":{"deviceSizes":[640,750,828,1080,1200,1920,2048,3840],"imageSizes":[32,48,64,96,128,256,384],"path":"/_next/image","loader":"default","domains":[],"disableStaticImages":false,"minimumCacheTTL":14400,"formats":["image/webp"],"maximumRedirects":3,"dangerouslyAllowLocalIP":false,"dangerouslyAllowSVG":false,"contentSecurityPolicy":"script-src 'none'; frame-src 'none'; sandbox;","contentDispositionType":"attachment","localPatterns":[{"pathname":"**","search":""}],"remotePatterns":[],"qualities":[75],"unoptimized":false},"reactMaxHeadersLength":6000,"basePath":"","generateEtags":true,"poweredByHeader":true,"compress":true,"i18n":null,"httpAgentOptions":{"keepAlive":true},"pageExtensions":["tsx","ts","jsx","js"],"experimental":{"staleTimes":{"dynamic":0,"static":300}}})

require('next')
const { startServer } = require('next/dist/server/lib/start-server')

if (
  Number.isNaN(keepAliveTimeout) ||
  !Number.isFinite(keepAliveTimeout) ||
  keepAliveTimeout < 0
) {
  keepAliveTimeout = undefined
}

startServer({
  dir,
  isDev: false,
  hostname,
  port: currentPort,
  allowRetry: false,
  keepAliveTimeout,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
`;

// Write the new server.js
fs.writeFileSync(serverJsPath, newServerJs);
console.log('✅ Updated server.js with env loading');

// Copy .env file to standalone
const envSrc = path.join(__dirname, '..', '.env');
const envDest = path.join(standaloneDir, '.env');

if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, envDest);
  console.log('✅ Copied .env to standalone');
}

// Copy .env.local as well
const envLocalSrc = path.join(__dirname, '..', '.env.local');
const envLocalDest = path.join(standaloneDir, '.env.local');

if (fs.existsSync(envLocalSrc)) {
  fs.copyFileSync(envLocalSrc, envLocalDest);
  console.log('✅ Copied .env.local to standalone');
}

// Copy static files to standalone
const staticSrc = path.join(__dirname, '..', '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(staticSrc)) {
  copyDirRecursive(staticSrc, staticDest);
  console.log('✅ Copied static files to standalone');
}

// Copy public folder to standalone
const publicSrc = path.join(__dirname, '..', 'public');
const publicDest = path.join(standaloneDir, 'public');

if (fs.existsSync(publicSrc)) {
  copyDirRecursive(publicSrc, publicDest);
  console.log('✅ Copied public folder to standalone');
}

console.log('✅ Postbuild complete!');
