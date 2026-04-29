import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { Megaphone, Plus, Trash2, Calendar, Target, Loader2 } from 'lucide-react';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRole: 'all'
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      // For Admin we might want to see ALL notices, but for now we reuse the same get
      const { data } = await api.get('/notifications');
      setNotices(data);
    } catch (error) {
      toast.error('Failed to fetch notices');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/notifications', formData);
      toast.success('Notice published!');
      setFormData({ title: '', message: '', targetRole: 'all' });
      fetchNotices();
    } catch (error) {
      toast.error('Failed to publish notice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Notice removed');
      fetchNotices();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Notice Board</h1>
          <p className="text-slate-500">Manage community-wide announcements and alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="glass p-8 rounded-3xl sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-100 p-2 rounded-lg text-primary-600">
                <Plus size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">New Announcement</h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Title</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1"
                  placeholder="e.g. Water Tank Maintenance"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Target Audience</label>
                <select 
                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                >
                  <option value="all">Everyone</option>
                  <option value="resident">Residents Only</option>
                  <option value="security">Security Only</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Message</label>
                <textarea 
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none mt-1 resize-none"
                  placeholder="Details of the announcement..."
                  rows="5"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Publish Notice'}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-6">
            {notices.map((notice) => (
              <div key={notice._id} className="glass p-6 rounded-3xl border border-slate-50 group hover:border-primary-100 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="bg-primary-100 text-primary-600 p-3 rounded-2xl h-fit">
                      <Megaphone size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{notice.title}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Calendar size={14} />
                          {new Date(notice.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase font-bold tracking-wider">
                          <Target size={14} />
                          {notice.targetRole}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(notice._id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="mt-4 text-slate-600 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                  {notice.message}
                </div>
              </div>
            ))}

            {notices.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <Megaphone size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No notices published yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeBoard;
