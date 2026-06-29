const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
    },
    diagnosis: {
        type: String,
        required: true,
    },
    medications: {
        type: [
            {
                name: String,
                dosage: String,
                frequency: String,
                duration: String,
            }
        ],
        required: true,
    },
    notes: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
