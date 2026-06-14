import { useEffect, useState } from "react";
import { createWeeklyLog, getWeeklyLogs, getPlacement, submitLogToAcademic } from "../../services/api";
import styles from "./SubmitLogPage.module.css";

const PAGE_SIZE = 5;

function SubmitLogPage() {
  const [logs, setLogs] = useState([]);
  const [placement, setPlacement] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    description: "",
    hours_spent: "",
    challenges: "",
    activities: "",
    learning: "",
    week_number: "",
    attachment: null,
  });

  const fetchPlacement = async () => {
    try {
      const response = await getPlacement();
      console.log("Placement API response:", response.data); // Debug log
      if (response.data && response.data.length > 0) {
        const placementData = response.data[0];
        console.log("Placement data:", placementData); // Debug log
        setPlacement(placementData);
      } else {
        console.log("No placement found for student");
        setPlacement(null);
      }
    } catch (err) {
      console.error("Failed to fetch placement:", err);
      setError("Failed to load placement information. Please try again.");
      setPlacement(null);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await getWeeklyLogs();
      setLogs(response.data || []);
    } catch (err) {
      setError("Failed to fetch logs.");
    }
  };

  useEffect(() => {
    fetchPlacement();
    fetchLogs();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [logs, currentPage]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if placement exists and is approved
    if (!placement) {
      setError("You don't have a placement yet. Please submit a placement request from the Dashboard first.");
      return;
    }
    
    if (!(placement.status === 'approved' || placement.status === 'active')) {
      setError(`Your placement status is "${placement.status}". You need an approved or active placement to submit logs.`);
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();
      
      // Required fields
      if (!formData.week_number) {
        throw new Error("Week number is required");
      }
      if (!formData.hours_spent) {
        throw new Error("Hours spent is required");
      }
      if (!formData.activities) {
        throw new Error("Activities description is required");
      }
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "" && value !== null) {
          payload.append(key, value);
        }
      });

      console.log("Submitting log with data:", Object.fromEntries(payload)); // Debug log
      
      const response = await createWeeklyLog(payload);
      console.log("Log submission response:", response.data); // Debug log
      
      setSuccess("Log submitted successfully.");
      
      // Reset form
      setFormData({
        description: "",
        hours_spent: "",
        challenges: "",
        activities: "",
        learning: "",
        week_number: "",
        attachment: null,
      });
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      setCurrentPage(1);
      fetchLogs();
    } catch (err) {
      console.error("Submit log error:", err);
      if (err.response?.data) {
        const msg = Object.values(err.response.data).flat().join(", ");
        setError(`Submission failed: ${msg}`);
      } else if (err.message) {
        setError(`Submission failed: ${err.message}`);
      } else {
        setError("Failed to submit log. Please check your internet connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToAcademic = async (logId) => {
    if (!window.confirm('Are you sure you want to submit this log to your academic supervisor for evaluation?')) {
      return;
    }

    try {
      await submitLogToAcademic(logId);
      setSuccess('Log submitted to academic supervisor successfully!');
      fetchLogs();
    } catch (err) {
      console.error('Submit to academic error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to submit log to academic supervisor.');
      }
    }
  };

  const totalLogs = logs.length;
  const pendingLogs = logs.filter((log) =>
    ["DRAFT", "SUBMITTED", "AUTHORIZED", "PENDING_EVALUATION"].includes(
      String(log.status || "").toUpperCase()
    )
  ).length;
  const evaluatedLogs = logs.filter(
    (log) => String(log.status || "").toUpperCase() === "EVALUATED"
  ).length;

  const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedLogs = logs.slice(start, start + PAGE_SIZE);

  const statusClassMap = {
    EVALUATED: styles.approved,
    PENDING_EVALUATION: styles.reviewed,
    AUTHORIZED: styles.reviewed,
    SUBMITTED: styles.pending,
    DRAFT: styles.pending,
  };

  const canSubmitLog = placement && (placement.status === 'approved' || placement.status === 'active');
  
  // Debug log to help identify issues
  console.log("Placement state:", placement);
  console.log("Can submit log:", canSubmitLog);

  return (
    <div className={styles.page}>
      <div className={styles.headerBlock}>
        <h2 className={styles.title}>Student Dashboard</h2>
        <p className={styles.subtitle}>
          Welcome, <strong>{localStorage.getItem("username") || "John Doe"}</strong> | Your Internship Progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.green}`}>
          <p className={styles.cardValue}>{totalLogs}</p>
          <p className={styles.cardLabel}>Total Logs</p>
          <p className={styles.cardSubLabel}>Submitted Logs</p>
        </div>
        <div className={`${styles.card} ${styles.yellow}`}>
          <p className={styles.cardValue}>{pendingLogs}</p>
          <p className={styles.cardLabel}>Pending Reviews</p>
          <p className={styles.cardSubLabel}>Logs Pending</p>
        </div>
        <div className={`${styles.card} ${styles.blue}`}>
          <p className={styles.cardValue}>{evaluatedLogs}</p>
          <p className={styles.cardLabel}>Evaluated Logs</p>
          <p className={styles.cardSubLabel}>Logs Evaluated</p>
        </div>
      </div>

      {/* My Internship Logs Table */}
      <div className={styles.logsSection}>
        <h3 className={styles.sectionTitle}>My Internship Logs</h3>
        
        {logs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No logs yet. Submit your first log using the form below.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date ↓</th>
                  <th>Week</th>
                  <th>Description</th>
                  <th>Hours ↓</th>
                  <th>Status ↓</th>
                  <th>Workplace Review</th>
                  <th>Academic Evaluation</th>
                  <th>Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => {
                  const status = String(log.status || "PENDING").toUpperCase();
                  return (
                    <tr key={log.id}>
                      <td>{log.log_date || "-"}</td>
                      <td>{log.week_number || "-"}</td>
                      <td>{log.activities || log.description || "-"}</td>
                      <td>{log.hours_spent || 0}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${statusClassMap[status] || styles.pending}`}>
                          {status === "SUBMITTED" ? "Awaiting Workplace Review" : 
                           status === "AUTHORIZED" ? "Ready for Academic Submission" :
                           status === "PENDING_EVALUATION" ? "Pending Academic Evaluation" :
                           status === "EVALUATED" ? "Evaluated" : status}
                        </span>
                      </td>
                      <td>
                        {log.workplace_supervisor_comment ? (
                          <div style={{fontSize: '0.85rem'}}>
                            <strong>{log.workplace_reviewer_name || 'Supervisor'}</strong>
                            <p>{log.workplace_supervisor_comment}</p>
                          </div>
                        ) : "-"}
                      </td>
                      <td>
                        {log.academic_supervisor_comment ? (
                          <div style={{fontSize: '0.85rem'}}>
                            <strong>{log.academic_evaluator_name || 'Academic'}</strong>
                            <p>{log.academic_supervisor_comment}</p>
                          </div>
                        ) : "-"}
                      </td>
                      <td>
                        {log.marks_awarded ? (
                          <strong style={{color: '#10b981'}}>{log.marks_awarded}</strong>
                        ) : "-"}
                      </td>
                      <td>
                        {status === "AUTHORIZED" && (
                          <button
                            className={styles.submitToAcademicBtn}
                            onClick={() => handleSubmitToAcademic(log.id)}
                            title="Submit to Academic Supervisor"
                          >
                            Submit to Academic
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Showing {start + 1} to {Math.min(start + PAGE_SIZE, totalLogs)} of {totalLogs} entries
              </span>
              <div className={styles.pageButtons}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`${styles.pageBtn} ${page === currentPage ? styles.activePage : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Log Form - Below the table */}
      <div className={styles.submitSection}>
        <h3 className={styles.sectionTitle}>Submit New Log</h3>
        
        {!canSubmitLog && (
          <div className={styles.warningBox}>
            <p>⚠️ You must have an approved internship placement before you can submit logs.</p>
            <p>Please go to the Dashboard to submit your placement request first.</p>
          </div>
        )}

        {error && <div className={styles.errorAlert}>{error}</div>}
        {success && <div className={styles.successAlert}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Week Number *</label>
              <input
                type="number"
                name="week_number"
                min="1"
                placeholder="e.g., 1"
                value={formData.week_number}
                onChange={handleChange}
                disabled={!canSubmitLog}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Hours Spent *</label>
              <input
                type="number"
                name="hours_spent"
                min="0.5"
                max="60"
                step="0.5"
                placeholder="e.g., 8"
                value={formData.hours_spent}
                onChange={handleChange}
                disabled={!canSubmitLog}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Activities (What you did this week) *</label>
            <textarea
              name="activities"
              placeholder="Describe your activities..."
              value={formData.activities}
              onChange={handleChange}
              disabled={!canSubmitLog}
              rows="4"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description (Optional)</label>
            <textarea
              name="description"
              placeholder="Additional description..."
              value={formData.description}
              onChange={handleChange}
              disabled={!canSubmitLog}
              rows="3"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Challenges (Optional)</label>
              <textarea
                name="challenges"
                placeholder="Any challenges faced..."
                value={formData.challenges}
                onChange={handleChange}
                disabled={!canSubmitLog}
                rows="3"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Learning (Optional)</label>
              <textarea
                name="learning"
                placeholder="What you learned..."
                value={formData.learning}
                onChange={handleChange}
                disabled={!canSubmitLog}
                rows="3"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Attachment (Optional)</label>
            <input
              type="file"
              name="attachment"
              onChange={handleChange}
              disabled={!canSubmitLog}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !canSubmitLog}
            className={styles.submitBtn}
          >
            {loading ? "Submitting..." : "Submit Log"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SubmitLogPage;
