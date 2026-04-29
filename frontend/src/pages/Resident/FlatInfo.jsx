import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { Home, Users, UserPlus, Loader2, X, Car, Trash2, ShieldCheck } from 'lucide-react';

import { toast } from 'react-hot-toast';

const FlatInfo = () => {
  const { user } = useContext(AuthContext);
  const [flat, setFlat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', age: '', relation: 'Family' });

  const [vehicles, setVehicles] = useState([]);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ vehicleNumber: '', vehicleType: 'car', brand: '' });

  useEffect(() => {
    fetchFlatDetails();
    fetchVehicles();
  }, [user]);

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles/my');
      setVehicles(data);
    } catch (error) {}
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', newVehicle);
      toast.success('Vehicle registered');
      setNewVehicle({ vehicleNumber: '', vehicleType: 'car', brand: '' });
      setShowVehicleModal(false);
      fetchVehicles();
    } catch (error) {
      toast.error('Registration failed');
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Vehicle removed');
      fetchVehicles();
    } catch (error) {
      toast.error('Failed to remove vehicle');
    }
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const fetchFlatDetails = async () => {
    try {
      const { data } = await api.get('/flats/my');
      setFlat(data);
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch flat details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/flats/${flat._id}/members`, newMember);
      toast.success('Member added');
      setNewMember({ name: '', age: '', relation: 'Family' });
      setShowModal(false);
      fetchFlatDetails();
    } catch (error) {
      toast.error('Failed to add member');
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      await api.delete(`/flats/${flat._id}/members/${memberId}`);
      toast.success('Member removed');
      fetchFlatDetails();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Flat Information</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowVehicleModal(true)}
            className="bg-white text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all font-semibold border border-slate-100 shadow-sm"
          >
            <Car size={18} className="text-primary-600" />
            Add Vehicle
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-700 transition-all font-semibold shadow-lg shadow-primary-100"
          >
            <UserPlus size={18} />
            Add Member
          </button>
        </div>

      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary-500" size={40} />
        </div>
      ) : !flat ? (
        <div className="glass p-12 text-center rounded-3xl space-y-4">
          <Home size={64} className="mx-auto text-slate-200" />
          <h2 className="text-xl font-bold text-slate-700">No Flat Assigned</h2>
          <p className="text-slate-500 max-w-sm mx-auto">It seems you haven't been assigned to a flat yet. Please contact the society administrator to link your account.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="glass p-8 rounded-3xl text-center">
                <div className="w-24 h-24 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Home size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Flat {flat?.flatNumber}</h2>
                <p className="text-slate-500 font-medium">Floor: {flat?.floor}</p>
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Owner</span>
                    <span className="font-bold text-slate-700">{user.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Unit Status</span>
                    <span className="text-green-500 font-bold">Occupied</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="glass p-8 rounded-3xl min-h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <Users className="text-slate-600" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Family Members</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flat?.members?.length > 0 ? flat.members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-2xl group hover:border-primary-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{m.relation} • {m.age} Years</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMember(m._id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )) : (
                    <div className="col-span-2 py-10 text-center text-slate-400">
                      <p>No family members added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl mt-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Car className="text-slate-600" size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">My Vehicles</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vehicles.length > 0 ? vehicles.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-2xl group hover:border-primary-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center">
                      <Car size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{v.vehicleNumber}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{v.brand} • {v.vehicleType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteVehicle(v._id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )) : (
                <div className="col-span-3 py-10 text-center text-slate-400">
                  <p>No vehicles registered.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}


      {showModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '448px', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Add Family Member</h2>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Name</label>
                <input
                  type="text" required
                  value={newMember.name}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                  placeholder="Full Name"
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 ml-1">Age</label>
                  <input
                    type="number" required
                    value={newMember.age}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                    placeholder="25"
                    onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 ml-1">Relation</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                    value={newMember.relation}
                    onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                  >
                    <option value="Family">Family</option>
                    <option value="Friend">Friend</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-all font-semibold"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showVehicleModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowVehicleModal(false); }}
        >
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '448px', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-primary-100 p-2 rounded-xl text-primary-600">
                 <Car size={24} />
               </div>
               <h2 className="text-xl font-bold text-slate-800">Register Vehicle</h2>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Vehicle Number</label>
                <input
                  type="text" required
                  value={newVehicle.vehicleNumber}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                  placeholder="MH 12 AB 1234"
                  onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 ml-1">Vehicle Type</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                    value={newVehicle.vehicleType}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicleType: e.target.value })}
                  >
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 ml-1">Brand</label>
                  <input
                    type="text" required
                    value={newVehicle.brand}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                    placeholder="Toyota, Honda, etc."
                    onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-all font-semibold"
                >
                  Register
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

export default FlatInfo;