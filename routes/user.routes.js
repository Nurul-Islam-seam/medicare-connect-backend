const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

// ========================
// GET USER PROFILE
// ========================
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// UPDATE USER PROFILE
// ========================
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { name, photo, phone, gender } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (name) user.name = name;
        if (photo !== undefined) user.photo = photo;
        if (phone !== undefined) user.phone = phone;
        if (gender !== undefined) user.gender = gender;

        await user.save();

        res.status(200).json({ success: true, message: 'Profile updated successfully!', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

module.exports = router;
