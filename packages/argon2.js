const argon2 = require("argon2");

// Hash password with random salt
async function hashPassword(password) {
    try {
        return await argon2.hash(password);
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

// Verify password against hash
async function verifyPassword(password, hash) {
    try {
        return await argon2.verify(hash, password);
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
}

module.exports = {hashPassword, verifyPassword};