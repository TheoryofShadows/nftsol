const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tscPath = path.resolve(__dirname, '..', 'node_modules', '.bin', 'tsc');
const tscVersionResult = spawnSync(tscPath, ['--version'], { encoding: 'utf8' });
const versionMatch = tscVersionResult.stdout.match(/Version (\d+)\.(\d+)/);
const major = versionMatch ? parseInt(versionMatch[1], 10) : 0;

const configPath = path.resolve(__dirname, '..', 'tsconfig.build.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.compilerOptions = config.compilerOptions || {};
config.compilerOptions.ignoreDeprecations = major >= 5 ? "6.0" : undefined;

const tempConfigPath = path.resolve(__dirname, '..', 'tsconfig.render.json');
fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));

let tscResult = spawnSync(tscPath, ['-p', 'tsconfig.render.json'], { stdio: 'inherit' });

if (tscResult.status !== 0 && major >= 5) {
  config.compilerOptions.ignoreDeprecations = "5.0";
  fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
  tscResult = spawnSync(tscPath, ['-p', 'tsconfig.render.json'], { stdio: 'inherit' });
}

if (fs.existsSync(tempConfigPath)) fs.unlinkSync(tempConfigPath);
process.exit(tscResult.status);
