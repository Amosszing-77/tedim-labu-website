import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminLoginModal from "./AdminLoginModal";
import "../styles/Navbar.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setIsOpen(false);

  const handleAdminClick = () => {
    closeMenu();
    if (isAdmin) {
      navigate("/admin");
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Updated Logo with Image */}
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <img
              src="/buicon.jpg" // <--- FIXED PATH HERE
              alt="Zomi Hymnal Logo"
              className="logo-img"
            />
            <span className="logo-text">ZOMI HYMNAL</span>
          </Link>

          <button
            className={`navbar-toggle ${isOpen ? "active" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>

          <ul className={`navbar-links ${isOpen ? "open" : ""}`}>
            <li>
              <NavLink to="/" onClick={closeMenu} className="nav-link">
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/songs" onClick={closeMenu} className="nav-link">
                Songs
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" onClick={closeMenu} className="nav-link">
                About
              </NavLink>
            </li>

            {/* Admin button — always visible */}
            <li className="admin-item">
              <button
                className={`admin-btn ${isAdmin ? "logged-in" : ""}`}
                onClick={handleAdminClick}
              >
                {isAdmin ? "Admin Panel" : "Admin Login"}
              </button>
            </li>

            {isAdmin && (
              <li className="admin-item">
                <button
                  className="logout-btn"
                  onClick={() => {
                    logout();
                    closeMenu();
                    navigate("/");
                  }}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>

      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </>
  );
}

export default Navbar;
