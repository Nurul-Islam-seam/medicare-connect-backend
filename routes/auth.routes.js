const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const generateToken = require('../utils/generateToken');

// ========================
// REGISTER
// ========================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, photo, phone, gender, role } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        // Strong password validation: min 6 chars, at least 1 number, at least 1 special character
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters and include at least one number and one special character.',
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            photo: photo || '',
            phone: phone || '',
            gender: gender || '',
            role: role || 'patient',
        });

        // If registering as doctor, create doctor profile entry
        if (role === 'doctor') {
            await Doctor.create({
                userId: user._id,
                doctorName: name,
                specialization: req.body.specialization || 'General',
                qualifications: req.body.qualifications || ['MBBS'],
                experience: req.body.experience || 0,
                consultationFee: req.body.consultationFee || 500,
                hospitalName: req.body.hospitalName || '',
                profileImage: photo || '',
                verificationStatus: 'pending',
            });
        }

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: user.toJSON(),
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration.', error: error.message });
    }
});

// ========================
// LOGIN
// ========================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        // Find user (include password for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact admin.' });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: user.toJSON(),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
    }
});

// ========================
// GOOGLE LOGIN / REGISTER
// ========================
router.post('/google', async (req, res) => {
    try {
        const { name, email, photo, googleId } = req.body;

        if (!email || !googleId) {
            return res.status(400).json({ success: false, message: 'Email and Google ID are required.' });
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // User exists — update googleId if not set
            if (!user.googleId) {
                user.googleId = googleId;
                if (photo && !user.photo) user.photo = photo;
                await user.save();
            }

            if (user.status === 'suspended') {
                return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
            }
        } else {
            // Create new user via Google
            user = await User.create({
                name,
                email,
                googleId,
                photo: photo || '',
                role: 'patient',
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Google authentication successful!',
            token,
            user: user.toJSON(),
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ success: false, message: 'Server error during Google authentication.', error: error.message });
    }
});

// ========================
// GET CURRENT USER (verify token)
// ========================
const verifyToken = require('../middleware/auth');

router.get('/me', verifyToken, async (req, res) => {
    try {
        res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
