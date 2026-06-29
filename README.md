# MediCare Connect - Backend Server

The backend server for the MediCare Connect hospital appointment & healthcare management system.

## Technologies Used
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password hashing
- Stripe for payment processing
- CORS & Dotenv

## Prerequisites
- Node.js (v18+)
- MongoDB Atlas Cluster or Local MongoDB
- Stripe Account (for payments)

## Environment Variables
Create a `.env` file in the root of the server directory with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:3000
```

## Installation & Setup
1. Clone the repository and navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The server will run on `http://localhost:5000`.

## API Endpoints Overview
- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/google`, `/api/auth/me`
- **Users**: `/api/users/my/profile`
- **Doctors**: `/api/doctors` (public list), `/api/doctors/:id`
- **Appointments**: `/api/appointments`, `/api/appointments/my`, `/api/appointments/cancel/:id`, `/api/appointments/reschedule/:id`
- **Payments**: `/api/payment/create-payment-intent`, `/api/payment/confirm`, `/api/payments/my`
- **Reviews**: `/api/reviews`, `/api/reviews/my`
- **Admin**: `/api/admin/stats`, `/api/admin/users`, `/api/admin/doctors`, `/api/admin/appointments`, `/api/admin/analytics`

## Features Included
- **JWT & Role-based Access Control**: Different access levels for Patient, Doctor, and Admin.
- **Secure Password Hashing**: Encrypted with bcryptjs.
- **Data Validation & Sanitization**: Comprehensive Mongoose schemas.
- **Global Error Handling**: Standardized error responses across all routes.
- **Advanced Querying**: Search, filter, and pagination support.
