#!/usr/bin/env node

/**
 * Script to replace console.log/error/warn/debug with Winston logger calls
 * Processes all .ts files in apps/backend/src and server/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to process
const directories = [
  'apps/backend/src/routes',
  'apps/backend/src/services',
  'apps/backend/src/lib',
  'apps/backend/src/utils',
  'apps/backend/src/middleware',
  'apps/backend/src/controllers',
  'apps/backend/src/workers',
  'server'
];

// Files to skip (already processed or special cases)
const skipFiles = [
  'apps/backend/src/index.ts', // Already processed
  'apps/backend/src/routes/archive-grok-echo.ts', // Already processed
  'apps/backend/src/utils/logger.ts', // Logger itself (lines 182-185 are intentional console.log for audit)
];

// Test directories to skip
const skipPatterns = [
  '__tests__',
  '__mocks__',
  'node_modules',
  '.test.ts',
  '.spec.ts'
];

let stats = {
  filesProcessed: 0,
  filesSkipped: 0,
  filesWithErrors: 0,
  totalReplacements: 0,
  errors: []
};

function shouldSkipFile(filePath) {
  // Check if file is in skip list
  if (skipFiles.some(skip => filePath.includes(skip.replace(/\//g, path.sep)))) {
    return true;
  }

  // Check skip patterns
  if (skipPatterns.some(pattern => filePath.includes(pattern))) {
    return true;
  }

  return false;
}

function getModuleName(filePath) {
  const basename = path.basename(filePath, '.ts');
  // Convert kebab-case to camelCase for module name
  return basename.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function processFile(filePath) {
  if (shouldSkipFile(filePath)) {
    stats.filesSkipped++;
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Check if file has console statements
    const hasConsole = /console\.(log|error|warn|debug)/.test(content);
    if (!hasConsole) {
      stats.filesSkipped++;
      return;
    }

    console.log(`Processing: ${filePath}`);

    const moduleName = getModuleName(filePath);
    let replacements = 0;

    // Check if logger is already imported
    const hasLoggerImport = /import.*createModuleLogger.*from.*logger/.test(content);

    if (!hasLoggerImport) {
      // Find the last import statement
      const importLines = content.match(/^import .+;$/gm);
      if (importLines && importLines.length > 0) {
        const lastImport = importLines[importLines.length - 1];
        const importIndex = content.indexOf(lastImport) + lastImport.length;

        // Add logger import after last import
        const loggerImport = `\nimport { createModuleLogger } from '../utils/logger';\n\nconst log = createModuleLogger('${moduleName}');`;

        // Handle relative path depth
        const depth = (filePath.match(/[\\/]/g) || []).length - (filePath.includes('apps') ? 3 : 1);
        const relativePath = '../'.repeat(Math.max(1, depth - 1)) + 'utils/logger';
        const correctedImport = loggerImport.replace('../utils/logger', relativePath);

        content = content.slice(0, importIndex) + correctedImport + content.slice(importIndex);
        replacements++;
      }
    } else {
      // Logger already imported, check if log variable exists
      const hasLogVar = /const log = createModuleLogger/.test(content);
      if (!hasLogVar) {
        // Add log variable after logger import
        const loggerImportMatch = content.match(/import.*createModuleLogger.*from.*logger.*;\n/);
        if (loggerImportMatch) {
          const insertIndex = content.indexOf(loggerImportMatch[0]) + loggerImportMatch[0].length;
          content = content.slice(0, insertIndex) + `\nconst log = createModuleLogger('${moduleName}');\n` + content.slice(insertIndex);
          replacements++;
        }
      }
    }

    // Replace console.error with log.error
    content = content.replace(/console\.error\((['"](.*?)['"])(,\s*(.+?))?\);?/g, (match, msg, msgText, comma, error) => {
      replacements++;
      if (error) {
        return `log.error(${msg}, ${error});`;
      }
      return `log.error(${msg});`;
    });

    // Replace console.log with log.info
    content = content.replace(/console\.log\(/g, () => {
      replacements++;
      return 'log.info(';
    });

    // Replace console.warn with log.warn
    content = content.replace(/console\.warn\(/g, () => {
      replacements++;
      return 'log.warn(';
    });

    // Replace console.debug with log.debug
    content = content.replace(/console\.debug\(/g, () => {
      replacements++;
      return 'log.debug(';
    });

    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ Replaced ${replacements} console statements`);
      stats.filesProcessed++;
      stats.totalReplacements += replacements;
    } else {
      stats.filesSkipped++;
    }

  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error.message);
    stats.filesWithErrors++;
    stats.errors.push({ file: filePath, error: error.message });
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldSkipFile(filePath)) {
        walkDirectory(filePath);
      }
    } else if (file.endsWith('.ts') && !shouldSkipFile(filePath)) {
      processFile(filePath);
    }
  });
}

// Main execution
console.log('🔄 Starting console statement replacement...\n');

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`\n📁 Processing directory: ${dir}`);
    walkDirectory(fullPath);
  } else {
    console.log(`⚠️  Directory not found: ${dir}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY');
console.log('='.repeat(80));
console.log(`✅ Files processed:     ${stats.filesProcessed}`);
console.log(`⏭️  Files skipped:       ${stats.filesSkipped}`);
console.log(`❌ Files with errors:   ${stats.filesWithErrors}`);
console.log(`🔄 Total replacements:  ${stats.totalReplacements}`);

if (stats.errors.length > 0) {
  console.log('\n❌ ERRORS:');
  stats.errors.forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`);
  });
}

console.log('\n✨ Done!\n');
