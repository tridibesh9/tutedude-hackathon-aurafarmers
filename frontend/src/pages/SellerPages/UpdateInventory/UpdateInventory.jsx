import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./UpdateInventory.css";
import Header from "../../../components/Header/Header";

const UpdateInventory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const existingItem = location.state?.itemData;

  const [productData, setProductData] = useState({
    productName: "",
    category: "",
    price: "",
    quantity: "",
    unit: "kg",
    discountSingleUser: "",
    discountSubscriptionUser: "",
    discountMergedOrder: "",
    expiryValue: "",
    expiryUnit: "days", // 'hours' or 'days'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  useEffect(() => {
    if (existingItem) {
      // Convert existing expiry date to hours/days from now
      let expiryValue = "";
      let expiryUnit = "days";

      if (existingItem.expiry) {
        const expiryDate = new Date(existingItem.expiry);
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
        productName: existingItem.name,
        category: existingItem.category,
        price: existingItem.price,
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
        ...productData,
        expiry: expiryDate.toISOString(),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real implementation, use different endpoints for update vs create
      const url = isUpdate
        ? `api/inventory/${existingItem.id}`
        : "api/inventory/create";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const message = isUpdate
          ? "Product updated successfully!"
          : "Product added successfully!";
        alert(message);

        // Navigate back to inventory
        navigate("/inventory");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert(`Failed to ${isUpdate ? "update" : "add"} product`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Header title="Update Inventory" subtitle="" showSearch />
      <div className="update-inventory">
        <form onSubmit={handleSubmit} className="inventory-form">
          <div className="form-group">
            <label htmlFor="productName">Product Name</label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={productData.productName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={productData.category}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              value={productData.price}
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="discountMergedOrder">
              Merged Order Discount (%)
            </label>
            <input
              type="number"
              id="discountMergedOrder"
              name="discountMergedOrder"
              value={productData.discountMergedOrder}
              onChange={handleInputChange}
              required
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
              ? "Update Product"
              : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateInventory;
