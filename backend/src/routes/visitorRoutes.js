const express = require('express');
const router = express.Router();
const { addVisitor, updateVisitorStatus, getVisitorLogs, getResidentVisitors, getVisitorSummary, exportVisitorLogs, preApproveGuest, verifyPassCode } = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('security'), addVisitor);
router.post('/pre-approve', authorize('resident'), preApproveGuest);
router.post('/verify-passcode', authorize('security'), verifyPassCode);
router.get('/', authorize('admin', 'security'), getVisitorLogs);
router.get('/summary', authorize('admin'), getVisitorSummary);
router.get('/export', authorize('admin'), exportVisitorLogs);
router.get('/my', getResidentVisitors);
router.get('/my/:flatId', getResidentVisitors);
router.put('/:id', authorize('security', 'resident'), updateVisitorStatus);

module.exports = router;
