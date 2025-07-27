import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Inventory.css";
import Header from "../../../components/Header/Header";
import { inventoryAPI, apiHelpers } from "../../../utils/api";

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { text: "No expiry date", class: "" };

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffInHours = Math.round((expiry - now) / (1000 * 60 * 60));

  if (diffInHours < 0) {
    return { text: "Expired", class: "expired" };
  }

  if (diffInHours <= 24) {
    return {
      text: `Expires in ${diffInHours} hours`,
      class: "expiring-soon",
    };
  }

  const days = Math.floor(diffInHours / 24);
  if (days <= 7) {
    return {
      text: `Expires in ${days} days`,
      class: "expiring-week",
    };
  }

  return {
    text: `Expires in ${days} days`,
    class: "normal",
  };
};

const Inventory = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadInventory = async () => {
    try {
      setError("");
      const data = await inventoryAPI.getMyInventory({
        show_expired: true,
        limit: 100
      });
      
      // Sort by expiry date (soonest first)
      const sortedData = data.sort((a, b) => {
        const dateA = a.expiry_date ? new Date(a.expiry_date) : new Date("9999-12-31");
        const dateB = b.expiry_date ? new Date(b.expiry_date) : new Date("9999-12-31");
        return dateA - dateB;
      });
      
      setInventory(sortedData);
    } catch (error) {
      setError(apiHelpers.handleError(error));
      console.error("Error fetching inventory:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInventory();
  };

  const handleItemClick = (item) => {
    navigate("/update-inventory", { state: { itemData: item } });
  };

  const handleAddUpdate = () => {
    navigate("/update-inventory");
  };

  return (
    <div className="page-container">
      <Header title="Inventory" subtitle="Check your inventory" showSearch />
      <div className="dashboard-content">
        <div className="inventory-header">
          <div className="header-left">
            <h1>My Inventory</h1>
            <button
              className={`refresh-btn ${isRefreshing ? "spinning" : ""}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
              </svg>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <button className="add-inventory-btn" onClick={handleAddUpdate}>
            Add New Item
          </button>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading inventory...</p>
          </div>
        ) : (
          <>
            <div className="inventory-grid">
              {inventory.map((item) => (
                <div
                  key={item.inventory_id}
                  className="inventory-card"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="inventory-card-header">
                    <h3>{item.name}</h3>
                    <span className="category-badge">
                      {item.category || "N/A"}
                    </span>
                  </div>
                  <div className="inventory-card-content">
                    <p
                      className={`quantity ${
                        item.quantity < 50 ? "low-stock" : ""
                      }`}
                    >
                      <strong>Quantity:</strong> {item.quantity}
                    </p>
                    <p>
                      <strong>Discount:</strong>{" "}
                      {item.discount?.solo_singletime 
                        ? `${item.discount.solo_singletime}%` 
                        : "0%"}
                    </p>
                    {item.expiry_date && (
                      <p
                        className={`expiry-status ${
                          getExpiryStatus(item.expiry_date).class
                        }`}
                      >
                        {getExpiryStatus(item.expiry_date).text}
                      </p>
                    )}
                    <p className="last-updated">
                      Last updated:{" "}
                      {item.updated_at
                        ? new Date(item.updated_at).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                  <div className="card-overlay">
                    <span>Click to Update</span>
                  </div>
                </div>
              ))}
            </div>

            {inventory.length === 0 && (
              <div className="empty-state">
                <p>No inventory items found</p>
                <button className="add-inventory-btn" onClick={handleAddUpdate}>
                  Add Your First Item
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Inventory;
