import React, { useState, useEffect } from 'react';
import './CreateBargainModal.css';

const CreateBargainModal = ({ userRole, onClose, onBargainCreated }) => {
  const [bargainType, setBargainType] = useState('public');
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    quantity: '',
    starting_price: '',
    pincode: '',
    expiry_time: '',
    description: '',
    target_seller_id: '', // For private bargains
    category: ''
  });
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log('CreateBargainModal mounted, fetching products...');
    fetchProducts();
  }, []);

  useEffect(() => {
    if (bargainType === 'private' && products.length > 0) {
      fetchSellers();
    }
  }, [bargainType, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        setErrors({ submit: 'Please log in to create bargains' });
        return;
      }
      
      console.log('Fetching products from API...');
      
      // Fetch all products (not just seller's products for bargain creation)
      const response = await fetch('http://localhost:8000/api/v1/product/?limit=100&seller_only=false', {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw API response:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          console.log('Products loaded successfully:', data.length, 'products');
          console.log('First product sample:', data[0]);
        } else {
          console.log('No products found or empty response');
          setProducts([]);
          setErrors({ submit: 'No products available for bargaining' });
        }
      } else {
        console.error('API Error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
        if (response.status === 401) {
          setErrors({ submit: 'Authentication failed. Please log in again.' });
        } else if (response.status === 403) {
          setErrors({ submit: 'Access denied. Please check your permissions.' });
        } else {
          setErrors({ submit: `Failed to fetch products: ${response.status} ${response.statusText}` });
        }
        setProducts([]);
      }
    } catch (error) {
      console.error('Network error fetching products:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setErrors({ submit: 'Connection failed. Please check if the server is running and CORS is configured.' });
      } else {
        setErrors({ submit: 'Network error. Please try again.' });
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      // For now, we'll extract unique sellers from the products
      // since there's no direct sellers endpoint
      const uniqueSellers = [];
      const sellerIds = new Set();
      
      products.forEach(product => {
        if (product.seller_id && !sellerIds.has(product.seller_id)) {
          sellerIds.add(product.seller_id);
          uniqueSellers.push({
            seller_id: product.seller_id,
            name: `Seller ${product.seller_id.slice(0, 8)}...`, // Abbreviated seller ID as name
            // You could fetch seller details here if needed
          });
        }
      });
      
      setSellers(uniqueSellers);
      console.log('Sellers extracted from products:', uniqueSellers);
    } catch (error) {
      console.error('Error processing sellers:', error);
      setSellers([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleProductSelect = (productId) => {
    const selectedProduct = products.find(p => p.product_id === productId);
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        product_id: productId,
        product_name: selectedProduct.name,
        category: selectedProduct.category,
        starting_price: selectedProduct.price || ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_id) newErrors.product_id = 'Please select a product';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required';
    if (!formData.starting_price) newErrors.starting_price = 'Starting price is required';
    if (!formData.pincode) newErrors.pincode = 'Pincode is required';
    if (!formData.expiry_time) newErrors.expiry_time = 'Expiry time is required';
    
    if (bargainType === 'private' && !formData.target_seller_id) {
      newErrors.target_seller_id = 'Please select a seller';
    }

    // Validate pincode (basic validation)
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    // Validate quantity and price are positive numbers
    if (formData.quantity && (isNaN(formData.quantity) || parseFloat(formData.quantity) <= 0)) {
      newErrors.quantity = 'Quantity must be a positive number';
    }
    if (formData.starting_price && (isNaN(formData.starting_price) || parseFloat(formData.starting_price) <= 0)) {
      newErrors.starting_price = 'Price must be a positive number';
    }

    // Validate expiry time is in the future
    if (formData.expiry_time) {
      const expiryDate = new Date(formData.expiry_time);
      const now = new Date();
      if (expiryDate <= now) {
        newErrors.expiry_time = 'Expiry time must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = bargainType === 'public' 
        ? '/api/v1/bargain/public/create'
        : '/api/v1/bargain/private/create';

      // Convert expiry time to hours from now
      const expiryDate = new Date(formData.expiry_time);
      const now = new Date();
      const hoursFromNow = Math.ceil((expiryDate - now) / (1000 * 60 * 60));

      const payload = {
        product_id: formData.product_id,
        quantity: parseInt(formData.quantity),
        initial_bid_price: parseFloat(formData.starting_price),
        location_pincode: formData.pincode,
        expires_in_hours: hoursFromNow,
        room_type: bargainType
      };

      // Add target seller for private bargains
      if (bargainType === 'private') {
        payload.seller_id = formData.target_seller_id;
      }

      console.log('Sending payload:', payload);

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        onBargainCreated(data);
      } else {
        setErrors({ submit: data.detail || 'Failed to create bargain' });
      }
    } catch (error) {
      console.error('Error creating bargain:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum expiry time (at least 1 hour from now)
  const getMinExpiryTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-bargain-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Bargain</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="bargain-form">
          {/* Bargain Type Toggle */}
          <div className="form-group">
            <label>Bargain Type</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`toggle-btn ${bargainType === 'public' ? 'active' : ''}`}
                onClick={() => setBargainType('public')}
              >
                Public (1:many)
              </button>
              <button
                type="button"
                className={`toggle-btn ${bargainType === 'private' ? 'active' : ''}`}
                onClick={() => setBargainType('private')}
              >
                Private (1:1)
              </button>
            </div>
          </div>

          {/* Product Selection */}
          <div className="form-group">
            <label>Product *</label>
            {loading ? (
              <div style={{ padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', color: '#856404' }}>
                No products available. {errors.submit && `Error: ${errors.submit}`}
              </div>
            ) : (
              <select
                value={formData.product_id}
                onChange={(e) => handleProductSelect(e.target.value)}
                className={errors.product_id ? 'error' : ''}
              >
                <option value="">Select a product ({products.length} available)</option>
                {products.map(product => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.name} - {product.category} (₹{product.price})
                  </option>
                ))}
              </select>
            )}
            {errors.product_id && <span className="error-text">{errors.product_id}</span>}
            
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Debug: {products.length} products loaded, Loading: {loading.toString()}
                <button 
                  type="button" 
                  onClick={fetchProducts}
                  style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '10px' }}
                >
                  Retry Fetch
                </button>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="Enter quantity"
                className={errors.quantity ? 'error' : ''}
              />
              {errors.quantity && <span className="error-text">{errors.quantity}</span>}
            </div>

            <div className="form-group">
              <label>Starting Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.starting_price}
                onChange={(e) => handleInputChange('starting_price', e.target.value)}
                placeholder="Enter starting price"
                className={errors.starting_price ? 'error' : ''}
              />
              {errors.starting_price && <span className="error-text">{errors.starting_price}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Pincode *</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                placeholder="Enter pincode"
                maxLength="6"
                className={errors.pincode ? 'error' : ''}
              />
              {errors.pincode && <span className="error-text">{errors.pincode}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Expiry Time *</label>
            <input
              type="datetime-local"
              value={formData.expiry_time}
              onChange={(e) => handleInputChange('expiry_time', e.target.value)}
              min={getMinExpiryTime()}
              className={errors.expiry_time ? 'error' : ''}
            />
            {errors.expiry_time && <span className="error-text">{errors.expiry_time}</span>}
          </div>

          {/* Private Bargain - Seller Selection */}
          {bargainType === 'private' && (
            <div className="form-group">
              <label>Target Seller *</label>
              <select
                value={formData.target_seller_id}
                onChange={(e) => handleInputChange('target_seller_id', e.target.value)}
                className={errors.target_seller_id ? 'error' : ''}
              >
                <option value="">Select a seller</option>
                {sellers.map(seller => (
                  <option key={seller.seller_id} value={seller.seller_id}>
                    {seller.name}
                  </option>
                ))}
              </select>
              {errors.target_seller_id && <span className="error-text">{errors.target_seller_id}</span>}
            </div>
          )}

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add any special requirements or notes"
              rows="3"
            />
          </div>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Bargain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBargainModal;
