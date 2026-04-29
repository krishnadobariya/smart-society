const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { protect, authorize } = require('../middleware/auth.js');

router.post('/', protect, authorize('admin'), incomeController.addIncome);
router.get('/', protect, authorize('admin'), incomeController.getAllIncome);
router.put('/:id', protect, authorize('admin'), incomeController.updateIncome);
router.delete('/:id', protect, authorize('admin'), incomeController.deleteIncome);

module.exports = router;
