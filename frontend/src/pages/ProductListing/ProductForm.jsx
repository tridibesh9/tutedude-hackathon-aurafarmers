import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { productAPI, inventoryAPI, apiHelpers } from '../../utils/api.js';

const ProductForm = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEdit = !!productId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [productData, setProductData] = useState({
    name: '',
    category: '',
    price: ''
  });

  const [inventoryData, setInventoryData] = useState({
    quantity: '',
    discount: '',
    expiry_date: ''
  });

  // Load product data if editing
  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const product = await productAPI.getProduct(productId);
      setProductData({
        name: product.name,
        category: product.category,
        price: product.price.toString()
      });
    } catch (error) {
      setError(apiHelpers.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (field, value) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInventoryChange = (field, value) => {
    setInventoryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let product;
      
      if (isEdit) {
        // Update existing product
        product = await productAPI.updateProduct(
          productId,
          productData.name,
          productData.category,
          parseFloat(productData.price)
        );
        setSuccessMessage('Product updated successfully!');
      } else {
        // Create new product
        product = await productAPI.createProduct(
          productData.name,
          productData.category,
          parseFloat(productData.price)
        );
        
        // Add inventory if provided
        if (inventoryData.quantity) {
          await inventoryAPI.addInventory(
            product.product_id,
            parseInt(inventoryData.quantity),
            parseFloat(inventoryData.discount || 0),
            inventoryData.expiry_date || null
          );
        }
        
        setSuccessMessage('Product created successfully!');
      }

      // Navigate back to products after success
      setTimeout(() => {
        navigate('/products');
      }, 2000);

    } catch (error) {
      setError(apiHelpers.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this product? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setLoading(true);
      await productAPI.deleteProduct(productId);
      setSuccessMessage('Product deleted successfully!');
      
      setTimeout(() => {
        navigate('/products');
      }, 1500);
    } catch (error) {
      setError(apiHelpers.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => navigate('/products')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '16px'
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
          {isEdit ? 'Edit Product' : 'Create New Product'}
        </h1>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          color: '#ef4444',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          color: '#059669',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {successMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Product Details */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Product Details
          </h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Product Name *
            </label>
            <input
              type="text"
              value={productData.name}
              onChange={(e) => handleProductChange('name', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Enter product name"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Category *
            </label>
            <select
              value={productData.category}
              onChange={(e) => handleProductChange('category', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Select category</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Grains">Grains</option>
              <option value="Dairy">Dairy</option>
              <option value="Meat">Meat</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Price per Unit (₹) *
            </label>
            <input
              type="number"
              value={productData.price}
              onChange={(e) => handleProductChange('price', e.target.value)}
              required
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Inventory Details (only for new products) */}
        {!isEdit && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Initial Inventory (Optional)
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Quantity
              </label>
              <input
                type="number"
                value={inventoryData.quantity}
                onChange={(e) => handleInventoryChange('quantity', e.target.value)}
                min="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="0"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Discount (%)
              </label>
              <input
                type="number"
                value={inventoryData.discount}
                onChange={(e) => handleInventoryChange('discount', e.target.value)}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                placeholder="0"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                Expiry Date
              </label>
              <input
                type="date"
                value={inventoryData.expiry_date}
                onChange={(e) => handleInventoryChange('expiry_date', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between'
        }}>
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <Trash2 size={16} />
                Delete Product
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <Save size={16} />
            {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
