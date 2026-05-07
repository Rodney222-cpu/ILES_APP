import { useState } from 'react';
import { createEvaluation } from '../../services/api';
import styles from './EvaluationForm.module.css';

function EvaluationForm({ placement, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    punctuality_regularity: 0,
    punctuality_remarks: '',
    communication_skills: 0,
    communication_remarks: '',
    professional_attitude: 0,
    professional_remarks: '',
    teamwork_ability: 0,
    teamwork_remarks: '',
    adaptability: 0,
    adaptability_remarks: '',
    analytical_skills: 0,
    analytical_remarks: '',
    initiative_willingness: 0,
    initiative_remarks: '',
    work_quality: 0,
    work_quality_remarks: '',
    technical_knowledge: 0,
    technical_remarks: '',
    overall_contribution: 0,
    overall_remarks: '',
    general_comments: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const criteria = [
    { key: 'punctuality_regularity', label: 'Punctuality & Regularity' },
    { key: 'communication_skills', label: 'Communication Skills (Verbal/Written)' },
    { key: 'professional_attitude', label: 'Professional Attitude & Behaviour' },
    { key: 'teamwork_ability', label: 'Ability to Work in a Team' },
    { key: 'adaptability', label: 'Adaptability to Work Environment' },
    { key: 'analytical_skills', label: 'Analytical & Problem-Solving Skills' },
    { key: 'initiative_willingness', label: 'Initiative and Willingness to Learn' },
    { key: 'work_quality', label: 'Quality of Work Delivered' },
    { key: 'technical_knowledge', label: 'Technical Knowledge Related to the Field' },
    { key: 'overall_contribution', label: 'Overall Contribution to the Organization' }
  ];

  const ratingOptions = [
    { value: 5, label: 'Excellent' },
    { value: 4, label: 'Good' },
    { value: 3, label: 'Average' },
    { value: 2, label: 'Below Average' },
    { value: 1, label: 'Poor' },
    { value: 0, label: 'N/A' }
  ];

  const handleRatingChange = (criteriaKey, value) => {
    setFormData({
      ...formData,
      [criteriaKey]: parseInt(value)
    });
  };

  const handleRemarksChange = (criteriaKey, value) => {
    setFormData({
      ...formData,
      [`${criteriaKey}_remarks`]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createEvaluation({
        placement: placement.id,
        ...formData
      });
      alert('Evaluation submitted successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.response?.data) {
        const msg = Object.values(err.response.data).flat().join(', ');
        setError(msg);
      } else {
        setError('Failed to submit evaluation');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Internship Evaluation Form</h2>
        <p className={styles.subtitle}>
          Evaluating: <strong>{placement.student_username}</strong> at <strong>{placement.company_name}</strong>
        </p>
        <p className={styles.note}>
          Note: To be filled by the Company/Organization Supervisor
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.criteriaSection}>
          <h3>Evaluation Criteria</h3>
          <p className={styles.scaleInfo}>
            Please evaluate the intern on the following parameters using the scale:<br />
            <strong>5 = Excellent | 4 = Good | 3 = Average | 2 = Below Average | 1 = Poor | N/A = Not Applicable</strong>
          </p>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Evaluation Parameter</th>
                <th>Rating (1-5/N/A)</th>
                <th>Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((criterion, index) => (
                <tr key={criterion.key}>
                  <td>{index + 1}</td>
                  <td className={styles.criteriaLabel}>{criterion.label}</td>
                  <td>
                    <select
                      value={formData[criterion.key]}
                      onChange={(e) => handleRatingChange(criterion.key, e.target.value)}
                      required
                      className={styles.ratingSelect}
                    >
                      {ratingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value === 0 ? 'N/A' : `${option.value} - ${option.label}`}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      value={formData[`${criterion.key}_remarks`]}
                      onChange={(e) => handleRemarksChange(criterion.key, e.target.value)}
                      placeholder="Optional remarks..."
                      rows="2"
                      className={styles.remarksInput}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.commentsSection}>
          <label>General Comments</label>
          <textarea
            value={formData.general_comments}
            onChange={(e) => setFormData({ ...formData, general_comments: e.target.value })}
            placeholder="Overall feedback about the student's performance..."
            rows="5"
            className={styles.commentsInput}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Submitting...' : 'Submit Evaluation'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className={styles.cancelBtn}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default EvaluationForm;
