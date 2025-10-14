// ============================================
// src/components/Navigation.jsx
// ============================================

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import "../styles/Navigation.css";

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLinkClick = () => {
    setShowUserMenu(false);
  };

  const isAdminPath = location.pathname.startsWith("/admin");

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
          🍕 Domino's Pizza
        </Link>

        {/* Main Navigation Links */}
        <div className="navbar-menu">
          {isAdminPath ? (
            // Admin Navigation
            <>
              <Link
                to="/admin"
                className={`nav-link ${
                  location.pathname === "/admin" ? "active" : ""
                }`}
                onClick={handleLinkClick}
              >
                📊 Dashboard
              </Link>
              <Link
                to="/admin/shifts"
                className={`nav-link ${
                  location.pathname === "/admin/shifts" ? "active" : ""
                }`}
                onClick={handleLinkClick}
              >
                ⏰ Shifts
              </Link>
              <Link
                to="/admin/locations"
                className={`nav-link ${
                  location.pathname === "/admin/locations" ? "active" : ""
                }`}
                onClick={handleLinkClick}
              >
                📍 Locations
              </Link>
              <Link
                to="/admin/users"
                className={`nav-link ${
                  location.pathname === "/admin/users" ? "active" : ""
                }`}
                onClick={handleLinkClick}
              >
                👥 Users
              </Link>
              <Link
                to="/admin/attendance-report"
                className={`nav-link ${
                  location.pathname === "/admin/attendance-report"
                    ? "active"
                    : ""
                }`}
                onClick={handleLinkClick}
              >
                📈 Reports
              </Link>
            </>
          ) : (
            // Employee Navigation
            <>
              <Link
                to="/"
                className={`nav-link ${
                  location.pathname === "/" ? "active" : ""
                }`}
                onClick={handleLinkClick}
              >
                📊 Dashboard
              </Link>
              <Link
                to="/check-in"
                className={`nav-link ${
                  location.pathname === "/check-in" ? "active" : ""
                }`}
                onClick={handleLinkClick}
              >
                📍 Check-in
              </Link>
              <Link
                to="/history"
                className={`nav-link ${
                  location.pathname === "/history" ? "active" : ""
                }`}
                onClick={handleLinkClick}
              >
                📋 History
              </Link>
              {/* Admin Panel Link for Admin Users */}
              {user?.role === "ADMIN" && (
                <Link
                  to="/admin"
                  className="nav-link admin-link"
                  onClick={handleLinkClick}
                >
                  ⚙️ Admin Panel
                </Link>
              )}
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            {user?.role === "ADMIN" && (
              <span className="admin-badge">ADMIN</span>
            )}
          </div>

          {/* Dropdown Menu */}
          <div className="user-menu-container">
            <button
              className="user-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              ▼
            </button>

            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="menu-item disabled">
                  <span className="menu-label">Email:</span>
                  <span className="menu-value">{user?.email}</span>
                </div>
                <div className="menu-item disabled">
                  <span className="menu-label">Role:</span>
                  <span
                    className={`menu-value role-${user?.role?.toLowerCase()}`}
                  >
                    {user?.role}
                  </span>
                </div>
                <div className="menu-divider"></div>
                <button
                  className="menu-item logout-item"
                  onClick={() => {
                    handleLogout();
                    setShowUserMenu(false);
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
