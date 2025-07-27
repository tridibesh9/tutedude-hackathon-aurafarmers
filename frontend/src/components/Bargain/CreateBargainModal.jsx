import React, { useState, useEffect } from 'react';
import './CreateBargainModal.css';

const CreateBargainModal = ({ userRole, onClose, onBargainCreated }) => {
  const [bargainType, setBargainType] = useState('public');
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    quantity: '',
    starting_price: '',
    location: '',
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
    fetchProducts();
    if (bargainType === 'private') {
      fetchSellers();
    }
  }, [bargainType]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/users/sellers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSellers(data.sellers || []);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
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
    const selectedProduct = products.find(p => p.id === productId);
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
    if (!formData.location) newErrors.location = 'Location is required';
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
    if (formData.quantity && parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be positive';
    }
    if (formData.starting_price && parseFloat(formData.starting_price) <= 0) {
      newErrors.starting_price = 'Price must be positive';
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

      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        starting_price: parseFloat(formData.starting_price),
        expiry_time: new Date(formData.expiry_time).toISOString(),
        type: bargainType
      };

      // Remove target_seller_id for public bargains
      if (bargainType === 'public') {
        delete payload.target_seller_id;
      }

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        onBargainCreated(data.bargain);
      } else {
        setErrors({ submit: data.detail || 'Failed to create bargain' });
      }
    } catch (error) {
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
            <select
              value={formData.product_id}
              onChange={(e) => handleProductSelect(e.target.value)}
              className={errors.product_id ? 'error' : ''}
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.category}
                </option>
              ))}
            </select>
            {errors.product_id && <span className="error-text">{errors.product_id}</span>}
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
              <label>Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location"
                className={errors.location ? 'error' : ''}
              />
              {errors.location && <span className="error-text">{errors.location}</span>}
            </div>

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
                  <option key={seller.id} value={seller.id}>
                    {seller.name} - {seller.location}
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
