import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { CreditCard, Plus, Loader2, Trash2, CheckCircle, Edit } from 'lucide-react';

const MaintenanceManagement = () => {
  const socket = useSocket();
  const [bills, setBills] = useState([]);
  const [flats, setFlats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [formData, setFormData] = useState({ flatId: '', amount: '', month: '', dueDate: '' });

  useEffect(() => {
    fetchBills();
    fetchFlats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('maintenance_updated', (data) => {
        // Show toast and refresh if the action was from elsewhere
        // (though admin usually initiates most actions here)
        fetchBills();
      });

      return () => {
        socket.off('maintenance_updated');
      };
    }
  }, [socket]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const fetchBills = async () => {
    try {
      const { data } = await api.get('/maintenance');
      setBills(data);
    } catch (error) {
      toast.error('Failed to fetch bills');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFlats = async () => {
    try {
      const { data } = await api.get('/flats');
      setFlats(data);
    } catch (error) {}
  };

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    try {
      if (selectedBill) {
        await api.put(`/maintenance/${selectedBill._id}`, formData);
        toast.success('Bill updated successfully');
      } else {
        await api.post('/maintenance', formData);
        toast.success('Bill generated successfully');
      }
      setShowModal(false);
      setSelectedBill(null);
      setFormData({ flatId: '', amount: '', month: '', dueDate: '' });
      fetchBills();
    } catch (error) {
      toast.error('Failed to save bill');
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await api.patch(`/maintenance/pay/${id}`);
      toast.success('Bill marked as paid');
      fetchBills();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      toast.success('Bill deleted successfully');
      fetchBills();
    } catch (error) {
      toast.error('Failed to delete bill');
    }
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return 'N/A';
    if (!monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Maintenance Management</h1>
          <p className="text-slate-500">Generate and track monthly bills</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-700 transition-all font-semibold"
        >
          <Plus size={18} />
          Generate Bill
        </button>
      </div>

      <div className="glass overflow-hidden rounded-3xl border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Flat</th>
              <th className="px-6 py-4">Month</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-10">
                  <Loader2 className="animate-spin mx-auto text-primary-500" size={32} />
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-400">No bills found.</td>
              </tr>
            ) : bills.map((bill) => (
              <tr key={bill._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{bill.flatId?.flatNumber}</td>
                <td className="px-6 py-4 text-slate-600 font-medium">{formatMonth(bill.month)}</td>
                <td className="px-6 py-4 text-slate-800 font-bold">₹{bill.amount}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(bill.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    bill.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {bill.status === 'pending' && (
                      <button 
                        onClick={() => handleMarkAsPaid(bill._id)}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Mark as Paid"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedBill(bill);
                        setFormData({ 
                          flatId: bill.flatId?._id, 
                          amount: bill.amount, 
                          month: bill.month, 
                          dueDate: bill.dueDate.split('T')[0] 
                        });
                        setShowModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteBill(bill._id)}
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
              <div className="bg-primary-100 p-2 rounded-xl text-primary-600">
                <CreditCard size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Generate New Bill</h2>
            </div>

            <form onSubmit={handleGenerateBill} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Select Flat</label>
                <select
                  required
                  value={formData.flatId}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
                >
                  <option value="">Choose Flat...</option>
                  {flats.map(f => (
                    <option key={f._id} value={f._id}>{f.flatNumber}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Amount (₹)</label>
                  <input
                    type="number" required
                    value={formData.amount}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    placeholder="2000"
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Month</label>
                  <input
                    type="month" required
                    value={formData.month}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Due Date</label>
                <input
                  type="date" required
                  value={formData.dueDate}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedBill(null);
                    setFormData({ flatId: '', amount: '', month: '', dueDate: '' });
                  }}
                  className="flex-1 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {selectedBill ? 'Update Bill' : 'Generate'}
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

export default MaintenanceManagement;