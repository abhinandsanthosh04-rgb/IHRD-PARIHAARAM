const express = require('express');
const {
  submitComplaint,
  getMyComplaints,
  getComplaintById,
  trackComplaintById,
  getAllComplaints,
  updateComplaintStatus,
  assignComplaint,
  resolveComplaint,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/', protect, upload.single('image'), submitComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/track/:complaintId', trackComplaintById);
router.get('/:id', protect, getComplaintById);

router.get('/', protect, authorize('admin', 'central_admin'), getAllComplaints);
router.put('/:id/status', protect, authorize('admin', 'central_admin'), updateComplaintStatus);
router.put('/:id/assign', protect, authorize('admin', 'central_admin'), assignComplaint);
router.put('/:id/resolve', protect, authorize('admin', 'central_admin'), resolveComplaint);

module.exports = router;
