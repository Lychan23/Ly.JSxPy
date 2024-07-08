
const fs = require('fs');
const path = require('path');

const directoriesToBackup = ['database', 'public', 'app', "dist", "cogs", "middleware", "styles", "ui", 'pages'];
const fileToBackup = 'server.js';
const backupDir = path.join(__dirname, 'backup');

function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function backupFile(srcFilePath, destFilePath) {
    const destFilePathWithExt = destFilePath + '.bkp';
    fs.copyFileSync(srcFilePath, destFilePathWithExt);
}

function backupDirectory(src, dest) {
    ensureDirSync(dest);

    fs.readdirSync(src).forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        if (fs.lstatSync(srcPath).isDirectory()) {
            backupDirectory(srcPath, destPath);
        } else {
            backupFile(srcPath, destPath);
        }
    });
}

ensureDirSync(backupDir);

// Backup directories
directoriesToBackup.forEach(dir => {
    const srcDirPath = path.join(__dirname, dir);
    const destDirPath = path.join(backupDir, dir);
    backupDirectory(srcDirPath, destDirPath);
});

// Backup specific file
const srcFilePath = path.join(__dirname, fileToBackup);
const destFilePath = path.join(backupDir, fileToBackup);
if (fs.existsSync(srcFilePath)) {
    backupFile(srcFilePath, destFilePath);
}

console.log(`Backup completed to ${backupDir}`);

