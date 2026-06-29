# MediCare Connect - Backend API

## Overview
The backend service for MediCare Connect, a comprehensive healthcare management system. This RESTful API powers the client application by handling secure authentication, database operations, and core business logic for patients, doctors, and appointments.

## Key Features
- **Role-Based Access Control (RBAC):** Strict authorization middleware securing endpoints for Admins, Doctors, and Patients.
- **Secure Authentication:** JWT token generation and bcrypt password hashing.
- **Advanced Querying:** Pagination, sorting, and filtering for doctor search APIs.
- **Data Integrity:** Mongoose schemas with strict validation, pre-save hooks, and custom error handling.
- **Automated Seeding:** Built-in seed scripts for rapid environment setup and dummy data generation.

## Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Atlas Cloud)
- **ODM:** Mongoose
- **Security:** bcryptjs, jsonwebtoken, cors, dotenv

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nurul-Islam-seam/medicare-connect-backend.git
   cd medicare-connect-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Seed the Database (Optional)**
   To populate the database with dummy data for testing:
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:10000`.

## API Documentation
Core endpoints include:
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user and receive JWT
- `GET /api/doctors` - Retrieve paginated and filtered doctor lists
- `POST /api/appointments` - Book a new appointment (Protected)

## Deployment
Configured for deployment on **Render** (Web Service). Uses standard Node.js build commands (`npm install` and `node index.js`).

## License
MIT License. See `LICENSE` for more information.
