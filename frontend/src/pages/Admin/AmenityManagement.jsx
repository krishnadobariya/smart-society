import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Building2, Plus, Trash2, Edit, Loader2, Calendar, Check, X, Clock } from 'lucide-react';

const AmenityManagement = () => {
  const [activeTab, setActiveTab] = useState('amenities'); // 'amenities' or 'requests'
  const [amenities, setAmenities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerHour: '',
    status: 'available'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAmenities();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const fetchAmenities = async () => {
    try {
      const { data } = await api.get('/amenities');
      setAmenities(data);
    } catch (error) {
      toast.error('Failed to fetch amenities');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings');
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingAmenity) {
        await api.put(`/amenities/${editingAmenity._id}`, formData);
        toast.success('Amenity updated successfully');
      } else {
        await api.post('/amenities', formData);
        toast.success('Amenity created successfully');
      }
      setShowModal(false);
      setEditingAmenity(null);
      setFormData({ name: '', description: '', pricePerHour: '', status: 'available' });
      fetchAmenities();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save amenity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this amenity?')) return;
    try {
      await api.delete(`/amenities/${id}`);
      toast.success('Amenity removed');
      fetchAmenities();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleUpdateBookingStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}`, { status });
      toast.success(`Booking ${status}`);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Amenity Management</h1>
          <div className="flex gap-4 mt-2">
             <button 
                onClick={() => setActiveTab('amenities')}
                className={`text-sm font-bold transition-all px-4 py-2 rounded-xl ${activeTab === 'amenities' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-slate-400 hover:bg-slate-100'}`}
             >
               Facilities
             </button>
             <button 
                onClick={() => setActiveTab('requests')}
                className={`text-sm font-bold transition-all px-4 py-2 rounded-xl flex items-center gap-2 ${activeTab === 'requests' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-slate-400 hover:bg-slate-100'}`}
             >
               Booking Requests
               {bookings.filter(b => b.status === 'pending').length > 0 && (
                 <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {bookings.filter(b => b.status === 'pending').length}
                 </span>
               )}
             </button>
          </div>
        </div>
        {activeTab === 'amenities' && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-100"
          >
            <Plus size={20} />
            Add Amenity
          </button>
        )}
      </div>

      {activeTab === 'amenities' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 className="animate-spin mx-auto text-primary-500" size={40} />
            </div>
          ) : amenities.length === 0 ? (
            <div className="col-span-full py-20 text-center glass rounded-3xl">
               <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-500 font-medium">No amenities configured yet.</p>
            </div>
          ) : amenities.map((amenity) => (
            <div key={amenity._id} className="glass p-6 rounded-3xl border border-slate-100 group hover:border-primary-100 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary-50 text-primary-600 p-3 rounded-2xl group-hover:bg-primary-600 group-hover:text-white transition-all">
                  <Building2 size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => {
                      setEditingAmenity(amenity);
                      setFormData({
                        name: amenity.name,
                        description: amenity.description,
                        pricePerHour: amenity.pricePerHour,
                        status: amenity.status
                      });
                      setShowModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(amenity._id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800">{amenity.name}</h3>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{amenity.description}</p>
              
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate</p>
                  <p className="font-bold text-slate-800">₹{amenity.pricePerHour}/hr</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  amenity.status === 'available' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {amenity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-3xl border border-slate-100">
           <table className="w-full text-left">
             <thead className="bg-slate-50/50 border-b border-slate-100">
               <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                 <th className="px-6 py-4">Facility</th>
                 <th className="px-6 py-4">Resident</th>
                 <th className="px-6 py-4">Slot Details</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {bookings.length === 0 ? (
                 <tr>
                   <td colSpan="5" className="px-6 py-10 text-center text-slate-400">No booking requests found.</td>
                 </tr>
               ) : bookings.map((booking) => (
                 <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors">
                   <td className="px-6 py-4">
                     <p className="font-bold text-slate-800">{booking.amenityId?.name}</p>
                   </td>
                   <td className="px-6 py-4">
                     <p className="font-medium text-slate-700">{booking.residentId?.name}</p>
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2 text-xs text-slate-500">
                         <Calendar size={14} className="text-primary-500" />
                         {new Date(booking.date).toLocaleDateString()}
                       </div>
                       <div className="flex items-center gap-2 text-xs text-slate-500">
                         <Clock size={14} className="text-primary-500" />
                         {booking.startTime} - {booking.endTime}
                       </div>
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                       booking.status === 'approved' ? 'bg-green-100 text-green-600' :
                       booking.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                       'bg-red-100 text-red-600'
                     }`}>
                       {booking.status}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-right">
                     {booking.status === 'pending' && (
                       <div className="flex justify-end gap-2">
                         <button 
                            onClick={() => handleUpdateBookingStatus(booking._id, 'approved')}
                            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-all"
                            title="Approve"
                         >
                           <Check size={16} />
                         </button>
                         <button 
                            onClick={() => handleUpdateBookingStatus(booking._id, 'rejected')}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-all"
                            title="Reject"
                         >
                           <X size={16} />
                         </button>
                       </div>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {showModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '512px', padding: '2.5rem', borderRadius: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary-100 p-2.5 rounded-2xl text-primary-600">
                <Building2 size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                {editingAmenity ? 'Edit Amenity' : 'Add New Amenity'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Amenity Name</label>
                <input 
                  type="text" required
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. Swimming Pool"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Price Per Hour (₹)</label>
                  <input 
                    type="number" required
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    placeholder="100"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({...formData, pricePerHour: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Status</label>
                  <select 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Description</label>
                <textarea 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
                  placeholder="Rules and facility details..."
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAmenity(null);
                    setFormData({ name: '', description: '', pricePerHour: '', status: 'available' });
                  }}
                  className="flex-1 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingAmenity ? 'Update Amenity' : 'Save Amenity'
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

export default AmenityManagement;
