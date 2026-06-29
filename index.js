require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const doctorRoutes = require('./routes/doctor.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const reviewRoutes = require('./routes/review.routes');
const paymentRoutes = require('./routes/payment.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const adminRoutes = require('./routes/admin.routes');
const seedRoutes = require('./routes/seed.routes');

const app = express();
const port = process.env.PORT || 5000;

// ========================
// MIDDLEWARE
// ========================

// CORS — whitelist client origins for production security
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.CLIENT_URL, // Set this in .env for production
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ========================
// ROUTES
// ========================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'MediCare Connect API Server is running!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            doctors: '/api/doctors',
            appointments: '/api/appointments',
            reviews: '/api/reviews',
            payments: '/api/payments',
            prescriptions: '/api/prescriptions',
            admin: '/api/admin',
            seed: 'POST /api/seed (Initialize database with test data)',
        },
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', seedRoutes);

// ========================
// 404 HANDLER
// ========================
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ========================
// GLOBAL ERROR HANDLER
// ========================
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);

    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ success: false, message: 'CORS: Origin not allowed.' });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error.',
    });
});

// ========================
// START SERVER
// ========================
const startServer = async () => {
    try {
        if (process.env.MONGO_URI) {
            await connectDB();
        } else {
            console.warn('⚠️  MONGO_URI is not set. Database features will not work.');
        }

        app.listen(port, () => {
            console.log(`🚀 MediCare Connect Server is running on port ${port}`);
            console.log(`📡 API: http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
