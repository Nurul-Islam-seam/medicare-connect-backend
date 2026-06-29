const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required'],
    },
    appointmentTime: {
        type: String,
        required: [true, 'Appointment time is required'],
    },
    appointmentStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'canceled'],
        default: 'pending',
    },
    symptoms: {
        type: String,
        required: [true, 'Please describe your symptoms'],
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid'],
        default: 'unpaid',
    },
}, { timestamps: true });

// Indexes for faster queries
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: -1 });
appointmentSchema.index({ appointmentStatus: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
