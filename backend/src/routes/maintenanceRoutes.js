const express = require('express');
const router = express.Router();
const { createBill, getFlatDues, markAsPaid, getAllMaintenance, updateBill, deleteBill } = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('admin'), createBill);
router.get('/', authorize('admin'), getAllMaintenance);
router.get('/my', getFlatDues);
router.get('/my/:flatId', getFlatDues);
router.patch('/pay/:id', authorize('admin', 'resident'), markAsPaid);
router.put('/:id', authorize('admin'), updateBill);
router.delete('/:id', authorize('admin'), deleteBill);

module.exports = router;
