import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { songApi, releaseApi } from "../services/api";
import "../styles/Admin.css";

const CATEGORIES = ["8th Edition", "9th Edition"];
const PLATFORMS = ["Android", "iOS"];
const SONGS_PER_PAGE = 10;

function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // ============================================================
  // ALL HOOKS FIRST
  // ============================================================

  // ----- SONG STATE -----
  const [songs, setSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [songsError, setSongsError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    songNumber: "",
    category: CATEGORIES[0],
    driveLink: "", // Changed from pdfFile to driveLink
  });
  const [formError, setFormError] = useState("");
  const [submittingSong, setSubmittingSong] = useState(false);

  // ----- RELEASE STATE -----
  const [releases, setReleases] = useState([]);
  const [releasesLoading, setReleasesLoading] = useState(true);
  const [releasesError, setReleasesError] = useState("");

  const [showReleaseForm, setShowReleaseForm] = useState(false);
  const [editingReleaseId, setEditingReleaseId] = useState(null);
  const [releaseData, setReleaseData] = useState({
    platform: PLATFORMS[0],
    version: "",
    build: "",
    notes: "",
    driveLink: "",
  });
  const [releaseError, setReleaseError] = useState("");
  const [submittingRelease, setSubmittingRelease] = useState(false);

  // ----- GUARD -----
  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  // ----- LOADERS -----
  const loadSongs = useCallback(async () => {
    setSongsLoading(true);
    setSongsError("");
    try {
      const { data } = await songApi.list();
      setSongs(data);
    } catch (err) {
      setSongsError(err.message);
    } finally {
      setSongsLoading(false);
    }
  }, []);

  const loadReleases = useCallback(async () => {
    setReleasesLoading(true);
    setReleasesError("");
    try {
      const { data } = await releaseApi.list();
      setReleases(data);
    } catch (err) {
      setReleasesError(err.message);
    } finally {
      setReleasesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadSongs();
      loadReleases();
    }
  }, [isAdmin, loadSongs, loadReleases]);

  // ----- FILTER & PAGINATION -----
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
  }, [songs, search, activeCategory]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // ============================================================
  // EARLY RETURN
  // ============================================================
  if (!isAdmin) return null;

  // ============================================================
  // DERIVED VALUES
  // ============================================================
  const totalSongs = songs.length;
  const publishedCount = songs.filter((s) => s.status === "Published").length;
  const draftCount = songs.filter((s) => s.status === "Draft").length;

  // ============================================================
  // SONG HANDLERS
  // ============================================================
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormError("");
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    const { title, songNumber, category, driveLink } = formData;

    if (!title.trim() || !songNumber.trim() || !driveLink.trim()) {
      setFormError("Title, song number, and Drive link are all required.");
      return;
    }

    setSubmittingSong(true);
    setFormError("");

    try {
      // ✅ PASS A JSON OBJECT
      const { data } = await songApi.create({
        title: title.trim(),
        songNumber: songNumber.trim(),
        category,
        driveLink: driveLink.trim(),
      });

      setSongs([data, ...songs]);
      setFormData({
        title: "",
        songNumber: "",
        category: CATEGORIES[0],
        driveLink: "",
      });
      setShowForm(false);
      setCurrentPage(1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmittingSong(false);
    }
  };

  const handleDeleteSong = async (id) => {
    if (!window.confirm("Delete this song?")) return;
    try {
      await songApi.delete(id);
      setSongs(songs.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleSongStatus = async (id) => {
    try {
      const { data } = await songApi.toggleStatus(id);
      setSongs(songs.map((s) => (s._id === id ? data : s)));
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================
  // RELEASE HANDLERS
  // ============================================================
  const handleReleaseChange = (e) => {
    const { name, value } = e.target;
    setReleaseData({ ...releaseData, [name]: value });
    setReleaseError("");
  };

  const openNewReleaseForm = () => {
    setEditingReleaseId(null);
    setReleaseData({
      platform: PLATFORMS[0],
      version: "",
      build: "",
      notes: "",
      driveLink: "",
    });
    setReleaseError("");
    setShowReleaseForm(true);
  };

  const openEditReleaseForm = (release) => {
    setEditingReleaseId(release._id);
    setReleaseData({
      platform: release.platform,
      version: release.version,
      build: release.build,
      notes: release.notes,
      driveLink: release.driveLink,
    });
    setReleaseError("");
    setShowReleaseForm(true);
  };

  const handleSaveRelease = async (e) => {
    e.preventDefault();
    const { platform, version, build, notes, driveLink } = releaseData;

    if (!version.trim() || !driveLink.trim()) {
      setReleaseError("Version and Google Drive link are required.");
      return;
    }
    if (!/^https?:\/\//i.test(driveLink.trim())) {
      setReleaseError("Please enter a valid URL (starting with https://).");
      return;
    }

    setSubmittingRelease(true);
    setReleaseError("");

    try {
      const payload = {
        platform,
        version: version.trim(),
        build: build.trim(),
        notes: notes.trim(),
        driveLink: driveLink.trim(),
      };

      if (editingReleaseId) {
        const { data } = await releaseApi.update(editingReleaseId, payload);
        setReleases(
          releases.map((r) => (r._id === editingReleaseId ? data : r)),
        );
      } else {
        const { data } = await releaseApi.create(payload);
        setReleases([data, ...releases]);
      }

      setShowReleaseForm(false);
      setEditingReleaseId(null);
    } catch (err) {
      setReleaseError(err.message);
    } finally {
      setSubmittingRelease(false);
    }
  };

  const handleDeleteRelease = async (id) => {
    if (!window.confirm("Delete this release?")) return;
    try {
      await releaseApi.delete(id);
      setReleases(releases.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleReleaseStatus = async (id) => {
    try {
      const { data } = await releaseApi.toggleStatus(id);
      setReleases(releases.map((r) => (r._id === id ? data : r)));
    } catch (err) {
      alert(err.message);
    }
  };

  const goToPage = (page) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(clamped);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <main className="admin">
      <div className="admin-container">
        {/* ===== PAGE HEADER ===== */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">
              Manage songs and app releases from one place.
            </p>
          </div>
        </header>

        {/* =====================================================
            SONGS SECTION
            ===================================================== */}
        <section className="admin-section">
          <div className="section-head">
            <div>
              <h2 className="section-heading">🎵 Songs</h2>
              <p className="section-desc">
                Upload titles, song numbers, categories, and Drive links.
              </p>
            </div>
            <button
              className="btn-modal-gold admin-action-btn"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "✕ Cancel" : "+ Upload Song"}
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Songs</span>
              <span className="stat-value">{totalSongs}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Published</span>
              <span className="stat-value stat-gold">{publishedCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Drafts</span>
              <span className="stat-value">{draftCount}</span>
            </div>
          </div>

          {showForm && (
            <section className="upload-card">
              <h2 className="upload-title">Add New Song</h2>
              <form className="upload-form" onSubmit={handleAddSong}>
                <div className="form-row">
                  <label className="form-field">
                    <span className="form-label">Song Title *</span>
                    <input
                      name="title"
                      className="form-input"
                      placeholder="e.g. Midnight Dreams"
                      value={formData.title}
                      onChange={handleFormChange}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Song Number *</span>
                    <input
                      name="songNumber"
                      className="form-input"
                      placeholder="e.g. 001"
                      value={formData.songNumber}
                      onChange={handleFormChange}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label className="form-field">
                    <span className="form-label">Category *</span>
                    <select
                      name="category"
                      className="form-input form-select"
                      value={formData.category}
                      onChange={handleFormChange}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span className="form-label">Google Drive Link *</span>
                    <input
                      name="driveLink"
                      className="form-input"
                      placeholder="https://drive.google.com/file/d/..."
                      value={formData.driveLink}
                      onChange={handleFormChange}
                    />
                  </label>
                </div>

                {formError && <p className="form-error">{formError}</p>}

                <button
                  type="submit"
                  className="btn-modal-gold"
                  disabled={submittingSong}
                >
                  {submittingSong ? "Saving..." : "Save Song"}
                </button>
              </form>
            </section>
          )}

          <div className="category-tabs">
            {["All", ...CATEGORIES].map((cat) => (
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

          <div className="song-list-header">
            <h2 className="section-title-sm">Song Library</h2>
            <input
              type="text"
              className="form-input search-input"
              placeholder="🔍 Search by title or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {songsLoading ? (
            <div className="empty-state">
              <span className="empty-icon">⏳</span>
              <p>Loading songs...</p>
            </div>
          ) : songsError ? (
            <div className="empty-state">
              <span className="empty-icon">⚠️</span>
              <p>{songsError}</p>
              <button
                className="btn-modal-gold"
                style={{ marginTop: "1rem" }}
                onClick={loadSongs}
              >
                Retry
              </button>
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🎵</span>
              <p>No songs found.</p>
            </div>
          ) : (
            <>
              <div className="song-table">
                <div className="song-row song-row-head">
                  <span>Song #</span>
                  <span>Title</span>
                  <span>Category</span>
                  <span>PDF</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {paginatedSongs.map((song) => (
                  <div className="song-row" key={song._id}>
                    <span className="song-number">{song.songNumber}</span>
                    <span className="song-title">{song.title}</span>
                    <span>
                      <span
                        className={`category-badge ${
                          song.category === "8th Edition" ? "cat-8" : "cat-9"
                        }`}
                      >
                        {song.category}
                      </span>
                    </span>
                    <span className="song-pdf">
                      <a
                        href={song.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-link"
                      >
                        📄 Open PDF
                      </a>
                    </span>
                    <span>
                      <button
                        className={`status-pill ${
                          song.status === "Published" ? "published" : "draft"
                        }`}
                        onClick={() => toggleSongStatus(song._id)}
                      >
                        {song.status}
                      </button>
                    </span>
                    <span className="song-actions">
                      <button
                        className="action-btn danger"
                        onClick={() => handleDeleteSong(song._id)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              {/* PAGINATION */}
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
                        <button
                          className="page-num"
                          onClick={() => goToPage(1)}
                        >
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
                        {pageNumbers[pageNumbers.length - 1] <
                          totalPages - 1 && (
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
        </section>

        {/* =====================================================
            RELEASES SECTION
            ===================================================== */}
        <section className="admin-section">
          <div className="section-head">
            <div>
              <h2 className="section-heading">📱 App Releases</h2>
              <p className="section-desc">
                Publish new APK / IPA versions with Google Drive links.
              </p>
            </div>
            <button
              className="btn-modal-gold admin-action-btn"
              onClick={() =>
                showReleaseForm && !editingReleaseId
                  ? setShowReleaseForm(false)
                  : openNewReleaseForm()
              }
            >
              {showReleaseForm && !editingReleaseId
                ? "✕ Cancel"
                : "+ New Release"}
            </button>
          </div>

          {showReleaseForm && (
            <section className="upload-card">
              <h2 className="upload-title">
                {editingReleaseId ? "Update Release" : "Publish New Release"}
              </h2>
              <form className="upload-form" onSubmit={handleSaveRelease}>
                <div className="form-row">
                  <label className="form-field">
                    <span className="form-label">Platform *</span>
                    <select
                      name="platform"
                      className="form-input form-select"
                      value={releaseData.platform}
                      onChange={handleReleaseChange}
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span className="form-label">Version *</span>
                    <input
                      name="version"
                      className="form-input"
                      placeholder="e.g. 1.2.0"
                      value={releaseData.version}
                      onChange={handleReleaseChange}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label className="form-field">
                    <span className="form-label">Build Number</span>
                    <input
                      name="build"
                      className="form-input"
                      placeholder="e.g. 42 (optional)"
                      value={releaseData.build}
                      onChange={handleReleaseChange}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Google Drive Link *</span>
                    <input
                      name="driveLink"
                      className="form-input"
                      placeholder="https://drive.google.com/file/d/..."
                      value={releaseData.driveLink}
                      onChange={handleReleaseChange}
                    />
                  </label>
                </div>

                <label className="form-field">
                  <span className="form-label">Release Notes</span>
                  <textarea
                    name="notes"
                    className="form-input form-textarea"
                    placeholder="What's new in this version..."
                    rows={3}
                    value={releaseData.notes}
                    onChange={handleReleaseChange}
                  />
                </label>

                {releaseError && <p className="form-error">{releaseError}</p>}

                <button
                  type="submit"
                  className="btn-modal-gold"
                  disabled={submittingRelease}
                >
                  {submittingRelease
                    ? "Saving..."
                    : editingReleaseId
                      ? "Update Release"
                      : "Publish Release"}
                </button>
              </form>
            </section>
          )}

          {releasesLoading ? (
            <div className="empty-state">
              <span className="empty-icon">⏳</span>
              <p>Loading releases...</p>
            </div>
          ) : releasesError ? (
            <div className="empty-state">
              <span className="empty-icon">⚠️</span>
              <p>{releasesError}</p>
              <button
                className="btn-modal-gold"
                style={{ marginTop: "1rem" }}
                onClick={loadReleases}
              >
                Retry
              </button>
            </div>
          ) : releases.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📱</span>
              <p>No releases yet. Click "New Release" to add one.</p>
            </div>
          ) : (
            <div className="release-list">
              {releases.map((release) => (
                <div className="release-card" key={release._id}>
                  <div className="release-card-head">
                    <span
                      className={`platform-badge ${
                        release.platform === "Android"
                          ? "platform-android"
                          : "platform-ios"
                      }`}
                    >
                      {release.platform === "Android" ? "🤖" : "🍎"}{" "}
                      {release.platform}
                    </span>
                    <button
                      className={`status-pill ${
                        release.status === "Published" ? "published" : "draft"
                      }`}
                      onClick={() => toggleReleaseStatus(release._id)}
                    >
                      {release.status}
                    </button>
                  </div>

                  <div className="release-version-row">
                    <span className="release-version">v{release.version}</span>
                    {release.build && (
                      <span className="release-build">
                        build {release.build}
                      </span>
                    )}
                  </div>

                  {release.notes && (
                    <p className="release-notes">{release.notes}</p>
                  )}

                  <div className="release-footer">
                    <a
                      href={release.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="drive-link"
                      title={release.driveLink}
                    >
                      🔗 Open Drive Link
                    </a>
                    <div className="release-actions">
                      <button
                        className="action-btn"
                        onClick={() => openEditReleaseForm(release)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => handleDeleteRelease(release._id)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  <span className="release-date">
                    Released{" "}
                    {new Date(release.createdAt).toISOString().slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Admin;
