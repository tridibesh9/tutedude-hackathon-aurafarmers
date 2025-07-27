import { useState } from 'react';
import './Profile.css';

const Profile = ({ userRole, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@email.com',
    businessName: userRole === 'buyer' ? 'Kumar Chaat Corner' : 'Kumar Fresh Vegetables',
    address: 'Shop 15, Main Market, Karol Bagh, New Delhi - 110005',
    gst: userRole === 'seller' ? '07AAAFR2938D1Z8' : '',
    bankAccount: '1234567890',
    ifsc: 'HDFC0001234'
  });
  
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    // Simulate saving profile data
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const renderProfileTab = () => (
    <div className="profile-content">
      <div className="profile-header">
        <div className="profile-avatar">
          {profileData.name.charAt(0)}
        </div>
        <div className="profile-info">
          <h2>{profileData.name}</h2>
          <p className="role-badge">
            {userRole === 'buyer' ? '🛒 Vendor' : '📦 Supplier'}
          </p>
        </div>
        <button 
          className="btn btn-secondary btn-small"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="profile-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>
          
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Business Information</h3>
          <div className="input-group">
            <label>Business Name</label>
            <input
              type="text"
              name="businessName"
              value={profileData.businessName}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
          
          <div className="input-group">
            <label>Business Address</label>
            <textarea
              name="address"
              value={profileData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows="3"
            />
          </div>

          {userRole === 'seller' && (
            <div className="input-group">
              <label>GST Number</label>
              <input
                type="text"
                name="gst"
                value={profileData.gst}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Payment Information</h3>
          <div className="form-row">
            <div className="input-group">
              <label>Bank Account</label>
              <input
                type="text"
                name="bankAccount"
                value={profileData.bankAccount}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div className="input-group">
              <label>IFSC Code</label>
              <input
                type="text"
                name="ifsc"
                value={profileData.ifsc}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="analytics-content">
      <h2>📊 Your Analytics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>Monthly Orders</h3>
            <div className="stat-value">
              {userRole === 'buyer' ? '24' : '156'}
            </div>
            <div className="stat-change positive">+12%</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Monthly {userRole === 'buyer' ? 'Spending' : 'Revenue'}</h3>
            <div className="stat-value">
              ₹{userRole === 'buyer' ? '8,450' : '45,600'}
            </div>
            <div className="stat-change positive">+8%</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>Average Rating</h3>
            <div className="stat-value">4.6</div>
            <div className="stat-change positive">+0.2</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <h3>Credit Limit</h3>
            <div className="stat-value">₹15,000</div>
            <div className="stat-change">Available</div>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h3>Monthly Trends</h3>
        <div className="chart-placeholder">
          <p>📊 Interactive charts would be displayed here showing:</p>
          <ul>
            <li>{userRole === 'buyer' ? 'Purchase patterns' : 'Sales trends'}</li>
            <li>Popular products</li>
            <li>Peak order times</li>
            <li>Seasonal variations</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="settings-content">
      <h2>⚙️ Settings</h2>
      
      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="setting-item">
          <label className="setting-label">
            <input type="checkbox" defaultChecked />
            <span>Order confirmations</span>
          </label>
        </div>
        <div className="setting-item">
          <label className="setting-label">
            <input type="checkbox" defaultChecked />
            <span>Delivery updates</span>
          </label>
        </div>
        <div className="setting-item">
          <label className="setting-label">
            <input type="checkbox" />
            <span>Promotional offers</span>
          </label>
        </div>
        <div className="setting-item">
          <label className="setting-label">
            <input type="checkbox" defaultChecked />
            <span>Price alerts</span>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Language & Region</h3>
        <div className="input-group">
          <label>Preferred Language</label>
          <select defaultValue="hindi">
            <option value="hindi">हिंदी (Hindi)</option>
            <option value="english">English</option>
            <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="gujarati">ગુજરાતી (Gujarati)</option>
          </select>
        </div>
        <div className="input-group">
          <label>Currency</label>
          <select defaultValue="inr">
            <option value="inr">₹ Indian Rupee</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>Privacy & Security</h3>
        <div className="setting-item">
          <button className="btn btn-secondary">Change Password</button>
        </div>
        <div className="setting-item">
          <button className="btn btn-secondary">Two-Factor Authentication</button>
        </div>
        <div className="setting-item">
          <button className="btn btn-secondary">Download My Data</button>
        </div>
      </div>

      <div className="settings-section danger-zone">
        <h3>Account</h3>
        <div className="setting-item">
          <button className="btn btn-danger" onClick={onLogout}>
            Logout
          </button>
        </div>
        <div className="setting-item">
          <button className="btn btn-danger">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="profile">
      <div className="header">
        <h1>Profile</h1>
        <p>Manage your account and preferences</p>
      </div>

      <div className="container">
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Analytics
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      </div>
    </div>
  );
};

export default Profile;