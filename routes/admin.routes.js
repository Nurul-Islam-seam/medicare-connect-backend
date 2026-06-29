const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const verifyToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleCheck');

// ========================
// GET PLATFORM STATISTICS (Public — for home page)
// ========================
router.get('/stats', async (req, res) => {
    try {
        const [totalDoctors, totalPatients, totalAppointments, totalReviews] = await Promise.all([
            Doctor.countDocuments({ verificationStatus: 'verified' }),
            User.countDocuments({ role: 'patient' }),
            Appointment.countDocuments(),
            Review.countDocuments(),
        ]);

        res.status(200).json({
            success: true,
            stats: { totalDoctors, totalPatients, totalAppointments, totalReviews },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET ALL USERS (Admin only)
// ========================
router.get('/users', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { role, status, search } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// DELETE USER (Admin only)
// ========================
router.delete('/users/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete admin users.' });
        }

        // If the user is a doctor, also delete their doctor profile
        if (user.role === 'doctor') {
            await Doctor.deleteOne({ userId: user._id });
        }

        await User.deleteOne({ _id: user._id });
        res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// SUSPEND / ACTIVATE USER (Admin only)
// ========================
router.put('/users/:id/status', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be "active" or "suspended".' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot change admin status.' });
        }

        user.status = status;
        await user.save();

        res.status(200).json({ success: true, message: `User ${status === 'suspended' ? 'suspended' : 'activated'} successfully.`, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET ALL DOCTORS (Admin — includes unverified)
// ========================
router.get('/doctors', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { verificationStatus } = req.query;
        const filter = {};
        if (verificationStatus) filter.verificationStatus = verificationStatus;

        const doctors = await Doctor.find(filter)
            .populate('userId', 'name email photo phone status')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// UPDATE DOCTOR VERIFICATION STATUS (Admin only)
// Verify, Reject, or Cancel Verification
// ========================
router.put('/doctors/:id/verify', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { verificationStatus } = req.body;

        if (!['pending', 'verified', 'rejected'].includes(verificationStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be "pending", "verified", or "rejected".',
            });
        }

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }

        doctor.verificationStatus = verificationStatus;
        await doctor.save();

        const statusMessages = {
            verified: 'Doctor verified successfully!',
            rejected: 'Doctor verification rejected.',
            pending: 'Doctor verification status reset to pending.',
        };

        res.status(200).json({ success: true, message: statusMessages[verificationStatus], doctor });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET ALL APPOINTMENTS (Admin)
// ========================
router.get('/appointments', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.appointmentStatus = status;

        const appointments = await Appointment.find(filter)
            .populate('patientId', 'name email photo')
            .populate({
                path: 'doctorId',
                select: 'doctorName specialization',
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET ALL PAYMENTS (Admin)
// ========================
router.get('/payments', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('patientId', 'name email')
            .populate({
                path: 'doctorId',
                select: 'doctorName specialization',
            })
            .populate('appointmentId', 'appointmentDate appointmentTime')
            .sort({ paymentDate: -1 });

        res.status(200).json({ success: true, payments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET ANALYTICS DATA (Admin — for Recharts)
// ========================
router.get('/analytics', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        // Doctor performance (top doctors by rating)
        const topDoctors = await Doctor.find({ verificationStatus: 'verified' })
            .sort({ averageRating: -1 })
            .limit(10)
            .select('doctorName specialization averageRating ratingCount totalRatings');

        // Appointment status distribution
        const appointmentStats = await Appointment.aggregate([
            { $group: { _id: '$appointmentStatus', count: { $sum: 1 } } },
        ]);

        // Monthly appointment trends (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrends = await Appointment.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Revenue data
        const revenueData = await Payment.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$paymentDate' },
                        month: { $month: '$paymentDate' },
                    },
                    totalRevenue: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Overall counts
        const [totalDoctors, totalPatients, totalAppointments] = await Promise.all([
            Doctor.countDocuments({ verificationStatus: 'verified' }),
            User.countDocuments({ role: 'patient' }),
            Appointment.countDocuments(),
        ]);

        res.status(200).json({
            success: true,
            analytics: {
                topDoctors,
                appointmentStats,
                monthlyTrends,
                revenueData,
                totals: { totalDoctors, totalPatients, totalAppointments },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

module.exports = router;
