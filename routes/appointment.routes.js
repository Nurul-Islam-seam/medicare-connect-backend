const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const verifyToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roleCheck');

// ========================
// BOOK APPOINTMENT (Patient)
// ========================
router.post('/', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const { doctorId, appointmentDate, appointmentTime, symptoms } = req.body;

        if (!doctorId || !appointmentDate || !appointmentTime || !symptoms) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // Verify doctor exists and is verified
        const doctor = await Doctor.findById(doctorId);
        if (!doctor || doctor.verificationStatus !== 'verified') {
            return res.status(404).json({ success: false, message: 'Doctor not found or not verified.' });
        }

        // Check if the slot is already booked
        const existingAppointment = await Appointment.findOne({
            doctorId,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            appointmentStatus: { $in: ['pending', 'accepted'] },
        });

        if (existingAppointment) {
            return res.status(409).json({ success: false, message: 'This time slot is already booked.' });
        }

        const appointment = await Appointment.create({
            patientId: req.user._id,
            doctorId,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            symptoms,
        });

        res.status(201).json({ success: true, message: 'Appointment booked successfully!', appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET MY APPOINTMENTS (Patient)
// ========================
router.get('/my', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { patientId: req.user._id };
        if (status) filter.appointmentStatus = status;

        const appointments = await Appointment.find(filter)
            .populate({
                path: 'doctorId',
                select: 'doctorName specialization profileImage consultationFee hospitalName',
            })
            .sort({ appointmentDate: -1 });

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// RESCHEDULE APPOINTMENT (Patient)
// ========================
router.put('/reschedule/:id', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const { appointmentDate, appointmentTime } = req.body;

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patientId: req.user._id,
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        if (['completed', 'canceled', 'rejected'].includes(appointment.appointmentStatus)) {
            return res.status(400).json({ success: false, message: 'Cannot reschedule this appointment.' });
        }

        // Check slot availability
        const existingAppointment = await Appointment.findOne({
            doctorId: appointment.doctorId,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            appointmentStatus: { $in: ['pending', 'accepted'] },
            _id: { $ne: appointment._id },
        });

        if (existingAppointment) {
            return res.status(409).json({ success: false, message: 'This time slot is already booked.' });
        }

        appointment.appointmentDate = new Date(appointmentDate);
        appointment.appointmentTime = appointmentTime;
        appointment.appointmentStatus = 'pending'; // Reset to pending after reschedule
        await appointment.save();

        res.status(200).json({ success: true, message: 'Appointment rescheduled!', appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// CANCEL APPOINTMENT (Patient)
// ========================
router.put('/cancel/:id', verifyToken, authorizeRoles('patient'), async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patientId: req.user._id,
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        if (['completed', 'canceled'].includes(appointment.appointmentStatus)) {
            return res.status(400).json({ success: false, message: 'Cannot cancel this appointment.' });
        }

        appointment.appointmentStatus = 'canceled';
        await appointment.save();

        res.status(200).json({ success: true, message: 'Appointment canceled.', appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET DOCTOR'S APPOINTMENT REQUESTS (Doctor)
// ========================
router.get('/doctor/requests', verifyToken, authorizeRoles('doctor'), async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
        }

        const { status } = req.query;
        const filter = { doctorId: doctor._id };
        if (status) filter.appointmentStatus = status;

        const appointments = await Appointment.find(filter)
            .populate('patientId', 'name email photo phone')
            .sort({ appointmentDate: -1 });

        res.status(200).json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// ACCEPT APPOINTMENT (Doctor)
// ========================
router.put('/accept/:id', verifyToken, authorizeRoles('doctor'), async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            doctorId: doctor._id,
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        if (appointment.appointmentStatus !== 'pending') {
            return res.status(400).json({ success: false, message: 'Can only accept pending appointments.' });
        }

        appointment.appointmentStatus = 'accepted';
        await appointment.save();

        res.status(200).json({ success: true, message: 'Appointment accepted!', appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// REJECT APPOINTMENT (Doctor)
// ========================
router.put('/reject/:id', verifyToken, authorizeRoles('doctor'), async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            doctorId: doctor._id,
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        if (appointment.appointmentStatus !== 'pending') {
            return res.status(400).json({ success: false, message: 'Can only reject pending appointments.' });
        }

        appointment.appointmentStatus = 'rejected';
        await appointment.save();

        res.status(200).json({ success: true, message: 'Appointment rejected.', appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// MARK APPOINTMENT COMPLETED (Doctor)
// ========================
router.put('/complete/:id', verifyToken, authorizeRoles('doctor'), async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            doctorId: doctor._id,
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        if (appointment.appointmentStatus !== 'accepted') {
            return res.status(400).json({ success: false, message: 'Can only complete accepted appointments.' });
        }

        if (appointment.paymentStatus !== 'paid') {
            return res.status(400).json({ success: false, message: 'Payment must be completed before marking as complete.' });
        }

        appointment.appointmentStatus = 'completed';
        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Appointment completed! Redirect to prescription management.',
            appointment,
            redirectTo: `/dashboard/doctor/prescriptions?appointmentId=${appointment._id}`,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ========================
// GET SINGLE APPOINTMENT
// ========================
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('patientId', 'name email photo phone')
            .populate({
                path: 'doctorId',
                select: 'doctorName specialization profileImage consultationFee hospitalName',
            });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        res.status(200).json({ success: true, appointment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

module.exports = router;
