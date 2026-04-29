import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { MessageSquare, CheckCircle, Clock, Loader2 } from 'lucide-react';

const ComplaintManagement = () => {
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('complaint_updated', (data) => {
        toast(data.message || 'Complaint updated', { icon: '📝' });
        fetchComplaints();
      });

      return () => {
        socket.off('complaint_updated');
      };
    }
  }, [socket]);

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/complaints');
      setComplaints(data);
    } catch (error) {
      toast.error('Failed to fetch complaints');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}`, { status });
      toast.success(`Complaint marked as ${status}`);
      fetchComplaints();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Complaints Management</h1>
        <p className="text-slate-500">Resolve resident issues and tracking</p>
      </div>

      <div className="glass overflow-hidden rounded-3xl border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Resident</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
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
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-slate-400">No complaints reported.</td>
              </tr>
            ) : complaints.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-bold text-slate-800">{c.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-600">{c.userId?.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    c.priority === 'high' ? 'bg-red-100 text-red-600' : 
                    c.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 
                    'bg-green-100 text-green-600'
                  }`}>
                    {c.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    c.status === 'resolved' ? 'bg-green-100 text-green-600' : 
                    c.status === 'in-progress' ? 'bg-blue-100 text-blue-600' : 
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right border-slate-50">
                  {c.status !== 'resolved' && (
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => updateStatus(c._id, 'in-progress')}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="In Progress"
                      >
                        <Clock size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(c._id, 'resolved')}
                        className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark Resolved"
                      >
                        <CheckCircle size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplaintManagement;
