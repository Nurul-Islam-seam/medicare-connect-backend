const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Review = require('../models/Review');
const verifyToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleCheck');

// ========================
// GET ALL DOCTORS (Public) — Search, Sort, Pagination
// Supports: Challenge 1 (Search), Challenge 2 (Sort), Challenge 4 (Pagination)
// ========================
router.get('/', async (req, res) => {
    try {
        const {
            search,
            specialization,
            sortBy,
            sortOrder = 'asc',
            page = 1,
            limit = 9,
        } = req.query;

        // Build filter query
        const filter = { verificationStatus: 'verified' };

        // Challenge 1: Search by name or specialization
        if (search) {
            filter.$or = [
                { doctorName: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } },
            ];
        }

        if (specialization) {
            filter.specialization = { $regex: specialization, $options: 'i' };
        }

        // Challenge 2: Sort by consultationFee, experience, or averageRating
        let sortQuery = { createdAt: -1 }; // default sort
        if (sortBy) {
            const validSortFields = ['consultationFee', 'experience', 'averageRating'];
            if (validSortFields.includes(sortBy)) {
                sortQuery = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
            }
        }

        // Challenge 4: Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [doctors, total] = await Promise.all([
            Doctor.find(filter)
                .populate('userId', 'name email photo')
                .sort(sortQuery)
                .skip(skip)
                .limit(limitNum),
            Doctor.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            doctors,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET FEATURED DOCTORS (Public — for home page)
// ========================
router.get('/featured', async (req, res) => {
    try {
        const doctors = await Doctor.find({ verificationStatus: 'verified' })
            .populate('userId', 'name email photo')
            .sort({ averageRating: -1 })
            .limit(6);

        res.status(200).json({ success: true, doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET SINGLE DOCTOR (Public)
// ========================
router.get('/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('userId', 'name email photo phone');

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }

        // Get reviews for this doctor
        const reviews = await Review.find({ doctorId: doctor._id })
            .populate('patientId', 'name photo')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({ success: true, doctor, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET DOCTOR BY USER ID (Private — for doctor dashboard)
// ========================
router.get('/my/profile', verifyToken, authorizeRoles('doctor'), async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id })
            .populate('userId', 'name email photo phone');

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
        }

        res.status(200).json({ success: true, doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// UPDATE DOCTOR PROFILE (Private — doctor only)
// ========================
router.put('/my/profile', verifyToken, authorizeRoles('doctor'), async (req, res) => {
    try {
        const {
            doctorName, specialization, qualifications, experience,
            consultationFee, hospitalName, profileImage,
            availableDays, availableSlots,
        } = req.body;

        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
        }

        if (doctorName) doctor.doctorName = doctorName;
        if (specialization) doctor.specialization = specialization;
        if (qualifications) doctor.qualifications = qualifications;
        if (experience !== undefined) doctor.experience = experience;
        if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
        if (hospitalName !== undefined) doctor.hospitalName = hospitalName;
        if (profileImage !== undefined) doctor.profileImage = profileImage;
        if (availableDays) doctor.availableDays = availableDays;
        if (availableSlots) doctor.availableSlots = availableSlots;

        await doctor.save();

        res.status(200).json({ success: true, message: 'Doctor profile updated!', doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET ALL SPECIALIZATIONS (Public)
// ========================
router.get('/data/specializations', async (req, res) => {
    try {
        const specializations = await Doctor.distinct('specialization', { verificationStatus: 'verified' });
        res.status(200).json({ success: true, specializations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

module.exports = router;
