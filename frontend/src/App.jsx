import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { authAPI } from "./utils/api.js";

// Import your page components
import Login from "./pages/AuthPages/Login.jsx";
import Register from "./pages/AuthPages/Register.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import ProductListing from "./pages/ProductListing/ProductListing.jsx";
import ProductForm from "./pages/ProductListing/ProductForm.jsx";
import Cart from "./pages/Cart/Cart.jsx";
import OrderTracking from "./pages/OrderTracking/OrderTracking.jsx";
import Profile from "./pages/Profile/Profile.jsx";
import SurplusExchange from "./pages/SurplusExchange/SurplusExchange.jsx";
import DigitalKhata from "./pages/DigitalKhata/DigitalKhata.jsx";
import Navigation from "./pages/Navigation/Navigation.jsx";
import BargainDashboard from "./components/Bargain/BargainDashboard.jsx";

// Import your main CSS files
import "./styles/variables.css";
import "./styles/common.css";
import "./App.css";
import Deliveries from "./pages/SellerPages/Deliveries/Deliveries.jsx";
import Inventory from "./pages/SellerPages/Inventory/Inventory.jsx";
import UpdateInventory from "./pages/SellerPages/UpdateInventory/UpdateInventory.jsx";
import OrdersPlaced from "./pages/SellerPages/OrdersPlaced/OrdersPlaced.jsx";
import IncomeTransactions from "./pages/SellerPages/IncomeTransactions/IncomeTransactions.jsx";
import SellerProfile from "./pages/SellerPages/SellerProfile/SellerProfile.jsx";

const ProtectedRoutes = ({ userRole, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
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
  const [userRole, setUserRole] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUserType = localStorage.getItem("userType");

      if (token) {
        try {
          // Verify token is still valid
          await authAPI.verifyToken();
          setIsAuthenticated(true);
          setUserRole(storedUserType || "buyer");
        } catch (error) {
          // Token invalid, remove it
          localStorage.removeItem("token");
          localStorage.removeItem("userType");
          setIsAuthenticated(false);
          setUserRole("");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // A function to handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    setIsAuthenticated(false);
    setUserRole("");
    // Force a re-render/redirect by navigating
    window.location.href = "/login";
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <Login
              setUserRole={setUserRole}
              setIsAuthenticated={setIsAuthenticated}
            />
          }
        />
        <Route path="/register" element={<Register />} />

        {/* Redirect root to dashboard if authenticated, otherwise to login */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoutes
              userRole={userRole}
              isAuthenticated={isAuthenticated}
            />
          }
        >
          {userRole === "buyer" && (
            <>
              <Route
                path="/dashboard"
                element={<Dashboard userRole={userRole} />}
              />
              <Route
                path="/products"
                element={<ProductListing userRole={userRole} />}
              />
              <Route path="/cart" element={<Cart userRole={userRole} />} />
              <Route
                path="/tracking"
                element={<OrderTracking userRole={userRole} />}
              />
              <Route
                path="/surplus"
                element={<SurplusExchange userRole={userRole} />}
              />
              <Route
                path="/khata"
                element={<DigitalKhata userRole={userRole} />}
              />
              <Route
                path="/profile"
                element={
                  <Profile userRole={userRole} onLogout={handleLogout} />
                }
              />
            </>
          )}

          {/* Seller Routes */}
          {userRole === "seller" && (
            <>
              <Route
                path="/dashboard"
                element={<Dashboard userRole={userRole} />}
              />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/update-inventory" element={<UpdateInventory />} />
              <Route path="/orders" element={<OrdersPlaced />} />
              <Route path="/deliveries" element={<Deliveries />} />
              <Route path="/transactions" element={<IncomeTransactions />} />
              <Route
                path="/profile"
                element={<SellerProfile onLogout={handleLogout} />}
              />
            </>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
