const express = require('express');
const router = express.Router();
const { addVehicle, getMyVehicles, getAllVehicles, deleteVehicle } = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, addVehicle);
router.get('/my', protect, getMyVehicles);
router.get('/', protect, authorize('admin'), getAllVehicles);
router.delete('/:id', protect, deleteVehicle);

module.exports = router;
