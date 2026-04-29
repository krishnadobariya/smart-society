import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Plus, TrendingUp, Loader2, Edit, Trash2 } from 'lucide-react';

const IncomeManagement = () => {
  const [income, setIncome] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [formData, setFormData] = useState({ title: '', amount: '', category: 'Other', description: '', date: '' });

  const categories = ['Event Sponsorship', 'Rent from Club House', 'Donation', 'Fixed Deposit Interest', 'Other'];

  useEffect(() => {
    fetchIncome();
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const fetchIncome = async () => {
    try {
      const { data } = await api.get('/income');
      setIncome(data);
    } catch (error) {
      toast.error('Failed to fetch income');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveIncome = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = { ...formData };
      if (!dataToSave.date) dataToSave.date = new Date().toISOString();

      if (selectedIncome) {
        await api.put(`/income/${selectedIncome._id}`, dataToSave);
        toast.success('Income updated successfully');
      } else {
        await api.post('/income', dataToSave);
        toast.success('Income added successfully');
      }
      setShowModal(false);
      setSelectedIncome(null);
      setFormData({ title: '', amount: '', category: 'Other', description: '', date: '' });
      fetchIncome();
    } catch (error) {
      toast.error('Failed to save income');
    }
  };

  const handleDeleteIncome = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await api.delete(`/income/${id}`);
      toast.success('Income entry deleted');
      fetchIncome();
    } catch (error) {
      toast.error('Failed to delete income');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Income Management</h1>
          <p className="text-slate-500">Track miscellaneous income and donations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-700 transition-all font-semibold shadow-lg"
        >
          <Plus size={18} />
          Add Income
        </button>
      </div>

      <div className="glass overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-10">
                  <Loader2 className="animate-spin mx-auto text-primary-500" size={32} />
                </td>
              </tr>
            ) : income.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-slate-400 italic">No miscellaneous income recorded.</td>
              </tr>
            ) : income.map((inc) => (
              <tr key={inc._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{inc.title}</td>
                <td className="px-6 py-4">
                  <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-xs font-bold uppercase">{inc.category}</span>
                </td>
                <td className="px-6 py-4 text-green-600 font-bold">+ ₹{inc.amount}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(inc.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setSelectedIncome(inc);
                        setFormData({ 
                          title: inc.title, 
                          amount: inc.amount, 
                          category: inc.category, 
                          description: inc.description || '',
                          date: inc.date.split('T')[0]
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteIncome(inc._id)}
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

      {showModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '512px', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-green-100 p-2 rounded-xl text-green-600">
                <TrendingUp size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Add Income Entry</h2>
            </div>

            <form onSubmit={handleSaveIncome} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Title</label>
                <input
                  type="text" required
                  value={formData.title}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. Clubhouse Booking Fee"
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Category</label>
                  <select
                    required
                    value={formData.category}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Amount (₹)</label>
                  <input
                    type="number" required
                    value={formData.amount}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    placeholder="1000"
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Description</label>
                <textarea
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
                  rows="3"
                  value={formData.description}
                  placeholder="Additional details..."
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedIncome(null);
                    setFormData({ title: '', amount: '', category: 'Other', description: '', date: '' });
                  }}
                  className="flex-1 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {selectedIncome ? 'Update Entry' : 'Save Income'}
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

export default IncomeManagement;
