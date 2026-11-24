import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { releaseApi } from "../services/api";
import "../styles/Home.css";

function Home() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch releases on mount
  useEffect(() => {
    const fetchReleases = async () => {
      try {
        // Only get published releases
        const res = await releaseApi.list({ status: "Published" });
        setReleases(res.data || []);
      } catch (err) {
        console.error("Failed to load app releases:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  // Helper to find the latest release for a specific platform
  const getLatestRelease = (platform) => {
    const platformReleases = releases.filter((r) => r.platform === platform);
    if (platformReleases.length === 0) return null;

    // Sort by createdAt descending to get the newest one
    return platformReleases.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    )[0];
  };

  const androidRelease = getLatestRelease("Android");
  const iosRelease = getLatestRelease("iOS");

  return (
    <main className="home">
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-glow" aria-hidden="true"></div>
        <div className="hero-content">
          <span className="hero-badge">✦ Premium Music Experience</span>
          <h1 className="hero-title">
            Discover Music
            <span className="hero-title-gold">8th & 9th Editions</span>
          </h1>
          <p className="hero-subtitle">
            A curated collection of songs, thoughtfully organized for the
            moments that matter. Dive in and let the rhythm take over.
          </p>
          <div className="hero-actions">
            <Link to="/songs" className="btn btn-gold">
              Explore Songs
            </Link>
            <Link to="/about" className="btn btn-ghost">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ===== DOWNLOAD CARDS ===== */}
      <section className="downloads">
        <div className="downloads-header">
          <h2 className="section-title">Get the App</h2>
          <p className="section-subtitle">
            Download on your favorite platform and listen anywhere.
          </p>
        </div>

        <div className="downloads-grid">
          {/* ================= ANDROID ================= */}
          {loading ? (
            <div className="download-card loading-state">Checking...</div>
          ) : androidRelease ? (
            <a
              href={androidRelease.driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="download-card"
            >
              <div className="download-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="44"
                  height="44"
                >
                  <path d="M17.6 9.48l1.84-3.18a.4.4 0 10-.69-.4l-1.87 3.23a11.4 11.4 0 00-9.76 0L5.25 5.9a.4.4 0 10-.69.4L6.4 9.48A10.4 10.4 0 000 18h24a10.4 10.4 0 00-6.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
                </svg>
              </div>
              <div className="download-body">
                <span className="download-label">Get it on</span>
                <span className="download-platform">Android</span>
                <span className="download-meta">
                  Version {androidRelease.version}
                </span>
              </div>
              <span className="download-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ) : (
            <div className="download-card disabled">
              <div className="download-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="44"
                  height="44"
                  style={{ opacity: 0.5 }}
                >
                  <path d="M17.6 9.48l1.84-3.18a.4.4 0 10-.69-.4l-1.87 3.23a11.4 11.4 0 00-9.76 0L5.25 5.9a.4.4 0 10-.69.4L6.4 9.48A10.4 10.4 0 000 18h24a10.4 10.4 0 00-6.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
                </svg>
              </div>
              <div className="download-body">
                <span className="download-label">Coming Soon</span>
                <span
                  className="download-platform"
                  style={{ color: "var(--text-muted)" }}
                >
                  Android
                </span>
                <span
                  className="download-meta"
                  style={{ color: "var(--text-muted)" }}
                >
                  Not available yet
                </span>
              </div>
            </div>
          )}

          {/* ================= iOS ================= */}
          {loading ? (
            <div className="download-card loading-state">Checking...</div>
          ) : iosRelease ? (
            <a
              href={iosRelease.driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="download-card"
            >
              <div className="download-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="44"
                  height="44"
                >
                  <path d="M16.36 12.79c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.73-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.87-.76-1.48.02-2.84.86-3.6 2.18-1.54 2.67-.39 6.62 1.1 8.79.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.18-.02 1.93-1.08 2.65-2.14.83-1.22 1.17-2.4 1.19-2.46-.03-.01-2.28-.88-2.28-3.56zM14.2 6.14c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z" />
                </svg>
              </div>
              <div className="download-body">
                <span className="download-label">Download on the</span>
                <span className="download-platform">iOS</span>
                <span className="download-meta">
                  Version {iosRelease.version}
                </span>
              </div>
              <span className="download-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ) : (
            <div className="download-card disabled">
              <div className="download-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="44"
                  height="44"
                  style={{ opacity: 0.5 }}
                >
                  <path d="M16.36 12.79c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.73-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.87-.76-1.48.02-2.84.86-3.6 2.18-1.54 2.67-.39 6.62 1.1 8.79.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.18-.02 1.93-1.08 2.65-2.14.83-1.22 1.17-2.4 1.19-2.46-.03-.01-2.28-.88-2.28-3.56zM14.2 6.14c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z" />
                </svg>
              </div>
              <div className="download-body">
                <span className="download-label">Coming Soon</span>
                <span
                  className="download-platform"
                  style={{ color: "var(--text-muted)" }}
                >
                  iOS
                </span>
                <span
                  className="download-meta"
                  style={{ color: "var(--text-muted)" }}
                >
                  Not available yet
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Home;
