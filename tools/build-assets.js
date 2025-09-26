// tools/build-assets.js
// Usage: node tools/build-assets.js
// Scans repo root (no subfolders) for .js, .html, .css
// Obfuscates .js, minifies .html, minifies .css, copies other static assets (keeps folder structure for non-js/html/css)

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { minify: htmlMinify } = require('html-minifier-terser');
const JavaScriptObfuscator = require('javascript-obfuscator');
const postcss = require('postcss');
const cssnano = require('cssnano');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'build_obf');

// globs to ignore when scanning (still ignore node_modules, build_obf, tools, .git)
const IGNORE = ['node_modules/**', 'build_obf/**', 'tools/**', '.git/**'];

// NOTE: changed to only match files in project root (no subfolders)
async function obfuscateJs(filePath, outPath) {
  const code = await fs.readFile(filePath, 'utf8');
  const obf = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    rotateStringArray: true,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 0.75,
    transformObjectKeys: true
  }).getObfuscatedCode();
  await fs.outputFile(outPath, obf, 'utf8');
}

async function minifyHtml(filePath, outPath) {
  const html = await fs.readFile(filePath, 'utf8');
  const min = await htmlMinify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: false // JS handled separately
  });
  await fs.outputFile(outPath, min, 'utf8');
}

async function minifyCss(filePath, outPath) {
  const css = await fs.readFile(filePath, 'utf8');
  const result = await postcss([ cssnano({ preset: 'default' }) ]).process(css, { from: filePath });
  await fs.outputFile(outPath, result.css, 'utf8');
}

async function copyFile(filePath, outPath) {
  await fs.copy(filePath, outPath);
}

async function run() {
  console.log('Cleaning output folder:', OUT);
  await fs.remove(OUT);

  // 1) JS files (only in project root)
  const jsFiles = glob.sync('*.js', { cwd: ROOT, ignore: IGNORE, nodir: true });
  for (const rel of jsFiles) {
    const src = path.join(ROOT, rel);
    const dst = path.join(OUT, rel);
    await obfuscateJs(src, dst);
    console.log('OBF JS:', rel);
  }

  // 2) HTML files (only in project root)
  const htmlFiles = glob.sync('*.html', { cwd: ROOT, ignore: IGNORE, nodir: true });
  for (const rel of htmlFiles) {
    const src = path.join(ROOT, rel);
    const dst = path.join(OUT, rel);
    await minifyHtml(src, dst);
    console.log('MIN HTML:', rel);
  }

  // 3) CSS files (only in project root)
  const cssFiles = glob.sync('*.css', { cwd: ROOT, ignore: IGNORE, nodir: true });
  for (const rel of cssFiles) {
    const src = path.join(ROOT, rel);
    const dst = path.join(OUT, rel);
    await minifyCss(src, dst);
    console.log('MIN CSS:', rel);
  }

   // 4) Copy only specific allowed folders (to avoid copying docs/backups)
  // List the top-level folders you want copied (relative to project root)
  const ALLOWED_FOLDERS = ['Logos']; // add more names here if needed, e.g. ['Logo','assets']

  for (const folderName of ALLOWED_FOLDERS) {
    const srcFolder = path.join(ROOT, folderName);
    if (await fs.pathExists(srcFolder)) {
      const dstFolder = path.join(OUT, folderName);
      await fs.copy(srcFolder, dstFolder);
      console.log('COPY FOLDER:', folderName);
    } else {
      console.log('SKIP (not found):', folderName);
    }
  }


  console.log('Build finished. Output directory:', OUT);
}

run().catch(err => {
  console.error('BUILD FAILED:', err);
  process.exit(1);
});
