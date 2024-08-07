const fs = require('fs');
const path = require('path');

const ignoreDirs = ['node_modules', '.next', '.venv', '.git', 'backup', 'deps', '__pycache__']; // Directories to ignore

/**
 * Recursively get the directory structure.
 * @param {string} dir - The directory path to scan.
 * @param {string} [basePath=''] - The base path for the files.
 * @returns {object} - The directory structure.
 */
function getDirectoryStructure(dir, basePath = '') {
  const result = {};
  
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ignore specified directories
        if (!ignoreDirs.includes(file)) {
          result[file] = getDirectoryStructure(filePath, path.join(basePath, file));
        }
      } else if (stat.isFile()) {
        if (!result.files) {
          result.files = [];
        }
        result.files.push(path.join(basePath, file));
      }
    });
    
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
  }
  
  return result;
}

/**
 * Print the directory structure.
 * @param {object} structure - The directory structure.
 * @param {string} [indent=''] - The current indentation level.
 */
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

// Get and print the structure of the project directory
const projectDir = path.resolve(__dirname);
const structure = getDirectoryStructure(projectDir);
printStructure(structure);
