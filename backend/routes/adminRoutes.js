const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  resolveComplaint,
} = require('../controllers/complaintController');

const router = express.Router();

router.get('/dashboard', protect, authorize('admin', 'central_admin'), getDashboardStats);
router.get('/complaints', protect, authorize('admin', 'central_admin'), getAllComplaints);
router.get('/complaints/:id', protect, authorize('admin', 'central_admin'), getComplaintById);
router.put('/complaints/:id/status', protect, authorize('admin', 'central_admin'), updateComplaintStatus);
router.put('/complaints/:id/assign', protect, authorize('admin', 'central_admin'), assignComplaint);
router.put('/complaints/:id/resolve', protect, authorize('admin', 'central_admin'), resolveComplaint);

module.exports = router;
