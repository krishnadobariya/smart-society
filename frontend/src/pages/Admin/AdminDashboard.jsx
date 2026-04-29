import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  Users, 
  Building2, 
  IndianRupee, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  XCircle,
  Wallet,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const socket = useSocket();
  const [stats, setStats] = useState({
    totalResidents: 0,
    totalFlats: 0,
    totalIncome: 0,
    totalExpenses: 0,
    pendingComplaints: 0
  });
  const [financialChart, setFinancialChart] = useState([]);
  const [visitorChart, setVisitorChart] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState([]);
  const [manualIncomeBreakdown, setManualIncomeBreakdown] = useState([]);
  
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchStats = async () => {
    try {
      const { startDate, endDate } = dateRange;
      const query = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : '';
      
      const { data: summary } = await api.get(`/expenses/summary${query}`);
      const { data: flats } = await api.get('/flats');
      const { data: complaints } = await api.get('/complaints');
      const { data: visitorData } = await api.get('/visitors/summary');
      
      setStats({
        totalFlats: flats.length,
        totalResidents: flats.reduce((acc, f) => acc + (f.owner ? 1 : 0), 0),
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpense,
        pendingComplaints: complaints.filter(c => c.status === 'open').length
      });

      setFinancialChart(summary.chartData || []);
      setVisitorChart(visitorData || []);
      setExpenseBreakdown(summary.expenseBreakdown || []);
      setIncomeBreakdown(summary.maintenanceBreakdown || []);
      setManualIncomeBreakdown(summary.manualIncomeBreakdown || []);
    } catch (error) {
      console.error('Error fetching admin stats', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { startDate, endDate } = dateRange;
      const query = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : '';
      
      const [maintRes, incomeRes, expRes] = await Promise.all([
        api.get(`/maintenance${query}${query ? '&' : '?'}status=paid`),
        api.get(`/income${query}`),
        api.get(`/expenses${query}`)
      ]);

      const doc = new jsPDF();
      const primaryColor = [14, 165, 233]; // #0ea5e9

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Smart Society Management System', 15, 25);
      doc.setFontSize(12);
      doc.text('Financial Audit Report', 15, 33);

      // Report Info
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      const dateText = startDate && endDate 
        ? `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
        : `Report Date: ${new Date().toLocaleDateString()} (Monthly Summary)`;
      doc.text(dateText, 15, 50);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 150, 50);

      // Summary Stats
      autoTable(doc, {
        startY: 55,
        head: [['Metric', 'Value']],
        body: [
          ['Total Income', `INR ${stats.totalIncome}`],
          ['Total Expenses', `INR ${stats.totalExpenses}`],
          ['Net Balance', `INR ${stats.totalIncome - stats.totalExpenses}`]
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor }
      });

      // Section: Maintenance Income
      doc.setFontSize(14);
      doc.text('1. Maintenance Collection', 15, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Resident/Flat', 'Month', 'Amount', 'Date']],
        body: maintRes.data.map(m => [
          `${m.flatId?.owner?.name || 'N/A'} (Flat ${m.flatId?.flatNumber || 'N/A'})`,
          formatMonth(m.month),
          `INR ${m.amount}`,
          new Date(m.paymentDate || m.createdAt).toLocaleDateString()
        ]),
        headStyles: { fillColor: [16, 185, 129] } // Green
      });

      // Section: Other Income
      if (incomeRes.data.length > 0) {
        doc.text('2. Miscellaneous Income', 15, doc.lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Source', 'Category', 'Amount', 'Date']],
          body: incomeRes.data.map(inc => [
            inc.title,
            inc.category,
            `INR ${inc.amount}`,
            new Date(inc.date).toLocaleDateString()
          ]),
          headStyles: { fillColor: [16, 185, 129] }
        });
      }

      // Section: Expenses
      doc.text('3. Expenditure Details', 15, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Expense Title', 'Category', 'Amount', 'Date']],
        body: expRes.data.map(exp => [
          exp.title,
          exp.category,
          `INR ${exp.amount}`,
          new Date(exp.createdAt).toLocaleDateString()
        ]),
        headStyles: { fillColor: [239, 68, 68] } // Red
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${pageCount}`, 180, 285);
        doc.text('This is a computer-generated report and does not require a physical signature.', 15, 285);
      }

      doc.save(`Society_Report_${startDate || 'monthly'}.pdf`);
      toast.success('Professional PDF generated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleDownloadVisitors = async () => {
    try {
      const { startDate, endDate } = dateRange;
      const query = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : '';
      const response = await api.get(`/visitors${query}`); // Use base visitors endpoint which returns JSON
      const visitors = response.data;

      const doc = new jsPDF();
      const primaryColor = [16, 185, 129]; // Green for safety/security

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Smart Society Management System', 15, 25);
      doc.setFontSize(12);
      doc.text('Visitor Entry Audit Log', 15, 33);

      // Report Info
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      const dateText = startDate && endDate 
        ? `Log Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
        : `Log Date: ${new Date().toLocaleDateString()}`;
      doc.text(dateText, 15, 50);
      doc.text(`Total Entries: ${visitors.length}`, 150, 50);

      autoTable(doc, {
        startY: 55,
        head: [['Visitor Name', 'Phone', 'Flat No', 'Purpose', 'Status', 'In Time', 'Out Time']],
        body: visitors.map(v => [
          v.name,
          v.phone,
          v.flatId?.flatNumber || 'N/A',
          v.purpose,
          v.status.toUpperCase(),
          v.entryTime ? new Date(v.entryTime).toLocaleString() : 'N/A',
          v.exitTime ? new Date(v.exitTime).toLocaleString() : 'N/A'
        ]),
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 8 }
      });

      doc.save(`Visitor_Log_${startDate || 'all'}.pdf`);
      toast.success('Visitor Log PDF generated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to download visitor log');
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  useEffect(() => {
    if (socket) {
      socket.on('maintenance_updated', () => fetchStats());
      socket.on('complaint_updated', () => fetchStats());
      socket.on('visitor_updated', () => fetchStats());
      return () => {
        socket.off('maintenance_updated');
        socket.off('complaint_updated');
        socket.off('visitor_updated');
      };
    }
  }, [socket]);

  const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

  const cards = [
    { title: 'Total Residents', value: stats.totalResidents, icon: Users, color: 'bg-blue-500', trend: '+12%' },
    { title: 'Occupied Flats', value: stats.totalFlats, icon: Building2, color: 'bg-purple-500', trend: '+5%' },
    { title: 'Total Income', value: `₹${stats.totalIncome}`, icon: IndianRupee, color: 'bg-green-500', trend: '+18%' },
    { title: 'Total Expense', value: `₹${stats.totalExpenses}`, icon: Wallet, color: 'bg-red-500', trend: '+8%' },
    { title: 'Open Complaints', value: stats.pendingComplaints, icon: AlertCircle, color: 'bg-orange-500', trend: '-2' },
  ];

  const formatMonth = (monthStr) => {
    if (!monthStr) return 'N/A';
    if (!monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin Overview</h1>
          <p className="text-slate-500">
            {dateRange.startDate && dateRange.endDate 
              ? `Report from ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}`
              : `Monthly Report (${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})`
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg shadow-primary-200"
          >
            <Download size={18} />
            Financial Report (PDF)
          </button>
          <button 
            onClick={handleDownloadVisitors}
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all font-semibold shadow-sm"
          >
            <Download size={18} className="text-green-500" />
            Visitor Log (PDF)
          </button>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 px-3">
            <Calendar size={18} className="text-slate-400" />
            <input 
              type="date" 
              className="border-none outline-none text-sm font-semibold text-slate-600 bg-transparent"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2 px-3">
            <input 
              type="date" 
              className="border-none outline-none text-sm font-semibold text-slate-600 bg-transparent"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          {(dateRange.startDate || dateRange.endDate) && (
            <button 
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-red-500"
              title="Clear Filter"
            >
              <XCircle size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="glass p-6 rounded-3xl group hover:scale-[1.02] transition-transform duration-300 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className={`${card.color} p-3 rounded-2xl text-white shadow-lg`}>
                <card.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${card.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {card.trend}
                {card.trend.startsWith('+') ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{card.title}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Financial Trends</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="income" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Expense Breakdown</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown.map(e => ({ name: e._id, value: e.total }))}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-4 w-full">
              {expenseBreakdown.length > 0 ? expenseBreakdown.map((e, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm font-semibold text-slate-700">
                    <span>{e._id}</span>
                    <span>₹{e.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(e.total / stats.totalExpenses) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                  </div>
                </div>
              )) : <p className="text-slate-400 italic text-center">No expenses in this period.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-8">Other Income Breakdown</h3>
            <div className="space-y-4">
              {manualIncomeBreakdown.length > 0 ? manualIncomeBreakdown.map((inc, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm font-semibold text-slate-700">
                    <span>{inc._id}</span>
                    <span>₹{inc.total}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(inc.total / stats.totalIncome) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                  </div>
                </div>
              )) : <p className="text-slate-400 italic text-center">No other income in this period.</p>}
            </div>
          </div>

          <div className="glass p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-8">Maintenance Collection</h3>
            <div className="space-y-4">
              {incomeBreakdown.length > 0 ? incomeBreakdown.map((inc, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 text-green-600 p-3 rounded-xl"><IndianRupee size={20} /></div>
                    <div>
                      <p className="font-bold text-slate-800">{formatMonth(inc._id)}</p>
                      <p className="text-xs text-slate-500">Resident Maintenance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">₹{inc.total}</p>
                    <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded font-bold uppercase">Paid</span>
                  </div>
                </div>
              )) : <p className="text-slate-400 italic text-center py-10">No maintenance data.</p>}
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-8">Visitor Traffic</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{r: 6, fill: '#0ea5e9'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
