import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../contexts/UserContext";
import {
  productAPI,
  inventoryAPI,
  orderAPI,
  apiHelpers,
} from "../../utils/api";
import "./ProductBuy.css";
import Header from "../../components/Header/Header";

const ProductBuy = ({ productId }) => {
  const { user } = useContext(UserContext);
  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState("solo_singletime");
  const [cartStatus, setCartStatus] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Add loading state for order placement
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  useEffect(() => {
    if (product && quantity > 0) {
      fetchPricing();
    }
  }, [product, quantity, purchaseType]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const productData = await productAPI.getProduct(productId);
      setProduct(productData);
      setInventory(productData.inventories || []);
      setError("");
    } catch (error) {
      setError(apiHelpers.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async () => {
    try {
      const pricingData = await inventoryAPI.getProductPricing(
        productId,
        quantity,
        purchaseType
      );
      setPricing(pricingData);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      setPricing(null);
    }
  };

  const handleAddToCart = () => {
    try {
      // Get existing cart
      const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

      // Check if product already exists in cart
      const existingItemIndex = existingCart.findIndex(
        (item) => item.product_id === productId
      );

      if (existingItemIndex >= 0) {
        // Update quantity
        existingCart[existingItemIndex].quantity += parseInt(quantity);
      } else {
        // Add new item
        existingCart.push({
          product_id: productId,
          name: product.name,
          price: product.price,
          quantity: parseInt(quantity),
          seller_id: product.seller_id,
          category: product.category,
        });
      }

      localStorage.setItem("cart", JSON.stringify(existingCart));
      setCartStatus("Added to cart!");

      // Clear status after 3 seconds
      setTimeout(() => setCartStatus(""), 3000);
    } catch (error) {
      setCartStatus("Failed to add to cart.");
    }
  };

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    setIsPlacingOrder(true);
    setOrderStatus("");

    try {
      const orderData = {
        seller_id: product.seller_id,
        estimated_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 7 days from now
        order_type: purchaseType === "group" ? "group" : "individual",
      };

      const orderItems = [
        {
          product_id: productId,
          quantity: parseInt(quantity),
          // Don't send price_per_unit as backend will calculate it based on discounts
          unit: product.unit || "piece", // Add unit if available
        },
      ];

      const response = await orderAPI.createOrder(
        orderData,
        orderItems,
        purchaseType // Pass purchase type for discount calculation
      );

      setOrderStatus("Order placed successfully!");

      // Clear cart if item was in cart
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const updatedCart = cart.filter((item) => item.product_id !== productId);
      localStorage.setItem("cart", JSON.stringify(updatedCart));

      // Clear status and redirect after 2 seconds
      setTimeout(() => {
        setOrderStatus("");
        window.location.href = "/orders"; // Redirect to orders page
      }, 2000);
    } catch (error) {
      const errorMessage = apiHelpers.handleError(error);
      setOrderStatus(`Order failed: ${errorMessage}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found</div>;

  const availableQuantity = inventory.reduce(
    (total, inv) => total + inv.quantity,
    0
  );

  return (
    <div className="page-container">
      <Header title="Product Info" subtitle="" showSearch />
      <div className="product-buy-container">
        <h2>{product.name}</h2>
        <p>Category: {product.category}</p>
        <p>Base Price: ₹{product.price}</p>
        <p>Rating: {product.rating || "No ratings yet"}</p>
        <p>Available Quantity: {availableQuantity}</p>

        <div>
          <h4>Inventory Batches</h4>
          {inventory.length > 0 ? (
            <ul>
              {inventory.map((item, idx) => (
                <li key={idx}>
                  Quantity: {item.quantity}, Discount:{" "}
                  {item.discount?.solo_singletime || 0}%, Expires:{" "}
                  {item.expiry_date}
                </li>
              ))}
            </ul>
          ) : (
            <p>No inventory available.</p>
          )}
        </div>

        <div>
          <label>Purchase Type: </label>
          <select
            value={purchaseType}
            onChange={(e) => setPurchaseType(e.target.value)}
          >
            <option value="solo_singletime">Solo Purchase</option>
            <option value="subscription">Subscription</option>
            <option value="group">Group Purchase</option>
          </select>
        </div>

        <div>
          <label>Quantity: </label>
          <input
            type="number"
            min="1"
            max={availableQuantity}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </div>

        {pricing && (
          <div className="pricing-info">
            <h4>Pricing Breakdown</h4>
            <p>Original Total: ₹{pricing.pricing.original_total}</p>
            <p>Discounted Total: ₹{pricing.pricing.discounted_total}</p>
            <p>
              Total Savings: ₹{pricing.pricing.total_savings} (
              {pricing.pricing.savings_percentage}%)
            </p>
            <p>Price per unit: ₹{pricing.pricing.average_price_per_unit}</p>
          </div>
        )}

        <button onClick={handleAddToCart} disabled={availableQuantity === 0}>
          Add to Cart
        </button>
        {cartStatus && <span className="status-message">{cartStatus}</span>}

        <button
          onClick={handlePlaceOrder}
          // disabled={availableQuantity === 0}
        >
          Place Order
        </button>
        {orderStatus && <span className="status-message">{orderStatus}</span>}
      </div>
    </div>
  );
};

export default ProductBuy;
