const express = require('express');
const router = express.Router();
const { createAmenity, getAllAmenities, updateAmenity, deleteAmenity } = require('../controllers/amenityController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), createAmenity);
router.get('/', protect, getAllAmenities);
router.put('/:id', protect, authorize('admin'), updateAmenity);
router.delete('/:id', protect, authorize('admin'), deleteAmenity);

module.exports = router;
