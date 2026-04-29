const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, deleteNotification } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.post('/', authorize('admin'), createNotification);
router.delete('/:id', authorize('admin'), deleteNotification);

module.exports = router;
