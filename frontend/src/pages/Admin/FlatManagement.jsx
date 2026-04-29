import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Building2, Trash2, Edit, Loader2 } from 'lucide-react';

const FlatManagement = () => {
  const [flats, setFlats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [formData, setFormData] = useState({ flatNumber: '', floor: '' });
  const [assignData, setAssignData] = useState({ userId: '' });

  useEffect(() => {
    fetchFlats();
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const { data } = await api.get('/auth/users?role=resident');
      setResidents(data);
    } catch (error) {
      console.error('Failed to fetch residents');
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showAddModal]);

  const fetchFlats = async () => {
    try {
      const { data } = await api.get('/flats');
      setFlats(data);
    } catch (error) {
      toast.error('Failed to fetch flats');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFlat = async (e) => {
    e.preventDefault();
    try {
      if (selectedFlat) {
        await api.put(`/flats/${selectedFlat._id}`, formData);
        toast.success('Flat updated successfully');
      } else {
        await api.post('/flats', formData);
        toast.success('Flat added successfully');
      }
      setShowAddModal(false);
      setSelectedFlat(null);
      setFormData({ flatNumber: '', floor: '' });
      fetchFlats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save flat');
    }
  };

  const handleDeleteFlat = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flat?')) return;
    try {
      await api.delete(`/flats/${id}`);
      toast.success('Flat deleted successfully');
      fetchFlats();
    } catch (error) {
      toast.error('Failed to delete flat');
    }
  };

  const handleAssignResident = async (e) => {
    e.preventDefault();
    try {
      await api.post('/flats/assign', {
        flatId: selectedFlat._id,
        userId: assignData.userId
      });
      toast.success('Resident assigned successfully');
      setShowAssignModal(false);
      setSelectedFlat(null);
      fetchFlats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign resident');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Flat Management</h1>
          <p className="text-slate-500">Manage society units and residents</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-700 transition-all font-semibold"
        >
          <Building2 size={18} />
          Add New Flat
        </button>
      </div>

      <div className="glass overflow-hidden rounded-3xl border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Flat Number</th>
              <th className="px-6 py-4">Floor</th>
              <th className="px-6 py-4">Resident</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-10">
                  <Loader2 className="animate-spin mx-auto text-primary-500" size={32} />
                </td>
              </tr>
            ) : flats.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-10 text-slate-400">No flats found.</td>
              </tr>
            ) : flats.map((flat) => (
              <tr key={flat._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{flat.flatNumber}</td>
                <td className="px-6 py-4 text-slate-600">{flat.floor}</td>
                <td className="px-6 py-4">
                  {flat.owner ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800">{flat.owner.name}</span>
                      <span className="text-xs text-slate-400">{flat.owner.email}</span>
                    </div>
                  ) : (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Vacant</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setSelectedFlat(flat);
                        setShowAssignModal(true);
                      }}
                      className="px-3 py-1 text-xs font-bold bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all"
                    >
                      Assign
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedFlat(flat);
                        setFormData({ flatNumber: flat.flatNumber, floor: flat.floor });
                        setShowAddModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteFlat(flat._id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '448px', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary-100 p-2 rounded-xl text-primary-600">
                <Building2 size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{selectedFlat ? 'Edit Flat' : 'Add New Flat'}</h2>
            </div>

            <form onSubmit={handleAddFlat} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Flat Number</label>
                <input
                  type="text"
                  required
                  value={formData.flatNumber}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. A-101"
                  onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Floor Number</label>
                <input
                  type="number"
                  required
                  value={formData.floor}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. 1"
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedFlat(null);
                    setFormData({ flatNumber: '', floor: '' });
                  }}
                  className="flex-1 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {selectedFlat ? 'Update Flat' : 'Create Flat'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showAssignModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAssignModal(false); }}
        >
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '448px', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary-100 p-2 rounded-xl text-primary-600">
                <Building2 size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Assign Resident</h2>
            </div>
            <p className="text-slate-500 mb-6 font-medium">Assign a registered resident to flat <span className="text-primary-600 font-bold">{selectedFlat?.flatNumber}</span></p>

            <form onSubmit={handleAssignResident} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Select Resident</label>
                <select
                  required
                  value={assignData.userId}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                  onChange={(e) => setAssignData({ userId: e.target.value })}
                >
                  <option value="">Choose Resident...</option>
                  {residents.map(r => (
                    <option key={r._id} value={r._id}>{r.name} ({r.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Assign Resident
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

export default FlatManagement;