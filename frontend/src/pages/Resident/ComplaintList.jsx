import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { Plus, MessageSquare, Loader2, Clock, CheckCircle } from 'lucide-react';

const ComplaintList = () => {
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium' });

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('complaint_updated', (data) => {
        toast.success(data.message || 'Complaint updated', { icon: '📝' });
        fetchComplaints();
      });

      return () => {
        socket.off('complaint_updated');
      };
    }
  }, [socket]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/complaints/my');
      setComplaints(data);
    } catch (error) {
      toast.error('Failed to fetch complaints');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/complaints', formData);
      toast.success('Complaint submitted successfully');
      setShowModal(false);
      fetchComplaints();
    } catch (error) {
      toast.error('Failed to submit complaint');
    }
  };



  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">My Complaints</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary-700 transition-all font-semibold shadow-lg"
        >
          <Plus size={18} />
          New Complaint
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary-500" size={40} />
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass p-12 text-center text-slate-400 rounded-3xl">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p>All clear! No complaints found.</p>
          </div>
        ) : complaints.map((c) => (
          <div key={c._id} className="glass p-6 rounded-3xl flex justify-between items-start hover:scale-[1.01] transition-transform duration-300">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  c.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {c.priority}
                </span>
                <h3 className="font-bold text-slate-800">{c.title}</h3>
              </div>
              <p className="text-slate-500 text-sm">{c.description}</p>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(c.createdAt).toLocaleDateString()}</span>
                <span className="uppercase flex items-center gap-1">
                  Status: <span className={c.status === 'resolved' ? 'text-green-500' : 'text-orange-500'}>{c.status}</span>
                </span>
              </div>
            </div>
            <div className={`p-2 rounded-full ${c.status === 'resolved' ? 'text-green-500 bg-green-50' : 'text-orange-500 bg-orange-50'}`}>
              {c.status === 'resolved' ? <CheckCircle size={24} /> : <Clock size={24} />}
            </div>
          </div>
        ))}
      </div>

      {showModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '448px', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Raise a Complaint</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Title</label>
                <input
                  type="text" required
                  value={formData.title}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                  placeholder="e.g. Water Seepage"
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Priority</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 resize-none transition-all"
                  rows="4"
                  placeholder="Enter details here..."
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
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
                  className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-all"
                >
                  Submit
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

export default ComplaintList;