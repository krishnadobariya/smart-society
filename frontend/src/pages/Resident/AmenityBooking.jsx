import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Info, 
  CheckCircle2, 
  Plus, 
  Loader2,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const AmenityBooking = () => {
  const { user } = useContext(AuthContext);
  const socket = useSocket();
  const [amenities, setAmenities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('booking_updated', (data) => {
      console.log('Socket: Received booking_updated event', data);
      toast.success(data.message, { icon: '🗓️' });
      fetchData();
    });

    return () => {
      socket.off('booking_updated');
    };
  }, [socket]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const fetchData = async () => {
    try {
      const [amenitiesRes, bookingsRes] = await Promise.all([
        api.get('/amenities'),
        api.get('/bookings/my')
      ]);
      setAmenities(amenitiesRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      toast.error('Failed to load booking data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (isSubmitting || !selectedAmenity) return;
    
    setIsSubmitting(true);
    console.log("Attempting to book:", selectedAmenity.name);
    
    try {
      const payload = {
        ...formData,
        amenityId: selectedAmenity._id
      };
      
      const { data } = await api.post('/bookings', payload);
      console.log("Server response:", data);

      // 1. Close modal IMMEDIATELY
      setShowModal(false); 
      
      // 2. Show success message
      toast.success('Booking request submitted!');
      
      // 3. Reset form states
      setFormData({ date: '', startTime: '', endTime: '' });
      setSelectedAmenity(null);
      
      // 4. Refresh background data
      fetchData();
    } catch (error) {
      console.error("Booking submission error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Amenity Booking</h1>
          <p className="text-slate-500">Book common society facilities for your use.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Amenities Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 className="animate-spin mx-auto text-primary-500" size={40} />
            </div>
          ) : amenities.length === 0 ? (
            <div className="col-span-full py-20 text-center glass rounded-3xl">
              <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500">No amenities available for booking.</p>
            </div>
          ) : amenities.map((amenity) => (
            <div key={amenity._id} className="glass p-6 rounded-3xl group hover:scale-[1.02] transition-all border border-slate-100">
              <div className="bg-primary-50 text-primary-600 p-4 rounded-2xl w-fit mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <Building2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{amenity.name}</h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{amenity.description}</p>
              
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Charges</p>
                  <p className="text-lg font-bold text-slate-800">₹{amenity.pricePerHour}/hr</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedAmenity(amenity);
                    setShowModal(true);
                  }}
                  className="bg-primary-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* My Bookings */}
        <div className="lg:col-span-1">
          <div className="glass p-8 rounded-3xl sticky top-24 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <CalendarIcon className="text-primary-500" size={20} />
              My Bookings
            </h3>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {bookings.length > 0 ? bookings.map((booking) => (
                <div key={booking._id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-sm">{booking.amenityId?.name}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      booking.status === 'approved' ? 'bg-green-100 text-green-600' :
                      booking.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon size={12} />
                      {new Date(booking.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {booking.startTime} - {booking.endTime}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center py-10 text-slate-400 text-sm italic">No bookings yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '512px', padding: '2.5rem', borderRadius: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary-100 p-2.5 rounded-2xl text-primary-600">
                <CalendarIcon size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Book {selectedAmenity?.name}</h2>
            </div>

            <form onSubmit={handleBooking} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Select Date</label>
                <input 
                  type="date" required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Start Time</label>
                  <input 
                    type="time" required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">End Time</label>
                  <input 
                    type="time" required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-primary-50 p-4 rounded-2xl flex items-start gap-3">
                <Info size={20} className="text-primary-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-primary-700 leading-relaxed">
                  Bookings are subject to approval by the committee. Cancellation is allowed up to 24 hours before the slot.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AmenityBooking;
