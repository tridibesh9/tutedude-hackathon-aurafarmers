import React, { useEffect, useState } from "react";
import { Bell, Search, Mic, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = ({
  title,
  subtitle,
  showSearch = false,
  showNotification = true,
  showLocation = true,
  showBackButton = false,
  onSearchChange,
  onBackClick,
  searchPlaceholder = "Search...",
  rightContent,
  children,
}) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  // Fetch user info from /user/profile
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserInfo(data);
        }
      } catch (err) {
        setUserInfo(null);
      }
    }
    fetchUserInfo();
  }, []);

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-top">
          <div className="header-left">
            {showBackButton && (
              <button className="header-back-button" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="header-text">
              <h1 className="header-title">{title}</h1>
              {subtitle && <p className="header-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="header-actions">
            {showSearch && (
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="search-input"
                />
                <Mic size={18} className="mic-icon" />
              </div>
            )}

            {showLocation && (
              <div className="location-info">
                <span className="location-icon">📍</span>
                <span className="location-text">Location</span>
              </div>
            )}
            {showNotification && (
              <button className="notification-button">
                <Bell size={20} />
              </button>
            )}

            {/* Profile Icon */}
            <button
              className="profile-button"
              onClick={handleProfileClick}
              title={userInfo?.name || "Profile"}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                marginLeft: "8px",
              }}
            >
              <User size={22} />
            </button>

            {rightContent}
          </div>
        </div>

        {children}
      </div>
    </header>
  );
};

export default Header;
