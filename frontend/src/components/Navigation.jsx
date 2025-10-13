
// ============================================
// src/components/Navigation.jsx (Optional)
// ============================================

import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import "../styles/Navigation.css";

export default function Navigation() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🍕 Domino's Pizza
        </Link>

        <div className="nav-menu">
          {user?.role === "ADMIN" ? (
            <>
              <Link to="/admin" className="nav-link">
                Dashboard
              </Link>
              <Link to="/admin/locations" className="nav-link">
                Locations
              </Link>
              <Link to="/admin/users" className="nav-link">
                Users
              </Link>
              <Link to="/admin/attendance-report" className="nav-link">
                Reports
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link">
                Dashboard
              </Link>
              <Link to="/check-in" className="nav-link">
                Check-in
              </Link>
              <Link to="/history" className="nav-link">
                History
              </Link>
            </>
          )}

          <div className="nav-user">
            <span className="nav-username">{user?.name}</span>
            <button onClick={handleLogout} className="nav-logout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

