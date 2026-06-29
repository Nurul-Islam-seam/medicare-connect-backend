const express = require('express');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');

const router = express.Router();

// POST /api/seed - Seed database with test data
router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await Review.deleteMany({});
    console.log('🗑️  Cleared existing data\n');

    // ==================== CREATE USERS ====================
    console.log('👥 Creating users...');

    // Admin User
    const adminPassword = await bcryptjs.hash('Admin@123', 10);
    const [admin] = await User.insertMany([{
      name: 'Clinical Hub Admin',
      email: 'admin@medicare.com',
      password: adminPassword,
      phone: '+1-800-MEDICARE',
      gender: 'male',
      photo: 'https://i.pravatar.cc/150?img=12',
      role: 'admin',
      status: 'active'
    }]);
    console.log('✅ Admin:', admin.email);

    // Patients
    const patientPassword = await bcryptjs.hash('Patient@123', 10);
    const patients = await User.insertMany([
      {
        name: 'Sarah Johnson',
        email: 'sarah@patient.com',
        password: patientPassword,
        phone: '+1-555-0101',
        gender: 'female',
        photo: 'https://i.pravatar.cc/150?img=1',
        role: 'patient',
        status: 'active'
      },
      {
        name: 'Michael Chen',
        email: 'michael@patient.com',
        password: patientPassword,
        phone: '+1-555-0102',
        gender: 'male',
        photo: 'https://i.pravatar.cc/150?img=2',
        role: 'patient',
        status: 'active'
      },
      {
        name: 'Emma Davis',
        email: 'emma@patient.com',
        password: patientPassword,
        phone: '+1-555-0103',
        gender: 'female',
        photo: 'https://i.pravatar.cc/150?img=3',
        role: 'patient',
        status: 'active'
      }
    ]);
    console.log('✅ Patients:', patients.length);

    // Doctors
    const doctorPassword = await bcryptjs.hash('Doctor@123', 10);
    const doctorUsers = await User.insertMany([
      {
        name: 'Amanda Ross',
        email: 'amanda@doctor.com',
        password: doctorPassword,
        phone: '+1-555-1001',
        gender: 'female',
        photo: 'https://i.pravatar.cc/150?img=5',
        role: 'doctor',
        status: 'active'
      },
      {
        name: 'James Carter',
        email: 'james@doctor.com',
        password: doctorPassword,
        phone: '+1-555-1002',
        gender: 'male',
        photo: 'https://i.pravatar.cc/150?img=6',
        role: 'doctor',
        status: 'active'
      },
      {
        name: 'Sophia Patel',
        email: 'sophia@doctor.com',
        password: doctorPassword,
        phone: '+1-555-1003',
        gender: 'female',
        photo: 'https://i.pravatar.cc/150?img=7',
        role: 'doctor',
        status: 'active'
      },
      {
        name: 'Robert Chen',
        email: 'robert@doctor.com',
        password: doctorPassword,
        phone: '+1-555-1004',
        gender: 'male',
        photo: 'https://i.pravatar.cc/150?img=8',
        role: 'doctor',
        status: 'active'
      },
      {
        name: 'Eleanor Vance',
        email: 'eleanor@doctor.com',
        password: doctorPassword,
        phone: '+1-555-1005',
        gender: 'female',
        photo: 'https://i.pravatar.cc/150?img=9',
        role: 'doctor',
        status: 'active'
      },
      {
        name: 'Rajyan Kumar',
        email: 'rajyan@doctor.com',
        password: doctorPassword,
        phone: '+1-555-1006',
        gender: 'male',
        photo: 'https://i.pravatar.cc/150?img=10',
        role: 'doctor',
        status: 'active'
      }
    ]);
    console.log('✅ Doctors:', doctorUsers.length, '\n');

    // ==================== CREATE DOCTOR PROFILES ====================
    console.log('🏥 Creating doctor profiles...');

    const doctors = await Doctor.insertMany([
      {
        userId: doctorUsers[0]._id,
        doctorName: 'Amanda Ross',
        specialization: 'Cardiology',
        qualifications: ['MD', 'FACC - Harvard Medical School'],
        experience: 14,
        consultationFee: 150,
        hospitalName: 'Boston General Hospital',
        profileImage: 'https://i.pravatar.cc/150?img=5',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'],
        verificationStatus: 'verified',
        averageRating: 4.8,
        ratingCount: 42,
        totalRatings: 201
      },
      {
        userId: doctorUsers[1]._id,
        doctorName: 'James Carter',
        specialization: 'Neurology',
        qualifications: ['MD', 'PhD - Johns Hopkins University'],
        experience: 18,
        consultationFee: 180,
        hospitalName: 'Johns Hopkins Medical Center',
        profileImage: 'https://i.pravatar.cc/150?img=6',
        availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        availableSlots: ['10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM'],
        verificationStatus: 'verified',
        averageRating: 4.9,
        ratingCount: 38,
        totalRatings: 186
      },
      {
        userId: doctorUsers[2]._id,
        doctorName: 'Sophia Patel',
        specialization: 'Pediatrics',
        qualifications: ['MD', 'FAAP - Stanford University'],
        experience: 10,
        consultationFee: 120,
        hospitalName: 'Stanford Children\'s Health',
        profileImage: 'https://i.pravatar.cc/150?img=7',
        availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
        availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
        verificationStatus: 'verified',
        averageRating: 4.7,
        ratingCount: 35,
        totalRatings: 164
      },
      {
        userId: doctorUsers[3]._id,
        doctorName: 'Robert Chen',
        specialization: 'Orthopedics',
        qualifications: ['MD', 'FAAOS - Mayo Clinic College of Medicine'],
        experience: 12,
        consultationFee: 160,
        hospitalName: 'Mayo Clinic Rehabilitation',
        profileImage: 'https://i.pravatar.cc/150?img=8',
        availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
        availableSlots: ['08:00 AM', '09:00 AM', '10:00 AM', '01:00 PM', '03:00 PM'],
        verificationStatus: 'verified',
        averageRating: 4.6,
        ratingCount: 28,
        totalRatings: 134
      },
      {
        userId: doctorUsers[4]._id,
        doctorName: 'Eleanor Vance',
        specialization: 'Dermatology',
        qualifications: ['MD', 'Yale Dermatology Health & Skin'],
        experience: 11,
        consultationFee: 130,
        hospitalName: 'Yale Medical Dermatology Center',
        profileImage: 'https://i.pravatar.cc/150?img=9',
        availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableSlots: ['09:00 AM', '10:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
        verificationStatus: 'verified',
        averageRating: 4.8,
        ratingCount: 31,
        totalRatings: 157
      },
      {
        userId: doctorUsers[5]._id,
        doctorName: 'Rajyan Kumar',
        specialization: 'General Medicine',
        qualifications: ['MBBS', 'MD - Delhi Medical College'],
        experience: 8,
        consultationFee: 100,
        hospitalName: 'Metro Health Clinic',
        profileImage: 'https://i.pravatar.cc/150?img=10',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        availableSlots: ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'],
        verificationStatus: 'pending',
        averageRating: 4.5,
        ratingCount: 22,
        totalRatings: 108
      }
    ]);
    console.log('✅ Doctor Profiles:', doctors.length, '\n');

    // ==================== CREATE APPOINTMENTS ====================
    console.log('📅 Creating appointments...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.insertMany([
      {
        patientId: patients[0]._id,
        doctorId: doctors[0]._id,
        appointmentDate: tomorrow,
        appointmentTime: '10:00 AM',
        symptoms: 'Chest pain and shortness of breath',
        appointmentStatus: 'accepted',
        paymentStatus: 'paid'
      },
      {
        patientId: patients[1]._id,
        doctorId: doctors[1]._id,
        appointmentDate: tomorrow,
        appointmentTime: '02:00 PM',
        symptoms: 'Recurring headaches and dizziness',
        appointmentStatus: 'accepted',
        paymentStatus: 'paid'
      },
      {
        patientId: patients[2]._id,
        doctorId: doctors[2]._id,
        appointmentDate: tomorrow,
        appointmentTime: '03:00 PM',
        symptoms: 'Fever and cough for 3 days',
        appointmentStatus: 'pending',
        paymentStatus: 'pending'
      },
      {
        patientId: patients[0]._id,
        doctorId: doctors[3]._id,
        appointmentDate: new Date(tomorrow.getTime() + 86400000),
        appointmentTime: '09:00 AM',
        symptoms: 'Lower back pain',
        appointmentStatus: 'accepted',
        paymentStatus: 'paid'
      },
      {
        patientId: patients[1]._id,
        doctorId: doctors[4]._id,
        appointmentDate: new Date(tomorrow.getTime() + 172800000),
        appointmentTime: '11:00 AM',
        symptoms: 'Skin rash on arms',
        appointmentStatus: 'rejected',
        paymentStatus: 'pending'
      },
      {
        patientId: patients[2]._id,
        doctorId: doctors[0]._id,
        appointmentDate: new Date(tomorrow.getTime() + 259200000),
        appointmentTime: '01:00 PM',
        symptoms: 'Palpitations and irregular heartbeat',
        appointmentStatus: 'completed',
        paymentStatus: 'paid'
      }
    ]);
    console.log('✅ Appointments:', appointments.length, '\n');

    // ==================== CREATE REVIEWS ====================
    console.log('⭐ Creating reviews...');

    const reviews = await Review.insertMany([
      {
        patientId: patients[0]._id,
        doctorId: doctors[0]._id,
        rating: 5,
        reviewText: 'Dr. Amanda Ross is excellent! Very professional and caring. She explained everything clearly.'
      },
      {
        patientId: patients[1]._id,
        doctorId: doctors[1]._id,
        rating: 5,
        reviewText: 'Great doctor! Thorough examination and provided helpful treatment recommendations.'
      },
      {
        patientId: patients[2]._id,
        doctorId: doctors[2]._id,
        rating: 4,
        reviewText: 'Good experience. Dr. Sophia is very friendly with kids and makes them comfortable.'
      },
      {
        patientId: patients[0]._id,
        doctorId: doctors[3]._id,
        rating: 5,
        reviewText: 'Best orthopedic doctor in town. Resolved my back pain issues completely!'
      },
      {
        patientId: patients[1]._id,
        doctorId: doctors[4]._id,
        rating: 4,
        reviewText: 'Professional and punctual. Treatment results were as expected.'
      }
    ]);
    console.log('✅ Reviews:', reviews.length, '\n');

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Admin Users: 1`);
    console.log(`   - Patients: ${patients.length}`);
    console.log(`   - Doctors: ${doctorUsers.length}`);
    console.log(`   - Doctor Profiles: ${doctors.length}`);
    console.log(`   - Appointments: ${appointments.length}`);
    console.log(`   - Reviews: ${reviews.length}\n`);
    console.log('🔐 Test Credentials:');
    console.log('   Admin: admin@medicare.com / Admin@123');
    console.log('   Patient: sarah@patient.com / Patient@123');
    console.log('   Doctor: amanda@doctor.com / Doctor@123\n');

    res.json({
      success: true,
      message: '✅ Database seeding completed successfully!',
      data: {
        admins: 1,
        patients: patients.length,
        doctors: doctorUsers.length,
        appointments: appointments.length,
        reviews: reviews.length,
        credentials: {
          admin: 'admin@medicare.com / Admin@123',
          patient: 'sarah@patient.com / Patient@123',
          doctor: 'amanda@doctor.com / Doctor@123'
        }
      }
    });
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Database seeding failed',
      error: error.message
    });
  }
});

module.exports = router;
