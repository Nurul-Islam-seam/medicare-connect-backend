const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    doctorName: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true,
    },
    specialization: {
        type: String,
        required: [true, 'Specialization is required'],
        trim: true,
    },
    qualifications: {
        type: [String],
        required: [true, 'At least one qualification is required'],
    },
    experience: {
        type: Number,
        required: [true, 'Experience is required'],
        min: [0, 'Experience cannot be negative'],
    },
    consultationFee: {
        type: Number,
        required: [true, 'Consultation fee is required'],
        min: [0, 'Fee cannot be negative'],
    },
    hospitalName: {
        type: String,
        trim: true,
        default: '',
    },
    profileImage: {
        type: String,
        default: '',
    },
    availableDays: {
        type: [String],
        enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        default: [],
    },
    availableSlots: {
        type: [String],
        default: [],
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
    },
    totalRatings: {
        type: Number,
        default: 0,
    },
    ratingCount: {
        type: Number,
        default: 0,
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
}, { timestamps: true });

// Virtual for computing average rating
doctorSchema.methods.updateRating = function (newTotalRatings, newRatingCount) {
    this.totalRatings = newTotalRatings;
    this.ratingCount = newRatingCount;
    this.averageRating = newRatingCount > 0 ? parseFloat((newTotalRatings / newRatingCount).toFixed(1)) : 0;
};

// Index for search and sort
doctorSchema.index({ doctorName: 'text', specialization: 'text' });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ experience: -1 });
doctorSchema.index({ averageRating: -1 });

module.exports = mongoose.model('Doctor', doctorSchema);
