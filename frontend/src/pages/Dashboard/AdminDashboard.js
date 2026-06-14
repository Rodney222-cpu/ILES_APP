import { useEffect, useState } from 'react';
import { getPendingPlacements, approvePlacement, rejectPlacement, assignSupervisor, getSupervisors, getPlacement, getActivePlacements, getCompletedPlacements, getPlacementStats, markPlacementCompleted } from '../../services/api';
import styles from './AdminDashboard.module.css';

function AdminDashboard() {
  const [pendingPlacements, setPendingPlacements] = useState([]);
  const [approvedPlacements, setApprovedPlacements] = useState([]);
  const [activePlacements, setActivePlacements] = useState([]);
  const [completedPlacements, setCompletedPlacements] = useState([]);
  const [stats, setStats] = useState({ pending_approval: 0, approved: 0, active: 0, completed: 0, rejected: 0, total: 0 });
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'approve', 'reject', 'assign', 'view'
  const [adminComment, setAdminComment] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchPlacements = async () => {
    try {
      // Fetch pending placements
      const pendingResponse = await getPendingPlacements();
      setPendingPlacements(pendingResponse.data || []);
      
      // Fetch approved placements (awaiting supervisor)
      const allResponse = await getPlacement();
      const approved = (allResponse.data || []).filter(p => p.status === 'approved');
      setApprovedPlacements(approved);

      // Fetch active placements
      const activeResponse = await getActivePlacements();
      setActivePlacements(activeResponse.data || []);

      // Fetch completed placements
      const completedResponse = await getCompletedPlacements();
      setCompletedPlacements(completedResponse.data || []);

      // Fetch stats
      const statsResponse = await getPlacementStats();
      setStats(statsResponse.data || {});
    } catch (err) {
      setError('Failed to load placements');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await getSupervisors();
      console.log('Supervisors fetched:', response.data);
      setSupervisors(response.data || []);
      if (!response.data || response.data.length === 0) {
        console.warn('No academic supervisors found in the system');
      }
    } catch (err) {
      console.error('Failed to load supervisors:', err);
      console.error('Supervisor error response:', err.response?.data);
      setError('Failed to load supervisors. Please check your permissions.');
    }
  };

  useEffect(() => {
    fetchPlacements();
    fetchSupervisors();
  }, []);

  const openModal = (placement, type) => {
    setSelectedPlacement(placement);
    setModalType(type);
    setShowModal(true);
    setAdminComment('');
    setSelectedSupervisor('');
    setMessage('');
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlacement(null);
    setModalType('');
    setAdminComment('');
    setSelectedSupervisor('');
  };

  const handleApprove = async () => {
    try {
      const response = await approvePlacement(selectedPlacement.id, { admin_comment: adminComment });
      
      // Optimistic update: immediately move placement from pending to approved
      const approvedPlacement = response.data?.placement || {
        ...selectedPlacement,
        status: 'approved',
        admin_comment: adminComment,
        approved_at: new Date().toISOString()
      };
      
      setPendingPlacements(prev => prev.filter(p => p.id !== selectedPlacement.id));
      setApprovedPlacements(prev => [...prev, approvedPlacement]);
      setStats(prev => ({
        ...prev,
        pending_approval: Math.max(0, (prev.pending_approval || 0) - 1),
        approved: (prev.approved || 0) + 1,
      }));
      
      setMessage('Placement approved successfully!');
      closeModal();
      
      // Background sync with server to ensure consistency
      try {
        await fetchPlacements();
      } catch (syncErr) {
        console.error('Background sync failed after approval:', syncErr);
      }
    } catch (err) {
      console.error('Approve placement error:', err);
      setError('Failed to approve placement');
    }
  };

  const handleReject = async () => {
    if (!adminComment.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectPlacement(selectedPlacement.id, { admin_comment: adminComment });
      
      // Optimistic update: remove from pending placements
      setPendingPlacements(prev => prev.filter(p => p.id !== selectedPlacement.id));
      setStats(prev => ({
        ...prev,
        pending_approval: Math.max(0, (prev.pending_approval || 0) - 1),
        rejected: (prev.rejected || 0) + 1,
      }));
      
      setMessage('Placement rejected');
      closeModal();
      
      // Background sync
      try {
        await fetchPlacements();
      } catch (syncErr) {
        console.error('Background sync failed after rejection:', syncErr);
      }
    } catch (err) {
      console.error('Reject placement error:', err);
      setError('Failed to reject placement');
    }
  };

  const handleAssignSupervisor = async () => {
    if (!selectedSupervisor) {
      setError('Please select a supervisor');
      return;
    }
    
    // Convert to integer to ensure correct type
    const supervisorId = parseInt(selectedSupervisor, 10);
    
    console.log('Assigning supervisor:', {
      placementId: selectedPlacement.id,
      supervisorId: supervisorId,
      payload: { academic_supervisor_id: supervisorId }
    });
    
    try {
      const response = await assignSupervisor(selectedPlacement.id, { academic_supervisor_id: supervisorId });
      console.log('Supervisor assignment response:', response.data);
      
      // Optimistic update: move from approved to active
      setApprovedPlacements(prev => prev.filter(p => p.id !== selectedPlacement.id));
      setActivePlacements(prev => [...prev, { ...selectedPlacement, status: 'active', academic_supervisor_id: supervisorId }]);
      setStats(prev => ({
        ...prev,
        approved: Math.max(0, (prev.approved || 0) - 1),
        active: (prev.active || 0) + 1,
      }));
      
      setMessage('Academic supervisor assigned successfully!');
      setError('');
      closeModal();
      
      // Background sync
      try {
        await fetchPlacements();
      } catch (syncErr) {
        console.error('Background sync failed after supervisor assignment:', syncErr);
      }
    } catch (err) {
      console.error('Assign supervisor error:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.data) {
        const errorMsg = typeof err.response.data === 'string' 
          ? err.response.data 
          : JSON.stringify(err.response.data);
        setError(`Failed to assign supervisor: ${errorMsg}`);
      } else if (err.message) {
        setError(`Failed to assign supervisor: ${err.message}`);
      } else {
        setError('Failed to assign supervisor. Please check your connection and try again.');
      }
    }
  };

  const handleMarkCompleted = async () => {
    try {
      await markPlacementCompleted(selectedPlacement.id);
      
      // Optimistic update: move from active to completed
      setActivePlacements(prev => prev.filter(p => p.id !== selectedPlacement.id));
      setCompletedPlacements(prev => [...prev, { ...selectedPlacement, status: 'completed' }]);
      setStats(prev => ({
        ...prev,
        active: Math.max(0, (prev.active || 0) - 1),
        completed: (prev.completed || 0) + 1,
      }));
      
      setMessage('Internship marked as completed!');
      closeModal();
      
      // Background sync
      try {
        await fetchPlacements();
      } catch (syncErr) {
        console.error('Background sync failed after marking completed:', syncErr);
      }
    } catch (err) {
      console.error('Mark completed error:', err);
      setError('Failed to mark as completed');
    }
  };

  if (loading) {
    return <div className={styles.page}><p>Loading...</p></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Manage Internship Placements</p>
      </div>

      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Placements</div>
        </div>
        <div className={`${styles.statCard} ${styles.statPending}`}>
          <div className={styles.statValue}>{stats.pending_approval}</div>
          <div className={styles.statLabel}>Pending Approvals</div>
        </div>
        <div className={`${styles.statCard} ${styles.statApproved}`}>
          <div className={styles.statValue}>{stats.approved}</div>
          <div className={styles.statLabel}>Awaiting Supervisor</div>
        </div>
        <div className={`${styles.statCard} ${styles.statActive}`}>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>Active Internships</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCompleted}`}>
          <div className={styles.statValue}>{stats.completed}</div>
          <div className={styles.statLabel}>Completed Internships</div>
        </div>
      </div>

      {message && (
        <div className={styles.successAlert} style={{margin: '1rem 0'}}>
          {message}
          <button 
            onClick={() => setMessage('')} 
            style={{marginLeft: '1rem', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem'}}
          >
            ×
          </button>
        </div>
      )}
      {error && (
        <div className={styles.errorAlert} style={{margin: '1rem 0'}}>
          {error}
          <button 
            onClick={() => setError('')} 
            style={{marginLeft: '1rem', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem'}}
          >
            ×
          </button>
        </div>
      )}

      {/* End Date Alert for active internships that have passed their end date */}
      {activePlacements.filter(p => p.is_past_end_date).length > 0 && (
        <div className={styles.endDateAlert}>
          <strong>Internship End Date Reached:</strong> {activePlacements.filter(p => p.is_past_end_date).length} student(s) have reached their internship end date and are ready to be marked as completed.
          <ul>
            {activePlacements.filter(p => p.is_past_end_date).map(p => (
              <li key={p.id}>
                <strong>{p.student_username}</strong> — {p.company_name} (ended {p.end_date})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pending Placements Table */}
      <div className={styles.tableContainer}>
        <h3>Pending Placement Requests</h3>
        {pendingPlacements.length === 0 ? (
          <p className={styles.emptyState}>No pending placements</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Company</th>
                <th>Position</th>
                <th>Duration</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingPlacements.map((placement) => (
                <tr key={placement.id}>
                  <td>
                    <div className={styles.studentInfo}>
                      <div className={styles.avatar}>
                        {placement.student_username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.studentName}>{placement.student_username}</div>
                        <div className={styles.studentNumber}>{placement.student_number}</div>
                      </div>
                    </div>
                  </td>
                  <td>{placement.company_name}</td>
                  <td>{placement.position_title || 'N/A'}</td>
                  <td>
                    {placement.start_date} to {placement.end_date}
                  </td>
                  <td>{new Date(placement.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.btn} ${styles.btnView}`}
                        onClick={() => openModal(placement, 'view')}
                      >
                        View
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnApprove}`}
                        onClick={() => openModal(placement, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnReject}`}
                        onClick={() => openModal(placement, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Approved Placements - Awaiting Supervisor Assignment */}
      <div className={styles.tableContainer}>
        <h3>Approved Placements - Assign Supervisor</h3>
        {approvedPlacements.length === 0 ? (
          <p className={styles.emptyState}>No approved placements awaiting supervisor assignment</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Company</th>
                <th>Position</th>
                <th>Duration</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvedPlacements.map((placement) => (
                <tr key={placement.id}>
                  <td>
                    <div className={styles.studentInfo}>
                      <div className={styles.avatar}>
                        {placement.student_username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.studentName}>{placement.student_username}</div>
                        <div className={styles.studentNumber}>{placement.student_number}</div>
                      </div>
                    </div>
                  </td>
                  <td>{placement.company_name}</td>
                  <td>{placement.position_title || 'N/A'}</td>
                  <td>
                    {placement.start_date} to {placement.end_date}
                  </td>
                  <td>{placement.approved_at ? new Date(placement.approved_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.btn} ${styles.btnView}`}
                        onClick={() => openModal(placement, 'view')}
                      >
                        View
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnAssign}`}
                        onClick={() => openModal(placement, 'assign')}
                      >
                        Assign Supervisor
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Active Internships */}
      <div className={styles.tableContainer}>
        <h3>Active Internships</h3>
        {activePlacements.length === 0 ? (
          <p className={styles.emptyState}>No active internships</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Company</th>
                <th>Position</th>
                <th>Duration</th>
                <th>Academic Supervisor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activePlacements.map((placement) => (
                <tr key={placement.id}>
                  <td>
                    <div className={styles.studentInfo}>
                      <div className={`${styles.avatar} ${styles.avatarActive}`}>
                        {placement.student_username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.studentName}>{placement.student_username}</div>
                        <div className={styles.studentNumber}>{placement.student_number}</div>
                      </div>
                    </div>
                  </td>
                  <td>{placement.company_name}</td>
                  <td>{placement.position_title || 'N/A'}</td>
                  <td>
                    {placement.start_date} to {placement.end_date}
                  </td>
                  <td>{placement.academic_supervisor_username || 'N/A'}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={`${styles.btn} ${styles.btnView}`}
                        onClick={() => openModal(placement, 'view')}
                      >
                        View
                      </button>
                      {placement.is_past_end_date && (
                        <span className={styles.badgeEndDatePassed}>End Date Passed</span>
                      )}
                      <button
                        className={`${styles.btn} ${styles.btnComplete}`}
                        onClick={() => openModal(placement, 'complete')}
                      >
                        Mark Completed
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Completed Internships */}
      <div className={styles.tableContainer}>
        <h3>Completed Internships ({completedPlacements.length} students)</h3>
        {completedPlacements.length === 0 ? (
          <p className={styles.emptyState}>No completed internships yet</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Company</th>
                <th>Position</th>
                <th>Duration</th>
                <th>Academic Supervisor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {completedPlacements.map((placement) => (
                <tr key={placement.id}>
                  <td>
                    <div className={styles.studentInfo}>
                      <div className={`${styles.avatar} ${styles.avatarCompleted}`}>
                        {placement.student_username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.studentName}>{placement.student_username}</div>
                        <div className={styles.studentNumber}>{placement.student_number}</div>
                      </div>
                    </div>
                  </td>
                  <td>{placement.company_name}</td>
                  <td>{placement.position_title || 'N/A'}</td>
                  <td>
                    {placement.start_date} to {placement.end_date}
                  </td>
                  <td>{placement.academic_supervisor_username || 'N/A'}</td>
                  <td>
                    <span className={styles.badgeCompleted}>Completed</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedPlacement && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {modalType === 'view' && 'Placement Details'}
                {modalType === 'approve' && 'Approve Placement'}
                {modalType === 'reject' && 'Reject Placement'}
                {modalType === 'assign' && 'Assign Supervisor'}
                {modalType === 'complete' && 'Mark Internship as Completed'}
              </h3>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>

            <div className={styles.modalBody}>
              {/* Placement Details */}
              <div className={styles.detailsSection}>
                <h4>Student Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Name:</span>
                  <span>{selectedPlacement.student_username}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Student Number:</span>
                  <span>{selectedPlacement.student_number}</span>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h4>Company Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Company:</span>
                  <span>{selectedPlacement.company_name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Address:</span>
                  <span>{selectedPlacement.company_address || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Contact Person:</span>
                  <span>{selectedPlacement.company_contact_person || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Contact Email:</span>
                  <span>{selectedPlacement.company_contact_email || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Contact Phone:</span>
                  <span>{selectedPlacement.company_contact_phone || 'N/A'}</span>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h4>Position Details</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Position:</span>
                  <span>{selectedPlacement.position_title || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Department:</span>
                  <span>{selectedPlacement.department || 'N/A'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Start Date:</span>
                  <span>{selectedPlacement.start_date}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>End Date:</span>
                  <span>{selectedPlacement.end_date}</span>
                </div>
              </div>

              {/* Action Forms */}
              {modalType === 'approve' && (
                <div className={styles.actionForm}>
                  <label>Comment (Optional)</label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Add any comments..."
                    rows="3"
                  />
                  <div className={styles.actionFormButtons}>
                    <button className={styles.btnApprove} onClick={handleApprove}>
                      Confirm Approval
                    </button>
                    <button className={styles.btnCancel} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'reject' && (
                <div className={styles.actionForm}>
                  <label>Reason for Rejection *</label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Please provide a reason..."
                    rows="3"
                    required
                  />
                  <div className={styles.actionFormButtons}>
                    <button className={styles.btnReject} onClick={handleReject}>
                      Confirm Rejection
                    </button>
                    <button className={styles.btnCancel} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'assign' && (
                <div className={styles.actionForm}>
                  {error && <div className={styles.errorAlert} style={{marginBottom: '1rem'}}>{error}</div>}
                  <label>Select Academic Supervisor *</label>
                  <select
                    value={selectedSupervisor}
                    onChange={(e) => {
                      console.log('Supervisor selected:', e.target.value);
                      setSelectedSupervisor(e.target.value);
                      setError(''); // Clear error when selection changes
                    }}
                  >
                    <option value="">-- Select Supervisor --</option>
                    {supervisors.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.username} - {sup.department || 'N/A'}
                      </option>
                    ))}
                  </select>
                  {supervisors.length === 0 && (
                    <p style={{color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem'}}>
                      No academic supervisors available. Please create supervisor accounts first.
                    </p>
                  )}
                  <div className={styles.actionFormButtons}>
                    <button 
                      className={styles.btnApprove} 
                      onClick={handleAssignSupervisor}
                      disabled={!selectedSupervisor || supervisors.length === 0}
                    >
                      Assign Supervisor
                    </button>
                    <button className={styles.btnCancel} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'complete' && (
                <div className={styles.actionForm}>
                  <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
                    Are you sure you want to mark <strong>{selectedPlacement.student_username}</strong>'s internship at <strong>{selectedPlacement.company_name}</strong> as completed?
                  </p>
                  <div className={styles.actionFormButtons}>
                    <button className={styles.btnComplete} onClick={handleMarkCompleted}>
                      Confirm Completed
                    </button>
                    <button className={styles.btnCancel} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'view' && (
                <div className={styles.actionFormButtons}>
                  <button className={styles.btnApprove} onClick={() => setModalType('approve')}>
                    Approve
                  </button>
                  <button className={styles.btnReject} onClick={() => setModalType('reject')}>
                    Reject
                  </button>
                  <button className={styles.btnCancel} onClick={closeModal}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
