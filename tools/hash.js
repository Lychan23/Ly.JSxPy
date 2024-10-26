const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
    const saltRounds = 10; // You can adjust the number of salt rounds as needed
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Hashed password for "${password}":`, hash);
};

hashPassword('Admin12345'); // Replace with the password you want to hash
