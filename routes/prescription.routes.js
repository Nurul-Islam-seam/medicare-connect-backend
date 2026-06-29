const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const verifyToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleCheck');

// ========================
// CREATE PRESCRIPTION (Doctor only)
// ========================
router.post('/', verifyToken, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { appointmentId, patientId, diagnosis, medications, notes } = req.body;

        if (!appointmentId || !patientId || !diagnosis || !medications || medications.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID, patient ID, diagnosis, and at least one medication are required.',
            });
        }

        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
        }

        // Verify the appointment belongs to this doctor and is completed
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            doctorId: doctor._id,
            appointmentStatus: 'completed',
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Completed appointment not found for this doctor.',
            });
        }

        // Check if prescription already exists for this appointment
        const existingPrescription = await Prescription.findOne({ appointmentId });
        if (existingPrescription) {
            return res.status(409).json({
                success: false,
                message: 'A prescription already exists for this appointment. Use update instead.',
            });
        }

        const prescription = await Prescription.create({
            doctorId: doctor._id,
            patientId,
            appointmentId,
            diagnosis,
            medications,
            notes: notes || '',
        });

        res.status(201).json({ success: true, message: 'Prescription created!', prescription });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// UPDATE PRESCRIPTION (Doctor only)
// ========================
router.put('/:id', verifyToken, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { diagnosis, medications, notes } = req.body;

        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
        }

        const prescription = await Prescription.findOne({
            _id: req.params.id,
            doctorId: doctor._id,
        });

        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found.' });
        }

        if (diagnosis) prescription.diagnosis = diagnosis;
        if (medications) prescription.medications = medications;
        if (notes !== undefined) prescription.notes = notes;

        await prescription.save();

        res.status(200).json({ success: true, message: 'Prescription updated!', prescription });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET PRESCRIPTIONS BY DOCTOR (Doctor)
// ========================
router.get('/doctor', verifyToken, authorizeRoles('doctor'), async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
        }

        const prescriptions = await Prescription.find({ doctorId: doctor._id })
            .populate('patientId', 'name email photo')
            .populate('appointmentId', 'appointmentDate appointmentTime symptoms')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET PRESCRIPTIONS BY PATIENT (Patient — view their prescriptions)
// ========================
router.get('/my', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.user._id })
            .populate({
                path: 'doctorId',
                select: 'doctorName specialization profileImage',
            })
            .populate('appointmentId', 'appointmentDate appointmentTime')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET SINGLE PRESCRIPTION
// ========================
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('patientId', 'name email photo phone')
            .populate({
                path: 'doctorId',
                select: 'doctorName specialization hospitalName',
            })
            .populate('appointmentId', 'appointmentDate appointmentTime symptoms');

        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found.' });
        }

        res.status(200).json({ success: true, prescription });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

module.exports = router;
