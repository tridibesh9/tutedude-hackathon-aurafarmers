import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./UpdateInventory.css";
import Header from "../../../components/Header/Header";

const UpdateInventory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const existingItem = location.state?.itemData;

  // Add state for product list
  const [products, setProducts] = useState([]);
  const [productData, setProductData] = useState({
    product_id: "",
    quantity: "",
    unit: "kg",
    discountSingleUser: "",
    discountSubscriptionUser: "",
    discountMergedOrder: "",
    expiryValue: "",
    expiryUnit: "days",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  // Fetch products for dropdown
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products/my-products", {
          headers: {
            "Content-Type": "application/json",
            // Add any auth headers if needed
            // "Authorization": `Bearer ${token}`
          },
        });
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        alert("Failed to load products");
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    if (existingItem) {
      let expiryValue = "";
      let expiryUnit = "days";
      if (existingItem.expiry_date) {
        const expiryDate = new Date(existingItem.expiry_date);
        const now = new Date();
        const diffInHours = Math.round((expiryDate - now) / (1000 * 60 * 60));
        if (diffInHours <= 48) {
          expiryValue = diffInHours;
          expiryUnit = "hours";
        } else {
          expiryValue = Math.round(diffInHours / 24);
          expiryUnit = "days";
        }
      }
      setProductData({
        product_id: existingItem.product_id,
        quantity: existingItem.quantity,
        unit: existingItem.unit,
        discountSingleUser: existingItem.discount?.solo_singletime || "",
        discountSubscriptionUser: existingItem.discount?.subscription || "",
        discountMergedOrder: existingItem.discount?.group || "",
        expiryValue,
        expiryUnit,
      });
      setIsUpdate(true);
    }
  }, [existingItem]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convert expiry value and unit to actual date
      const now = new Date();
      const expiryHours =
        productData.expiryUnit === "hours"
          ? parseInt(productData.expiryValue)
          : parseInt(productData.expiryValue) * 24;
      const expiryDate = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

      // Prepare data for API
      const apiData = {
        product_id: productData.product_id,
        quantity: parseInt(productData.quantity),
        unit: productData.unit,
        discount: {
          solo_singletime: parseFloat(productData.discountSingleUser) || 0,
          subscription: parseFloat(productData.discountSubscriptionUser) || 0,
          group: parseFloat(productData.discountMergedOrder) || 0,
        },
        expiry_date: expiryDate.toISOString(),
      };

      const url = isUpdate
        ? `/api/inventory/update/${existingItem.inventory_id}`
        : "/api/inventory/add";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        alert(
          isUpdate
            ? "Inventory updated successfully!"
            : "Inventory added successfully!"
        );
        navigate("/inventory");
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to save inventory");
      }
    } catch (error) {
      console.error("Error saving inventory:", error);
      alert(`Failed to ${isUpdate ? "update" : "add"} inventory`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header
        title={isUpdate ? "Update Inventory" : "Add Inventory"}
        subtitle=""
        showSearch
      />
      <div className="update-inventory">
        <form onSubmit={handleSubmit} className="inventory-form">
          <div className="form-group">
            <label htmlFor="product_id">Product</label>
            {isUpdate ? (
              // Show readonly input for update mode
              <input
                type="text"
                value={
                  products.find((p) => p.product_id === productData.product_id)
                    ?.name || "Loading..."
                }
                disabled
                readOnly
                className="readonly-product"
              />
            ) : (
              // Show select for create mode
              <select
                id="product_id"
                name="product_id"
                value={productData.product_id || ""}
                onChange={handleInputChange}
                required
                className="product-select"
              >
                <option value="">Select product</option>
                {products && products.length > 0 ? (
                  products.map((prod) => (
                    <option key={prod.product_id} value={prod.product_id}>
                      {prod.name} ({prod.category})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Loading products...
                  </option>
                )}
              </select>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={productData.quantity}
              onChange={handleInputChange}
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="unit">Unit</label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={productData.unit}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="discountSingleUser">Single User Discount (%)</label>
            <input
              type="number"
              id="discountSingleUser"
              name="discountSingleUser"
              value={productData.discountSingleUser}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="discountSubscriptionUser">
              Subscription User Discount (%)
            </label>
            <input
              type="number"
              id="discountSubscriptionUser"
              name="discountSubscriptionUser"
              value={productData.discountSubscriptionUser}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="discountMergedOrder">
              Group Order Discount (%)
            </label>
            <input
              type="number"
              id="discountMergedOrder"
              name="discountMergedOrder"
              value={productData.discountMergedOrder}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
            />
          </div>

          <div className="form-group expiry-group">
            <label>Expiry Time</label>
            <div className="expiry-container">
              <div className="expiry-inputs">
                <div className="expiry-value-input">
                  <input
                    type="number"
                    name="expiryValue"
                    value={productData.expiryValue}
                    onChange={handleInputChange}
                    placeholder="Enter value"
                    required
                    min="1"
                  />
                </div>
                <div className="expiry-unit-select">
                  <select
                    name="expiryUnit"
                    value={productData.expiryUnit}
                    onChange={handleInputChange}
                    className="custom-select"
                  >
                    <option value="hours">Hours ⏱️</option>
                    <option value="days">Days 📅</option>
                  </select>
                  <span className="select-arrow">▼</span>
                </div>
              </div>
              {productData.expiryValue && productData.expiryUnit && (
                <div className="expiry-preview">
                  <span className="expiry-icon">⏳</span>
                  <span>
                    Expires on:{" "}
                    {new Date(
                      Date.now() +
                        (productData.expiryUnit === "hours"
                          ? parseInt(productData.expiryValue)
                          : parseInt(productData.expiryValue) * 24) *
                          60 *
                          60 *
                          1000
                    ).toLocaleString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : isUpdate
              ? "Update Inventory"
              : "Add Inventory"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateInventory;
