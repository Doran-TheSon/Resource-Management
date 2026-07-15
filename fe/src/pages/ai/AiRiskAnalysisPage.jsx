import React, { useState } from 'react';
import { aiApi } from '../../api/aiApi';
import PageHeader from '../../components/common/PageHeader';
import FormField from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from '../../components/common/Toast';
import { SEVERITY_COLORS } from '../../utils/constants';

export default function AiRiskAnalysisPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await aiApi.analyzeRisk(query.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze risk');
      toast(err.message || 'AI risk analysis failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const severityIcon = {
    HIGH: '🔴',
    MEDIUM: '🟡',
    LOW: '🟢',
  };

  return (
    <div className="page-content">
      <PageHeader
        title="AI Risk Analysis"
        subtitle="Analyze capacity risks using natural language"
      />

      {/* Query Input */}
      <div style={styles.queryCard}>
        <form onSubmit={handleSubmit} style={styles.queryForm}>
          <FormField
            label="Describe your resource needs"
            name="query"
            type="textarea"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`e.g. "Sprint tới cần thêm 2 Java Developer"`}
            rows={3}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{
              ...styles.analyzeBtn,
              opacity: loading || !query.trim() ? 0.6 : 1,
            }}
          >
            {loading ? '🤖 Analyzing Risks...' : '🔍 Analyze Risk'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div style={styles.loadingBox}>
          <LoadingSpinner text="AI is analyzing capacity risks..." />
          <p style={styles.loadingHint}>
            Gemini AI is evaluating current resource allocation against your requirements...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <span style={{ fontSize: 24 }}>❌</span>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div style={styles.resultSection}>
          {/* Overall Assessment */}
          {result.overallAssessment && (
            <div style={styles.assessmentCard}>
              <div style={styles.assessmentHeader}>
                <span style={{ fontSize: 24 }}>📋</span>
                <h3 style={styles.assessmentTitle}>Overall Assessment</h3>
              </div>
              <p style={styles.assessmentText}>{result.overallAssessment}</p>
            </div>
          )}

          {/* Risks */}
          {result.risks?.length > 0 && (
            <>
              <h3 style={styles.sectionTitle}>
                Risk Analysis ({result.risks.length} risks identified)
              </h3>
              <div style={styles.risksList}>
                {result.risks.map((risk, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.riskCard,
                      borderLeftColor: SEVERITY_COLORS[risk.severity] || 'var(--color-info)',
                      animation: `fadeInUp 0.3s ease-out`,
                      animationDelay: `${idx * 0.08}s`,
                    }}
                  >
                    <div style={styles.riskHeader}>
                      <span style={{ fontSize: 20 }}>
                        {severityIcon[risk.severity] || 'ℹ️'}
                      </span>
                      <div style={styles.riskInfo}>
                        <h4 style={styles.riskType}>{risk.type}</h4>
                        <span
                          style={{
                            ...styles.riskSeverity,
                            backgroundColor:
                              (SEVERITY_COLORS[risk.severity] || 'var(--color-info)') + '20',
                            color: SEVERITY_COLORS[risk.severity] || 'var(--color-info)',
                          }}
                        >
                          {risk.severity || 'INFO'}
                        </span>
                      </div>
                    </div>
                    <p style={styles.riskDescription}>{risk.description}</p>
                    {risk.impact && (
                      <div style={styles.riskImpact}>
                        <strong>Impact:</strong> {risk.impact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Suggestions */}
          {result.suggestions?.length > 0 && (
            <div style={styles.suggestionsCard}>
              <h4 style={styles.suggestionsTitle}>💡 Suggestions</h4>
              <ul style={styles.suggestionsList}>
                {result.suggestions.map((s, i) => (
                  <li key={i} style={styles.suggestionItem}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  queryCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    marginBottom: 'var(--space-6)',
  },
  queryForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  analyzeBtn: {
    alignSelf: 'flex-end',
    padding: 'var(--space-2) var(--space-6)',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--font-medium)',
    cursor: 'pointer',
  },
  loadingBox: {
    textAlign: 'center',
    padding: 'var(--space-8)',
  },
  loadingHint: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    marginTop: 'var(--space-2)',
  },
  errorBox: {
    padding: 'var(--space-4)',
    backgroundColor: 'var(--color-danger-bg)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-danger-dark)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-6)',
  },
  resultSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  assessmentCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    animation: 'fadeInUp 0.3s ease-out',
  },
  assessmentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-3)',
  },
  assessmentTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
  },
  assessmentText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.7,
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
  },
  risksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  riskCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderLeftWidth: 4,
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  riskHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  riskInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  },
  riskType: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    flex: 1,
  },
  riskSeverity: {
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--font-semibold)',
  },
  riskDescription: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    lineHeight: 1.5,
  },
  riskImpact: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    padding: 'var(--space-2) var(--space-3)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-sm)',
  },
  suggestionsCard: {
    backgroundColor: 'var(--color-info-bg)',
    border: '1px solid var(--color-info)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
  },
  suggestionsTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    color: 'var(--color-info-dark)',
    marginBottom: 'var(--space-3)',
  },
  suggestionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  suggestionItem: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    padding: 'var(--space-2) var(--space-3)',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-sm)',
    lineHeight: 1.5,
  },
};
