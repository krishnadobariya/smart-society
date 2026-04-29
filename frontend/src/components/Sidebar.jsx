import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Users, 
  ShieldAlert, 
  MessageSquare, 
  Settings,
  HelpCircle,
  Megaphone,
  Wallet,
  TrendingUp
} from 'lucide-react';

const Sidebar = ({ role }) => {
  const location = useLocation();

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Notice Board', path: '/admin/notices', icon: Megaphone },
    { name: 'Residents/Flats', path: '/admin/flats', icon: Building2 },
    { name: 'Maintenance', path: '/admin/maintenance', icon: CreditCard },
    { name: 'Expenses', path: '/admin/expenses', icon: Wallet },
    { name: 'Other Income', path: '/admin/income', icon: TrendingUp },
    { name: 'Complaints', path: '/admin/complaints', icon: HelpCircle },
    { name: 'Amenities', path: '/admin/amenities', icon: Building2 },
  ];

  const residentLinks = [
    { name: 'Dashboard', path: '/resident', icon: LayoutDashboard },
    { name: 'My Flat', path: '/resident/flat', icon: Building2 },
    { name: 'My Dues', path: '/resident/maintenance', icon: CreditCard },
    { name: 'Amenity Booking', path: '/resident/amenities', icon: Building2 },
    { name: 'Complaints', path: '/resident/complaints', icon: HelpCircle },
  ];

  const securityLinks = [
    { name: 'Visitor Entry', path: '/security', icon: ShieldAlert },
    { name: 'Logs', path: '/security/logs', icon: Users },
  ];

  const links = role === 'admin' ? adminLinks : role === 'security' ? securityLinks : residentLinks;

  return (
    <aside className="w-64 glass h-[calc(100vh-64px)] p-4 flex flex-col gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                : 'text-slate-600 hover:bg-primary-50 hover:text-primary-600'
            }`}
          >
            <Icon size={20} />
            <span className="font-medium">{link.name}</span>
          </Link>
        );
      })}
    </aside>
  );
};

export default Sidebar;
