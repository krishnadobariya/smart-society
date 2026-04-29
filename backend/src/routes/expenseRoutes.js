const express = require('express');
const router = express.Router();
const { addExpense, getFinancialSummary, getAllExpenses, updateExpense, deleteExpense, exportFinancialReport } = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('admin'), addExpense);
router.get('/', authorize('admin'), getAllExpenses);
router.get('/summary', authorize('admin'), getFinancialSummary);
router.get('/export', authorize('admin'), exportFinancialReport);
router.put('/:id', authorize('admin'), updateExpense);
router.delete('/:id', authorize('admin'), deleteExpense);

module.exports = router;
