import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          © {new Date().getFullYear()} All Rights Reserved
        </p>
        <p className="footer-text">
          Developed by <span className="footer-credit">Codex</span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
