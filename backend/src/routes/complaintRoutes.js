const express = require('express');
const router = express.Router();
const { createComplaint, updateComplaintStatus, getResidentComplaints, getAllComplaints } = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('resident'), createComplaint);
router.get('/', authorize('admin'), getAllComplaints);
router.get('/my', authorize('resident'), getResidentComplaints);
router.put('/:id', authorize('admin'), updateComplaintStatus);

module.exports = router;
