const express = require('express');
const router = express.Router();
const { createFlat, assignResident, getAllFlats, updateFlat, deleteFlat, addMember, deleteMember, getMyFlat } = require('../controllers/flatController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('admin'), createFlat);
router.get('/', authorize('admin', 'security'), getAllFlats);
router.get('/my', authorize('resident'), getMyFlat);
router.post('/assign', authorize('admin'), assignResident);
router.put('/:id', authorize('admin'), updateFlat);
router.delete('/:id', authorize('admin'), deleteFlat);

router.post('/:flatId/members', addMember);
router.delete('/:flatId/members/:memberId', deleteMember);

module.exports = router;
