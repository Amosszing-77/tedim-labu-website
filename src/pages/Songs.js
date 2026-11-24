import { useState, useEffect, useMemo, useCallback } from "react";
import { songApi } from "../services/api";
import "../styles/Songs.css";

const CATEGORIES = ["All", "8th Edition", "9th Edition"];
const SONGS_PER_PAGE = 30;

// Helper to convert any Google Drive link into an embeddable preview link
const getDrivePreviewLink = (url) => {
  if (!url) return "";
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return url;
};

// Helper to convert a Google Drive link into a direct download link
const getDriveDownloadLink = (url) => {
  if (!url) return "";
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
};

function Songs() {
  // ============================================================
  // ALL HOOKS FIRST
  // ============================================================
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingSong, setViewingSong] = useState(null);

  // ----- LOAD (published only) -----
  const loadSongs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Axios returns the response data directly because of our interceptor
      const res = await songApi.list({ status: "Published" });
      const list = Array.isArray(res.data) ? res.data : [];
      setSongs(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // ----- FILTER -----
  const filteredSongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return songs.filter((s) => {
      const matchesCategory =
        activeCategory === "All" || s.category === activeCategory;
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.songNumber.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [songs, activeCategory, search]);

  // ----- PAGINATION -----
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSongs.length / SONGS_PER_PAGE),
  );

  const paginatedSongs = useMemo(() => {
    const start = (currentPage - 1) * SONGS_PER_PAGE;
    return filteredSongs.slice(start, start + SONGS_PER_PAGE);
  }, [filteredSongs, currentPage]);

  const pageNumbers = useMemo(() => {
    const total = totalPages;
    const current = currentPage;
    const maxVisible = 5;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(1, current - 2);
    let end = start + maxVisible - 1;

    if (end > total) {
      end = total;
      start = end - maxVisible + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory]);

  // Clamp page
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // ----- HANDLERS -----
  const goToPage = (page) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownload = (song) => {
    // Forces direct download by opening the Google Drive direct download link
    window.open(
      getDriveDownloadLink(song.driveLink),
      "_blank",
      "noopener,noreferrer",
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <main className="songs-page">
      <div className="songs-container">
        {/* ===== HEADER ===== */}
        <header className="songs-header">
          <h1 className="songs-title">Song Library</h1>
          <p className="songs-subtitle">
            Browse, view, and download PDFs by edition.
          </p>
        </header>

        {/* ===== TOOLBAR ===== */}
        <div className="songs-toolbar">
          <div className="category-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${
                  activeCategory === cat ? "active" : ""
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                {cat !== "All" && (
                  <span className="tab-count">
                    {songs.filter((s) => s.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <input
            type="text"
            className="form-input songs-search"
            placeholder="🔍 Search by title or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ===== CONTENT ===== */}
        {loading ? (
          <div className="empty-state">
            <span className="empty-icon">⏳</span>
            <p>Loading songs...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>
            <p>{error}</p>
            <button
              className="btn-download"
              style={{ marginTop: "1rem", maxWidth: "180px" }}
              onClick={loadSongs}
            >
              Retry
            </button>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎵</span>
            <p>
              {songs.length === 0
                ? "No published songs yet. Ask an admin to publish some!"
                : "No songs match your filters."}
            </p>
          </div>
        ) : (
          <>
            <div className="song-list">
              {paginatedSongs.map((song) => (
                <article className="song-item" key={song._id}>
                  {/* Left: number */}
                  <div className="song-item-number">#{song.songNumber}</div>

                  {/* Middle: title + meta */}
                  <div className="song-item-main">
                    <h3 className="song-item-title">{song.title}</h3>
                    <div className="song-item-meta">
                      <span
                        className={`category-badge ${
                          song.category === "8th Edition" ? "cat-8" : "cat-9"
                        }`}
                      >
                        {song.category}
                      </span>
                      <span className="song-item-file">📄 PDF Document</span>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="song-item-actions">
                    <button
                      className="btn-view"
                      onClick={() => setViewingSong(song)}
                    >
                      👁 View
                    </button>
                    <a
                      href={getDriveDownloadLink(song.driveLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download"
                    >
                      ⬇ Download
                    </a>
                  </div>
                </article>
              ))}
            </div>

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ← Prev
                </button>

                <div className="page-numbers">
                  {pageNumbers[0] > 1 && (
                    <>
                      <button className="page-num" onClick={() => goToPage(1)}>
                        1
                      </button>
                      {pageNumbers[0] > 2 && (
                        <span className="page-ellipsis">…</span>
                      )}
                    </>
                  )}

                  {pageNumbers.map((n) => (
                    <button
                      key={n}
                      className={`page-num ${
                        n === currentPage ? "active" : ""
                      }`}
                      onClick={() => goToPage(n)}
                    >
                      {n}
                    </button>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                        <span className="page-ellipsis">…</span>
                      )}
                      <button
                        className="page-num"
                        onClick={() => goToPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </div>
            )}

            <p className="pagination-info">
              Showing{" "}
              <strong>
                {(currentPage - 1) * SONGS_PER_PAGE + 1}–
                {Math.min(currentPage * SONGS_PER_PAGE, filteredSongs.length)}
              </strong>{" "}
              of <strong>{filteredSongs.length}</strong> songs
            </p>
          </>
        )}
      </div>

      {/* ===== PDF MODAL ===== */}
      {viewingSong && (
        <div
          className="pdf-modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("pdf-modal-overlay")) {
              setViewingSong(null);
            }
          }}
        >
          <div className="pdf-modal">
            <div className="pdf-modal-head">
              <div>
                <h2 className="pdf-modal-title">{viewingSong.title}</h2>
                <p className="pdf-modal-sub">
                  {viewingSong.category} · #{viewingSong.songNumber}
                </p>
              </div>
              <div className="pdf-modal-actions">
                <a
                  href={getDriveDownloadLink(viewingSong.driveLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-download small"
                  style={{ display: "inline-block", textAlign: "center" }}
                >
                  ⬇ Download
                </a>
                <button
                  className="pdf-modal-close"
                  onClick={() => setViewingSong(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="pdf-modal-body">
              <iframe
                src={getDrivePreviewLink(viewingSong.driveLink)}
                title={viewingSong.title}
                className="pdf-frame"
                allow="autoplay"
              />
            </div>

            <div className="pdf-modal-foot">
              <a
                href={viewingSong.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="pdf-open-link"
              >
                🔗 Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Songs;
