import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { CreditCard, CheckCircle2, Clock, IndianRupee, Loader2, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MaintenanceDues = () => {
  const { user } = useContext(AuthContext);
  const socket = useSocket();
  const [dues, setDues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDues();
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('maintenance_updated', (data) => {
        toast.success(data.message, { icon: '💰' });
        fetchDues();
      });

      return () => {
        socket.off('maintenance_updated');
      };
    }
  }, [socket]);

  const fetchDues = async () => {
    try {
      const { data } = await api.get('/maintenance/my');
      setDues(data);
    } catch (error) {
      toast.error('Failed to fetch maintenance records');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async (id) => {
    try {
      await api.patch(`/maintenance/pay/${id}`);
      toast.success('Payment successful (Mock)');
      fetchDues();
    } catch (error) {
      toast.error('Payment failed');
    }
  };

  const downloadReceipt = (due) => {
    const doc = new jsPDF();
    const primaryColor = [14, 165, 233];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Smart Society Management', 15, 25);
    doc.setFontSize(12);
    doc.text('Maintenance Payment Receipt', 15, 33);

    // Content
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text(`Receipt No: REC-${due._id.substring(18).toUpperCase()}`, 15, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 50);

    autoTable(doc, {
      startY: 60,
      head: [['Description', 'Details']],
      body: [
        ['Resident Name', user.name],
        ['Flat Number', due.flatId?.flatNumber || 'N/A'],
        ['Billing Month', formatMonth(due.month)],
        ['Amount Paid', `INR ${due.amount}`],
        ['Payment Status', 'SUCCESSFUL'],
        ['Payment Date', new Date(due.paymentDate || due.updatedAt).toLocaleDateString()]
      ],
      theme: 'striped',
      headStyles: { fillColor: primaryColor }
    });

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated receipt.', 15, doc.lastAutoTable.finalY + 20);

    doc.save(`Receipt_${due.month}.pdf`);
    toast.success('Receipt downloaded!');
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
      <h1 className="text-2xl font-bold text-slate-800">Maintenance Payments</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl">
          <p className="text-slate-500 text-sm font-medium">Pending Dues</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            ₹{dues.filter(d => d.status === 'pending').reduce((acc, d) => acc + d.amount, 0)}
          </p>
        </div>
        <div className="glass p-6 rounded-3xl">
          <p className="text-slate-500 text-sm font-medium">Total Paid</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            ₹{dues.filter(d => d.status === 'paid').reduce((acc, d) => acc + d.amount, 0)}
          </p>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-3xl border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Month</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-10">
                  <Loader2 className="animate-spin mx-auto text-primary-500" size={32} />
                </td>
              </tr>
            ) : dues.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-slate-400">No maintenance records found.</td>
              </tr>
            ) : dues.map((due) => (
              <tr key={due._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{formatMonth(due.month)}</td>
                <td className="px-6 py-4 text-slate-800 font-bold">₹{due.amount}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(due.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    due.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {due.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {due.status === 'pending' ? (
                    <button 
                      onClick={() => handlePay(due._id)}
                      className="bg-primary-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-700 transition-all shadow-sm"
                    >
                      Pay Now
                    </button>
                  ) : (
                    <button 
                      onClick={() => downloadReceipt(due)}
                      className="flex items-center gap-2 text-primary-600 font-bold text-xs hover:bg-primary-50 px-3 py-2 rounded-lg transition-all"
                    >
                      <Download size={16} />
                      Receipt
                    </button>
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

export default MaintenanceDues;
