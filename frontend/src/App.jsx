import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ResidentDashboard from './pages/Resident/ResidentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

import SecurityDashboard from './pages/Security/SecurityDashboard';
import FlatManagement from './pages/Admin/FlatManagement';
import MaintenanceManagement from './pages/Admin/MaintenanceManagement';
import ExpenseManagement from './pages/Admin/ExpenseManagement';
import ComplaintManagement from './pages/Admin/ComplaintManagement';
import NoticeManagement from './pages/Admin/NoticeManagement';
import IncomeManagement from './pages/Admin/IncomeManagement';
import FlatInfo from './pages/Resident/FlatInfo';
import MaintenanceDues from './pages/Resident/MaintenanceDues';
import ComplaintList from './pages/Resident/ComplaintList';
import AmenityBooking from './pages/Resident/AmenityBooking';
import AmenityManagement from './pages/Admin/AmenityManagement';



const Layout = () => {
  const { user } = useContext(AuthContext);
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {user && <Sidebar role={user.role} />}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/flats" element={<FlatManagement />} />
              <Route path="/admin/maintenance" element={<MaintenanceManagement />} />
              <Route path="/admin/expenses" element={<ExpenseManagement />} />
              <Route path="/admin/complaints" element={<ComplaintManagement />} />
              <Route path="/admin/notices" element={<NoticeManagement />} />
              <Route path="/admin/income" element={<IncomeManagement />} />
              <Route path="/admin/amenities" element={<AmenityManagement />} />

            </Route>

            {/* Resident Routes */}
            <Route element={<ProtectedRoute allowedRoles={['resident']} />}>
              <Route path="/resident" element={<ResidentDashboard />} />
              <Route path="/resident/flat" element={<FlatInfo />} />
              <Route path="/resident/maintenance" element={<MaintenanceDues />} />
              <Route path="/resident/complaints" element={<ComplaintList />} />
              <Route path="/resident/amenities" element={<AmenityBooking />} />

            </Route>

            {/* Security Routes */}
            <Route element={<ProtectedRoute allowedRoles={['security']} />}>
              <Route path="/security" element={<SecurityDashboard />} />
              <Route path="/security/logs" element={<SecurityDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
