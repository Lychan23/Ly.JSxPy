const fs = require('fs');
const path = require('path');

const directoriesToBackup = ['database', 'public', 'app', "dist", "cogs", "middleware", "styles", "ui", 'pages','types','lib','backend','src','ai'];
const filesToBackup = ['server.js', 'config.json', 'settings.json', 'bot.py', 'package.json', 'tsconfig.json', 'tailwind.config.js', 'postcss.config.js','next.config.mjs']; // Add more files as needed
const backupDir = path.join(__dirname, 'backup');

// Function to ensure directory exists synchronously
function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Function to backup a file
function backupFile(srcFilePath, destFilePath) {
    const destFilePathWithExt = destFilePath + '.bkp';
    fs.copyFileSync(srcFilePath, destFilePathWithExt);
}

// Function to backup a directory recursively, excluding certain directories
function backupDirectory(src, dest, excludeDirs) {
    ensureDirSync(dest);

    fs.readdirSync(src).forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        if (excludeDirs.includes(item)) {
            // Skip if item is in excludeDirs
            return;
        }

        if (fs.lstatSync(srcPath).isDirectory()) {
            backupDirectory(srcPath, destPath, excludeDirs);
        } else {
            backupFile(srcPath, destPath);
        }
    });
}

ensureDirSync(backupDir);

// Backup directories, excluding .next and node_modules
directoriesToBackup.forEach(dir => {
    const srcDirPath = path.join(__dirname, dir);
    const destDirPath = path.join(backupDir, dir);
    backupDirectory(srcDirPath, destDirPath, ['.next', 'node_modules']);
});

// Backup specific files
filesToBackup.forEach(file => {
    const srcFilePath = path.join(__dirname, file);
    const destFilePath = path.join(backupDir, file);
    if (fs.existsSync(srcFilePath)) {
        backupFile(srcFilePath, destFilePath);
    }
});

console.log(`Backup completed to ${backupDir}`);
