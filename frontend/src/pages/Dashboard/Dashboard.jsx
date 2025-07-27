import React, { useEffect, useState } from "react";
import { TrendingUp, Zap } from "lucide-react";
import Header from "../../components/Header/Header";
import "./Dashboard.css";
import { apiHelpers, productAPI } from "../../utils/api";

// Assuming UserRole is defined in a parent component like:
// export type UserRole = 'buyer' | 'seller';
const Dashboard = ({ userRole, onCategorySelect }) => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  const loadProducts = async (pageNum = 0, isRefresh = false) => {
    try {
      const params = {
        limit: 4,
        // category: filters.category,
        // min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        // max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        // seller_only: filters.sellerOnly,
      };

      const response = await productAPI.getAllProducts(params);

      if (isRefresh || pageNum === 0) {
        setProducts(response);
      } else {
        setProducts((prev) => [...prev, ...response]);
      }

      setHasMore(response.length === 10);
      setError("");
    } catch (error) {
      setError(apiHelpers.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount and when filters change
  useEffect(() => {
    setLoading(true);
    loadProducts(0, true);
  }, []);

  const categories = [
    {
      id: "vegetables",
      name: "Vegetables",
      icon: "🥬",
      style: "category-green",
    },
    { id: "spices", name: "Spices", icon: "🌶️", style: "category-red" },
    { id: "oils", name: "Oils", icon: "🛢️", style: "category-yellow" },
    { id: "dairy", name: "Dairy", icon: "🥛", style: "category-blue" },
    { id: "grains", name: "Grains", icon: "🌾", style: "category-amber" },
    { id: "packaged", name: "Packaged", icon: "📦", style: "category-purple" },
  ];

  const trendingItems = [
    { name: "Onion", price: "₹25/kg", trend: "+5%", image: "🧅" },
    { name: "Tomato", price: "₹30/kg", trend: "-2%", image: "🍅" },
    { name: "Turmeric Powder", price: "₹180/kg", trend: "+8%", image: "🌟" },
  ];

  const quickActions =
    userRole === "buyer"
      ? [
          { id: "reorder", name: "Reorder", icon: "🔄", style: "action-blue" },
          {
            id: "credit",
            name: "Partner Credit",
            icon: "💳",
            style: "action-green",
          },
          {
            id: "bulk",
            name: "Bulk Order",
            icon: "📦",
            style: "action-purple",
          },
        ]
      : [
          {
            id: "inventory",
            name: "Inventory",
            icon: "📊",
            style: "action-blue",
          },
          {
            id: "deliveries",
            name: "Deliveries",
            icon: "🚚",
            style: "action-green",
          },
          {
            id: "analytics",
            name: "Analytics",
            icon: "📈",
            style: "action-purple",
          },
        ];

  return (
    <div className="page-container">
      <Header
        title="Hello! 🙏"
        subtitle={
          userRole === "buyer"
            ? "What do you need today?"
            : "View today's orders"
        }
        showSearch={true}
        showNotification={true}
        showLocation={true}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        searchPlaceholder="Onion, Tomato, Spices..."
      />

      <div className="dashboard-content">
        {/* Quick Actions */}
        <div>
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <button key={action.id} className="action-card">
                <div className={`action-icon-wrapper ${action.style}`}>
                  <span className="action-icon">{action.icon}</span>
                </div>
                <div className="action-name">{action.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h2 className="section-title">Categories</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className="category-card"
              >
                <div className={`category-icon-wrapper ${category.style}`}>
                  <span className="category-icon">{category.icon}</span>
                </div>
                <div className="category-name">{category.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Items */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Trending Today</h2>
            <button className="view-all-button">
              <TrendingUp size={16} className="view-all-icon" />
              View All
            </button>
          </div>
          <div className="section-list">
            {trendingItems.map((item, index) => (
              <div key={index} className="section-item-card">
                <div className="section-item-content">
                  <div className="section-item-info">
                    <span className="section-item-image">{item.image}</span>
                    <div>
                      <div className="section-item-name">{item.name}</div>
                      <div className="section-item-price">{item.price}</div>
                    </div>
                  </div>
                  <div
                    className={`trend-indicator ${
                      item.trend.startsWith("+") ? "trend-up" : "trend-down"
                    }`}
                  >
                    {item.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {userRole === "buyer" && (
          <div>
            <div className="section-header">
              <h2 className="section-title">Products For You</h2>
              <button className="view-all-button">
                <TrendingUp size={16} className="view-all-icon" />
                View All
              </button>
            </div>
            <div className="section-grid">
              {products?.map((item, index) => (
                <div key={index} className="section-item-card">
                  <div className="section-item-content">
                    <div className="section-item-info">
                      <span className="section-item-image">{item.image}</span>
                      <div>
                        <div className="section-item-name">{item.name}</div>
                        <div className="section-item-price">{item.price}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Pricing Alert */}
        <div className="flash-sale-alert">
          <div className="flash-sale-content">
            <div className="flash-sale-icon-wrapper">
              <Zap className="flash-sale-icon" size={16} />
            </div>
            <div>
              <div className="flash-sale-title">Flash Sale!</div>
              <div className="flash-sale-desc">
                Fresh flowers 40% off - 2 hours left
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
