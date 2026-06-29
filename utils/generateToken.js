const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for a user.
 * @param {Object} user - The user document from MongoDB.
 * @returns {string} JWT token string.
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

module.exports = generateToken;
