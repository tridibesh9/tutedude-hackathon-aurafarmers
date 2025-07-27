import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../contexts/UserContext";
import api from "../../utils/api";
import "./ProductBuy.css";
import Header from "../../components/Header/Header";

const ProductBuy = ({ productId }) => {
  const { user } = useContext(UserContext);
  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState("");
  const [orderStatus, setOrderStatus] = useState("");

  useEffect(() => {
    // Fetch product details
    api.get(`/product/${productId}`).then((res) => {
      setProduct(res.data);
      setInventory(res.data.inventory || []);
    });
    // Fetch reviews
    // api
    //   .get(`/product/${productId}/reviews`)
    //   .then((res) => setReviews(res.data));
  }, [productId]);

  const handleAddToCart = () => {
    api
      .post("/cart/add", {
        product_id: productId,
        quantity,
        buyer_id: user?.id,
      })
      .then(() => setCartStatus("Added to cart!"))
      .catch(() => setCartStatus("Failed to add to cart."));
  };

  const handlePlaceOrder = () => {
    api
      .post("/order/place", {
        product_id: productId,
        quantity,
        buyer_id: user?.id,
      })
      .then(() => setOrderStatus("Order placed!"))
      .catch(() => setOrderStatus("Order failed."));
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="page-container">
      <Header title="Product Info" subtitle="" showSearch />
      <div className="product-buy-container">
        <p>Category: {product.category}</p>
        <p>Price: ₹{product.price}</p>
        <p>Rating: {product.rating || "No ratings yet"}</p>
        <p>Seller: {product.seller_id}</p>
        <div>
          <h4>Inventory</h4>
          {inventory.length > 0 ? (
            <ul>
              {inventory.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>No inventory available.</p>
          )}
        </div>
        <div>
          <label>Quantity: </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <button onClick={handleAddToCart}>Add to Cart</button>
        <span>{cartStatus}</span>
        <button onClick={handlePlaceOrder}>Place Order</button>
        <span>{orderStatus}</span>
        <div>
          <h4>Reviews & Ratings</h4>
          {reviews.length > 0 ? (
            <ul>
              {reviews.map((review, idx) => (
                <li key={idx}>
                  <strong>{review.user}</strong>: {review.comment} (Rating:{" "}
                  {review.rating})
                </li>
              ))}
            </ul>
          ) : (
            <p>No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductBuy;
