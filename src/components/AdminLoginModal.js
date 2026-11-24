import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/AdminLoginModal.css";

// ⚠️ Frontend-only credentials
const ADMIN_USERNAME = "AdminKhaipi";
const ADMIN_PASSWORD = "@dmingink821";

// Lockout configuration
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function AdminLoginModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Lockout state
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  // Load lockout data from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedAttempts = parseInt(
        localStorage.getItem("loginAttempts") || "0",
        10,
      );
      const savedLockout = parseInt(
        localStorage.getItem("loginLockoutUntil") || "0",
        10,
      );

      setAttempts(savedAttempts);

      if (savedLockout > Date.now()) {
        setLockoutUntil(savedLockout);
      } else {
        // If lockout has expired, clear it
        if (savedLockout !== 0) {
          localStorage.removeItem("loginAttempts");
          localStorage.removeItem("loginLockoutUntil");
          setAttempts(0);
        }
        setLockoutUntil(null);
      }
    }
  }, [isOpen]);

  // Countdown timer for the lockout
  useEffect(() => {
    if (!lockoutUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = lockoutUntil - now;

      if (diff <= 0) {
        // Lockout expired
        setLockoutUntil(null);
        setAttempts(0);
        localStorage.removeItem("loginAttempts");
        localStorage.removeItem("loginLockoutUntil");
        setError("");
        clearInterval(interval);
      } else {
        // Format time left (HH:MM:SS)
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    // If locked out, do nothing
    if (lockoutUntil) return;

    if (!username.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem("loginAttempts", newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        // Lockout for 24 hours
        const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutUntil(lockoutTime);
        localStorage.setItem("loginLockoutUntil", lockoutTime.toString());
        setError("Too many failed attempts. Account locked for 24 hours.");
      } else {
        setError(
          `Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
        );
      }
      return;
    }

    // Successful login
    localStorage.removeItem("loginAttempts");
    localStorage.removeItem("loginLockoutUntil");
    login();
    setUsername("");
    setPassword("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modal-overlay") && !lockoutUntil)
      onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close login"
          disabled={!!lockoutUntil} // Prevent closing if locked out
          style={{
            opacity: lockoutUntil ? 0.3 : 1,
            cursor: lockoutUntil ? "not-allowed" : "pointer",
          }}
        >
          ×
        </button>

        <div className="modal-header">
          <span className="modal-icon">{lockoutUntil ? "🔒" : "🔐"}</span>
          <h2 className="modal-title">
            {lockoutUntil ? "Account Locked" : "Admin Login"}
          </h2>
          <p className="modal-subtitle">
            {lockoutUntil
              ? "Too many failed attempts. Please try again later."
              : "Sign in to manage and upload songs."}
          </p>
        </div>

        {lockoutUntil ? (
          <div className="lockout-message">
            <p className="lockout-timer">
              Time remaining: <strong>{timeLeft}</strong>
            </p>
            <p className="lockout-hint">
              For security reasons, the login is temporarily disabled.
            </p>
          </div>
        ) : (
          <form
            className="modal-form"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <label className="form-field">
              <span className="form-label">Username</span>
              <input
                type="text"
                className="form-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                autoFocus
                disabled={!!lockoutUntil}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Password</span>
              <div className="password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  disabled={!!lockoutUntil}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={!!lockoutUntil}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </label>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="btn-modal-gold"
              disabled={!!lockoutUntil}
            >
              Sign In
            </button>
          </form>
        )}

        {!lockoutUntil && (
          <p className="modal-hint">Authorized personnel only.</p>
        )}
      </div>
    </div>
  );
}

export default AdminLoginModal;
