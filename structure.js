// /structure.js
const fs = require('fs');
const path = require('path');

const ignoreDirs = ['node_modules', '.next', '.venv', '.git', 'backup']; // Directories to ignore

function getDirectoryStructure(dir, basePath = '') {
  const result = {};
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !ignoreDirs.includes(file)) {
      result[file] = getDirectoryStructure(filePath, path.join(basePath, file));
    } else if (stat.isFile()) {
      if (!result.files) result.files = [];
      result.files.push(path.join(basePath, file));
    }
  });

  return result;
}

function printStructure(structure, indent = '') {
  Object.keys(structure).forEach(key => {
    if (key === 'files') {
      structure[key].forEach(file => {
        console.log(`${indent}  - ${file}`);
      });
    } else {
      console.log(`${indent}- ${key}/`);
      printStructure(structure[key], indent + '  ');
    }
  });
}

const projectDir = path.resolve(__dirname);
const structure = getDirectoryStructure(projectDir);
printStructure(structure);
