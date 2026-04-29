const Booking = require('../models/Booking');
const Amenity = require('../models/Amenity');

exports.createBooking = async (req, res) => {
  try {
    const { amenityId, date, startTime, endTime } = req.body;
    const amenity = await Amenity.findById(amenityId);
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });

    // Simple overlapping check (can be improved)
    const existing = await Booking.findOne({
      amenityId,
      date: new Date(date),
      startTime,
      status: { $ne: 'cancelled' }
    });

    if (existing) return res.status(400).json({ message: 'This slot is already booked' });

    const booking = await Booking.create({
      ...req.body,
      residentId: req.user._id,
      totalPrice: amenity.pricePerHour // Simplified calculation
    });
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ residentId: req.user._id }).populate('amenityId');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('amenityId').populate('residentId', 'name');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('amenityId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    // Real-time update to resident
    const residentRoom = booking.residentId.toString();
    console.log(`Emitting booking_updated to room: ${residentRoom} for amenity: ${booking.amenityId?.name}`);
    
    req.io.to(residentRoom).emit('booking_updated', {
      message: `Your booking for ${booking.amenityId?.name} has been ${status}.`,
      booking,
      status
    });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
