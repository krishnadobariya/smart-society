import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Bell } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-primary-600 p-2 rounded-lg">
          <span className="text-white font-bold text-xl">S</span>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
          SmartSociety
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-slate-500 hover:text-primary-600 transition-colors">
          <Bell size={20} />
        </button>
        
        {user && (
          <div className="flex items-center gap-4 border-l pl-6 border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
