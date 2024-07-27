
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Select environment:");
console.log("1 = production");
console.log("2 = development");

rl.question("Enter your choice: ", (answer) => {
  let envValue;

  if (answer === '1') {
    envValue = 'production';
  } else if (answer === '2') {
    envValue = 'development';
  } else {
    console.log("Invalid choice. Exiting...");
    rl.close();
    return;
  }

  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  const lines = envContent.split('\n');
  const updatedLines = lines.map(line => {
    if (line.startsWith('NODE_ENV=')) {
      return `NODE_ENV=${envValue}`;
    }
    return line;
  });

  if (!updatedLines.some(line => line.startsWith('NODE_ENV='))) {
    updatedLines.push(`NODE_ENV=${envValue}`);
  }

  fs.writeFileSync(envPath, updatedLines.join('\n'));
  console.log(`NODE_ENV set to ${envValue}`);
  rl.close();
});
