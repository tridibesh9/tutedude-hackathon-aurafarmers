import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Import your page components
import Login from './pages/AuthPages/Login.jsx';
import Register from './pages/AuthPages/Register.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import ProductListing from './pages/ProductListing/ProductListing.jsx';
import Cart from './pages/Cart/Cart.jsx';
import OrderTracking from './pages/OrderTracking/OrderTracking.jsx';
import Profile from './pages/Profile/Profile.jsx';
import SurplusExchange from './pages/SurplusExchange/SurplusExchange.jsx';
import DigitalKhata from './pages/DigitalKhata/DigitalKhata.jsx';
import Navigation from './pages/Navigation/Navigation.jsx';

// Import your main CSS file
import './App.css';
const ProtectedRoutes = ({ userRole }) => {
  // const isAuthenticated = !!localStorage.getItem('token');

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  return (
    <div className="app-">
      <div>Merge test</div>
      <main className="app-content">
        {/* The Outlet component renders the matched child route component */}
        <Outlet />
      </main>
      <Navigation userRole={userRole} />
    </div>
  );
};

// --- Main App Component ---
function App() {
  // You can manage user role here after login
  const [userRole, setUserRole] = useState('buyer'); 

  // A function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    // Force a re-render/redirect by navigating
    window.location.href = '/login';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register />} />
        
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes userRole={userRole} />}>
          <Route path="/dashboard" element={<Dashboard userRole={userRole} />} />
          <Route path="/products" element={<ProductListing userRole={userRole} />} />
          <Route path="/cart" element={<Cart userRole={userRole} />} />
          <Route path="/tracking" element={<OrderTracking userRole={userRole} />} />
          <Route path="/surplus" element={<SurplusExchange userRole={userRole} />} />
          <Route path="/khata" element={<DigitalKhata userRole={userRole} />} />
          <Route path="/profile" element={<Profile userRole={userRole} onLogout={handleLogout} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
