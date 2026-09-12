# Pariharam Backend

This is the backend API for the IHRD Student Grievance & Complaint Portal.

## Tech Stack
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcrypt
- Multer
- CORS
- dotenv

## Setup
1. Open a terminal in the backend folder.
2. Install dependencies:
   npm install
3. Create a .env file based on .env.example.
4. Start the server:
   npm run dev

## Default API Base URL
http://localhost:5000

## Routes
### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Complaints
- POST /api/complaints
- GET /api/complaints/my
- GET /api/complaints/:id
- GET /api/complaints/track/:complaintId

### Admin
- GET /api/admin/dashboard
- GET /api/admin/complaints
- PUT /api/admin/complaints/:id/status
- PUT /api/admin/complaints/:id/assign
- PUT /api/admin/complaints/:id/resolve

## Notes
- The app uses JWT for protected routes.
- Uploaded complaint photos are stored in the uploads folder.
- MongoDB is optional during early local setup; the server can still start if the database is not available.
