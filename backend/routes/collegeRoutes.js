const express = require('express');
const { getColleges, createCollege } = require('../controllers/collegeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getColleges);
router.post('/', protect, authorize('admin', 'central_admin'), createCollege);

module.exports = router;
