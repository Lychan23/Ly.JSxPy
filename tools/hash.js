const bcrypt = require('bcrypt');
const readline = require('readline');

// Create an interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const hashPassword = async (password) => {
    const saltRounds = 10; // You can adjust the number of salt rounds as needed
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Hashed password:`, hash);
};

// Prompt the user for a password
rl.question('Enter the password to hash: ', (password) => {
    if (password) {
        hashPassword(password).then(() => rl.close());
    } else {
        console.log('No password entered. Exiting...');
        rl.close();
    }
});
