const fs = require('fs-extra');
const path = require('path');

async function copyGenerated() {
  try {
    const sourceDir = path.join(__dirname, 'src', 'generated');
    const targetDir = path.join(__dirname, 'dist', 'generated');

    console.log(`Copying from ${sourceDir} to ${targetDir}`);

    await fs.ensureDir(targetDir);

    await fs.copy(sourceDir, targetDir);

    console.log('✅ Generated files copied successfully');
  } catch (error) {
    console.error('❌ Error copying generated files:', error);
    process.exit(1);
  }
}

copyGenerated();
