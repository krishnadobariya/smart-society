import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Home, 
  CreditCard, 
  Bell, 
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus,
  QrCode,
  Share2
} from 'lucide-react';

import { useSocket } from '../../context/SocketContext';

const ResidentDashboard = () => {
  const { user } = useContext(AuthContext);
  const socket = useSocket();
  const [dues, setDues] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [showPreReg, setShowPreReg] = useState(false);
  const [preRegData, setPreRegData] = useState({ name: '', phone: '', purpose: '' });

  useEffect(() => {
    if (!socket) return;

    socket.on('complaint_updated', (data) => {
      toast.success(data.message || `Complaint status updated to ${data.status}`);
      // Refresh complaints
      api.get('/complaints/my').then(({data}) => setComplaints(data));
    });

    socket.on('maintenance_updated', (data) => {
      toast.success(data.message, { icon: '💰' });
      api.get('/maintenance/my').then(({ data }) => setDues(data));
    });

    socket.on('visitor_updated', (data) => {
      toast.success(data.message, { icon: '🚗' });
      api.get('/visitors/my').then(({ data }) => setVisitors(data));
    });

    socket.on('new_notice', (notice) => {
      toast('New announcement!', { icon: '📢' });
      setNotifications(prev => [notice, ...prev.slice(0, 9)]);
    });

    socket.on('booking_updated', (data) => {
      toast.success(data.message, { icon: '🗓️' });
    });

    return () => {
      socket.off('complaint_updated');
      socket.off('maintenance_updated');
      socket.off('visitor_updated');
      socket.off('new_notice');
      socket.off('booking_updated');
    };
  }, [socket]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch non-flat specific data
        const { data: complaintsData } = await api.get('/complaints/my');
        const { data: notifData } = await api.get('/notifications');
        setComplaints(complaintsData);
        setNotifications(notifData);

        // Fetch resident specific data
        const { data: duesData } = await api.get('/maintenance/my');
        const { data: visitorData } = await api.get('/visitors/my');
        
        setDues(duesData);
        setVisitors(visitorData);
      } catch (error) {
        console.error('Error fetching resident data', error);
      }
    };
    fetchData();
  }, [user]);

  const stats = [
    { 
      title: 'Dues Status', 
      value: dues.some(d => d.status === 'pending') ? 'Pending' : 'Clear', 
      icon: Home, 
      color: dues.some(d => d.status === 'pending') ? 'text-red-600' : 'text-green-600', 
      bg: dues.some(d => d.status === 'pending') ? 'bg-red-50' : 'bg-green-50' 
    },
    { 
      title: 'Pending Dues', 
      value: `₹${dues.filter(d => d.status === 'pending').reduce((acc, d) => acc + d.amount, 0)}`, 
      icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100' 
    },
    { 
      title: 'Open Complaints', 
      value: complaints.filter(c => c.status !== 'resolved').length, 
      icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' 
    },
  ];

  const updateVisitorStatus = async (id, status) => {
    try {
      await api.put(`/visitors/${id}`, { status });
      toast.success(`Visitor ${status}`);
      // Refresh visitors using the robust /my endpoint
      const { data } = await api.get('/visitors/my');
      setVisitors(data);
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const [generatedPass, setGeneratedPass] = useState(null);

  const handlePreApprove = async (e) => {
    e.preventDefault();
    try {
      const { data: flatData } = await api.get('/flats/my');
      const { data: visitorData } = await api.post('/visitors/pre-approve', { 
        ...preRegData, 
        flatId: flatData._id 
      });
      
      setGeneratedPass(visitorData.passCode);
      toast.success('Guest pre-approved!');
      setPreRegData({ name: '', phone: '', purpose: '' });
      
      const { data } = await api.get('/visitors/my');
      setVisitors(data);
    } catch (error) {
      toast.error('Pre-approval failed');
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user.name}.</p>
        </div>
        <button 
          onClick={() => setShowPreReg(true)}
          className="bg-primary-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-primary-700 transition-all font-bold shadow-lg shadow-primary-100"
        >
          <UserPlus size={20} />
          Pre-approve Guest
        </button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Notifications */}
        <div className="glass p-8 rounded-3xl h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Notifications</h3>
            <Bell className="text-primary-500" />
          </div>
          <div className="space-y-4">
            {notifications.length > 0 ? notifications.map((n) => (
              <div key={n._id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all border border-slate-50">
                <div className="bg-primary-100 text-primary-600 p-3 rounded-xl h-fit">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded mt-2 inline-block">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-slate-400 text-center py-6">No new notifications.</p>
            )}
          </div>
        </div>

        {/* Visitors Log */}
        <div className="glass p-8 rounded-3xl h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Visitor Requests</h3>
            <ShieldCheck className="text-green-500" />
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {visitors.length > 0 ? visitors.map((v) => (
              <div key={v._id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all border border-slate-50">
                <div className="bg-orange-100 text-orange-600 p-3 rounded-xl h-fit">
                  <Clock size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{v.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">Purpose: {v.purpose}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase ${
                      v.status === 'approved' ? 'text-green-500' : 
                      v.status === 'rejected' ? 'text-red-500' : 'text-orange-500'
                    }`}>
                      {v.isPreApproved && v.status === 'approved' ? 'Pre-Approved' : v.status}
                    </span>
                  </div>
                  {v.isPreApproved && v.passCode && v.status === 'approved' && !v.entryTime && (
                    <div className="mt-3 p-3 bg-primary-50 rounded-xl border border-primary-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-primary-600 uppercase">Share Pass Code</p>
                        <p className="text-lg font-black text-primary-700 tracking-widest">{v.passCode}</p>
                      </div>
                      <QrCode size={32} className="text-primary-400" />
                    </div>
                  )}

                  {v.status === 'waiting' && (
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => updateVisitorStatus(v._id, 'approved')}
                        className="bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded"
                      >Approve</button>
                      <button 
                        onClick={() => updateVisitorStatus(v._id, 'rejected')}
                        className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded"
                      >Reject</button>
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(v.entryTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-slate-400 text-center py-6">No visitor requests.</p>
            )}
          </div>
        </div>
      </div>

      {showPreReg && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPreReg(false); }}
        >
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '448px', padding: '2.5rem', borderRadius: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} className="animate-scale-in">
            {!generatedPass ? (
              <>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Pre-approve Guest</h2>
                <p className="text-slate-500 text-sm mb-8">Generate a pass code for your guest to skip the gate verification.</p>

                <form onSubmit={handlePreApprove} className="space-y-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700 ml-1">Guest Name</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                      placeholder="Visitor's Full Name"
                      value={preRegData.name}
                      onChange={(e) => setPreRegData({...preRegData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                      placeholder="+91..."
                      value={preRegData.phone}
                      onChange={(e) => setPreRegData({...preRegData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 ml-1">Purpose</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 transition-all"
                      placeholder="Guest, Delivery, etc."
                      value={preRegData.purpose}
                      onChange={(e) => setPreRegData({...preRegData, purpose: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowPreReg(false)}
                      className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={18} />
                      Generate Pass
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <QrCode size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Pass Generated!</h2>
                <p className="text-slate-500 text-sm mb-8">Share this code with your guest. They will need it at the gate.</p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-3xl mb-8 relative group">
                  <span className="text-4xl font-black text-primary-600 tracking-[0.5em] ml-4">
                    {generatedPass}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPass);
                      toast.success('Code copied!');
                    }}
                    className="absolute top-2 right-2 p-2 text-slate-400 hover:text-primary-600 transition-all"
                  >
                    <Share2 size={18} />
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setShowPreReg(false);
                    setGeneratedPass(null);
                  }}
                  className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all shadow-lg"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ResidentDashboard;
