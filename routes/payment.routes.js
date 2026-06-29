const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const verifyToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleCheck');

// ========================
// CREATE STRIPE PAYMENT INTENT (Patient)
// ========================
router.post('/create-payment-intent', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const { appointmentId } = req.body;

        if (!appointmentId) {
            return res.status(400).json({ success: false, message: 'Appointment ID is required.' });
        }

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            patientId: req.user._id,
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        if (appointment.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, message: 'Payment already completed.' });
        }

        const doctor = await Doctor.findById(appointment.doctorId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found.' });
        }

        const amount = Math.round(doctor.consultationFee * 100); // Stripe uses cents

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            metadata: {
                appointmentId: appointmentId.toString(),
                patientId: req.user._id.toString(),
                doctorId: doctor._id.toString(),
            },
        });

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            amount: doctor.consultationFee,
        });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ success: false, message: 'Payment processing error.', error: error.message });
    }
});

// ========================
// CONFIRM PAYMENT (Patient — after successful Stripe charge)
// ========================
router.post('/confirm', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const { appointmentId, transactionId, amount } = req.body;

        if (!appointmentId || !transactionId) {
            return res.status(400).json({ success: false, message: 'Appointment ID and transaction ID are required.' });
        }

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            patientId: req.user._id,
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        // Update appointment payment status
        appointment.paymentStatus = 'paid';
        await appointment.save();

        // Create payment record
        const payment = await Payment.create({
            appointmentId,
            patientId: req.user._id,
            doctorId: appointment.doctorId,
            amount,
            transactionId,
        });

        res.status(201).json({ success: true, message: 'Payment confirmed!', payment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET MY PAYMENT HISTORY (Patient)
// ========================
router.get('/my', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const payments = await Payment.find({ patientId: req.user._id })
            .populate({
                path: 'appointmentId',
                select: 'appointmentDate appointmentTime',
            })
            .populate({
                path: 'doctorId',
                select: 'doctorName specialization',
            })
            .sort({ paymentDate: -1 });

        res.status(200).json({ success: true, payments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

module.exports = router;
