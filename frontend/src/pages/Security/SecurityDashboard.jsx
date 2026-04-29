import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../context/SocketContext';
import { 
  UserPlus, 
  History, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  QrCode,
  Key
} from 'lucide-react';

const SecurityDashboard = () => {
  const socket = useSocket();
  const [visitors, setVisitors] = useState([]);
  const [flats, setFlats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    flatId: '',
    purpose: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passCode, setPassCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);


  useEffect(() => {
    fetchLogs();
    fetchFlats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('visitor_updated', (data) => {
        if (data.message) toast.success(data.message, { icon: '🚗' });
        fetchLogs();
      });

      return () => {
        socket.off('visitor_updated');
      };
    }
  }, [socket]);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/visitors');
      setVisitors(data);
    } catch (error) {
      console.error('Error fetching logs', error);
    }
  };

  const fetchFlats = async () => {
    try {
      const { data } = await api.get('/flats');
      setFlats(data);
    } catch (error) {
      console.error('Error fetching flats', error);
    }
  };

  const handleAddVisitor = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/visitors', formData);
      toast.success('Visitor entry registered!');
      setFormData({ name: '', phone: '', flatId: '', purpose: '' });
      fetchLogs();
    } catch (error) {
      toast.error('Failed to add visitor');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/visitors/${id}`, { status });
      toast.success(`Status updated to ${status}`);
      fetchLogs();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleVerifyPassCode = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      await api.post('/visitors/verify-passcode', { passCode });
      toast.success('Pass code verified! Visitor checked in.');
      setPassCode('');
      fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid pass code');
    } finally {
      setIsVerifying(false);
    }
  };


  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone.includes(searchTerm) ||
    v.flatId?.flatNumber?.includes(searchTerm)
  );

  const stats = [
    { label: 'Inside', count: visitors.filter(v => v.status === 'approved').length, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Waiting', count: visitors.filter(v => v.status === 'waiting').length, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Today', count: visitors.filter(v => new Date(v.entryTime).toDateString() === new Date().toDateString()).length, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="glass p-6 rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            </div>
            <div className={`${s.bg} ${s.color} p-3 rounded-2xl`}>
              {s.label === 'Inside' ? <CheckCircle size={24} /> : s.label === 'Waiting' ? <Clock size={24} /> : <History size={24} />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entry Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pass Code Verification */}
          <div className="glass p-8 rounded-3xl border-2 border-primary-100 bg-primary-50/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-600 p-2 rounded-lg text-white">
                <QrCode size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Verify Pass Code</h2>
            </div>
            <form onSubmit={handleVerifyPassCode} className="space-y-4">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Enter 6-digit code"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none uppercase font-black tracking-[0.2em]"
                  value={passCode}
                  onChange={(e) => setPassCode(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                disabled={isVerifying || !passCode}
                className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isVerifying ? <Loader2 className="animate-spin" size={18} /> : 'Verify & Check In'}
              </button>
            </form>
          </div>

          <div className="glass p-8 rounded-3xl sticky top-24">

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-100 p-2 rounded-lg text-primary-600">
                <UserPlus size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">New Visitor</h2>
            </div>

            <form onSubmit={handleAddVisitor} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Visitor Name</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1"
                  placeholder="+91..."
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Select Flat</label>
                <select 
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1"
                  value={formData.flatId}
                  onChange={(e) => setFormData({...formData, flatId: e.target.value})}
                >
                  <option value="">Choose Flat...</option>
                  {flats.map(f => (
                    <option key={f._id} value={f._id}>{f.flatNumber} - {f.floor} Floor</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Purpose</label>
                <textarea 
                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 resize-none"
                  placeholder="Delivery, Guest, etc."
                  rows="3"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>Check In <CheckCircle size={20} /></>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Logs Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 rounded-3xl min-h-[600px]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                  <History size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Entry Logs</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-100 transition-all w-64"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                    <th className="pb-4">Visitor</th>
                    <th className="pb-4 text-center">Flat No</th>
                    <th className="pb-4">Time Entry/Exit</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredVisitors.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4">
                        <div>
                          <p className="font-bold text-slate-800">{v.name}</p>
                          <p className="text-[10px] text-slate-500">{v.phone} • {v.purpose}</p>
                        </div>
                      </td>
                      <td className="py-4 text-center font-bold text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded-md">{v.flatId?.flatNumber}</span>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                            <Clock size={12} className="text-green-500" />
                            In: {new Date(v.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          {v.exitTime && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                              <Clock size={12} className="text-red-400" />
                              Out: {new Date(v.exitTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          v.status === 'approved' ? 'bg-green-100 text-green-600' :
                          v.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          v.status === 'waiting' ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {v.status === 'waiting' && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => updateStatus(v._id, 'approved')}
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                              title="Override Approve"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button 
                              onClick={() => updateStatus(v._id, 'rejected')}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        )}
                        {v.status === 'approved' && (
                          <button 
                            onClick={() => updateStatus(v._id, 'left')}
                            className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-black transition-all shadow-md"
                          >
                            Mark Left
                          </button>
                        )}
                        {v.status === 'left' && (
                          <span className="text-[10px] text-slate-300 italic">Check out complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredVisitors.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-slate-400 italic">No visitors found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
