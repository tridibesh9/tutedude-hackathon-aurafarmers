import React from "react";
import { Bell, Search, Mic, ArrowLeft } from "lucide-react";
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

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
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

            {showNotification && (
              <button className="notification-button">
                <Bell size={20} />
              </button>
            )}

            {showLocation && (
              <div className="location-info">
                <span className="location-icon">📍</span>
                <span className="location-text">Rohtak, Haryana</span>
              </div>
            )}

            {rightContent}
          </div>
        </div>

        {children}
      </div>
    </header>
  );
};

export default Header;
