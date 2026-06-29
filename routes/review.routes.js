const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const verifyToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleCheck');

// ========================
// ADD REVIEW (Patient only — must have completed appointment with doctor)
// ========================
router.post('/', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const { doctorId, rating, reviewText } = req.body;

        if (!doctorId || !rating || !reviewText) {
            return res.status(400).json({ success: false, message: 'Doctor ID, rating, and review text are required.' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }

        // Check if patient has a completed appointment with this doctor
        const completedAppointment = await Appointment.findOne({
            patientId: req.user._id,
            doctorId,
            appointmentStatus: 'completed',
        });

        if (!completedAppointment) {
            return res.status(403).json({
                success: false,
                message: 'You can only review a doctor after a completed appointment.',
            });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({
            patientId: req.user._id,
            doctorId,
        });

        if (existingReview) {
            return res.status(409).json({ success: false, message: 'You have already reviewed this doctor. You can update your review instead.' });
        }

        const review = await Review.create({
            patientId: req.user._id,
            doctorId,
            rating,
            reviewText,
        });

        // Update doctor's average rating
        const allReviews = await Review.find({ doctorId });
        const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const ratingCount = allReviews.length;

        const doctor = await Doctor.findById(doctorId);
        doctor.updateRating(totalRatings, ratingCount);
        await doctor.save();

        res.status(201).json({ success: true, message: 'Review added successfully!', review });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET MY REVIEWS (Patient)
// ========================
router.get('/my', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const reviews = await Review.find({ patientId: req.user._id })
            .populate({
                path: 'doctorId',
                select: 'doctorName specialization profileImage',
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET REVIEWS FOR A DOCTOR (Public)
// ========================
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const reviews = await Review.find({ doctorId: req.params.doctorId })
            .populate('patientId', 'name photo')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET RECENT REVIEWS (Public — for homepage testimonials)
// ========================
router.get('/recent/testimonials', async (req, res) => {
    try {
        const reviews = await Review.find({ rating: { $gte: 4 } })
            .populate('patientId', 'name photo')
            .populate({
                path: 'doctorId',
                select: 'doctorName specialization',
            })
            .sort({ createdAt: -1 })
            .limit(6);

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// UPDATE REVIEW (Patient)
// ========================
router.put('/:id', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const { rating, reviewText } = req.body;

        const review = await Review.findOne({
            _id: req.params.id,
            patientId: req.user._id,
        });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        if (rating) review.rating = rating;
        if (reviewText) review.reviewText = reviewText;
        await review.save();

        // Update doctor's average rating
        const allReviews = await Review.find({ doctorId: review.doctorId });
        const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const ratingCount = allReviews.length;

        const doctor = await Doctor.findById(review.doctorId);
        doctor.updateRating(totalRatings, ratingCount);
        await doctor.save();

        res.status(200).json({ success: true, message: 'Review updated!', review });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// DELETE REVIEW (Patient)
// ========================
router.delete('/:id', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            patientId: req.user._id,
        });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        const doctorId = review.doctorId;
        await Review.deleteOne({ _id: review._id });

        // Recalculate doctor's average rating
        const allReviews = await Review.find({ doctorId });
        const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const ratingCount = allReviews.length;

        const doctor = await Doctor.findById(doctorId);
        doctor.updateRating(totalRatings, ratingCount);
        await doctor.save();

        res.status(200).json({ success: true, message: 'Review deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

module.exports = router;
