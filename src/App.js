// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ZionWifiBank from './pages/ZionWifiBank';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import UserManagement from './pages/UserManagement';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ZionWifiBank />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Protected route */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
  path="/admin/users"
  element={
    <PrivateRoute>
      <UserManagement />
    </PrivateRoute>
  }
/>

      </Routes>
    </Router>
  );
}

export default App;
