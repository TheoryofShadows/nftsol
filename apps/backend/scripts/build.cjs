const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting custom build script...');

// 1. Get TSC version
const tscVersionResult = spawnSync('npx', ['tsc', '--version'], { encoding: 'utf8' });
const versionMatch = tscVersionResult.stdout.match(/Version (\d+)\.(\d+)/);
const major = versionMatch ? parseInt(versionMatch[1], 10) : 0;
const minor = versionMatch ? parseInt(versionMatch[2], 10) : 0;

console.log(`Detected TSC Version: ${major}.${minor}`);

// 2. Prepare build config
const configPath = path.resolve(__dirname, '..', 'tsconfig.build.json');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configContent);

// Ensure compilerOptions exists
config.compilerOptions = config.compilerOptions || {};

// Set the correct ignore flag based on version
// Render's environment (likely TSC 5.x/6.x) wants "6.0"
// Our local environment (TSC 5.4) wants "5.0"
if (major >= 5) {
  // If we are on a version that supports ignoreDeprecations, 
  // we'll try to use what the environment asks for.
  // We'll use 6.0 by default as Render explicitly requested it.
  config.compilerOptions.ignoreDeprecations = "6.0";
}

// Write temporary config
const tempConfigPath = path.resolve(__dirname, '..', 'tsconfig.render.json');
fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));

console.log(`Created temporary config with ignoreDeprecations: ${config.compilerOptions.ignoreDeprecations}`);

// 3. Run TSC
console.log('Running tsc...');
let tscResult = spawnSync('npx', ['tsc', '-p', 'tsconfig.render.json'], { 
  stdio: 'inherit',
  shell: true 
});

// Fallback for local environment if 6.0 is too new
if (tscResult.status !== 0) {
  console.log('TSC failed with 6.0, trying fallback to 5.0...');
  config.compilerOptions.ignoreDeprecations = "5.0";
  fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
  tscResult = spawnSync('npx', ['tsc', '-p', 'tsconfig.render.json'], { 
    stdio: 'inherit',
    shell: true 
  });
}

// 4. Cleanup
if (fs.existsSync(tempConfigPath)) {
  fs.unlinkSync(tempConfigPath);
}

if (tscResult.status !== 0) {
  console.error('TSC build failed');
  process.exit(1);
}

console.log('TSC build successful');
