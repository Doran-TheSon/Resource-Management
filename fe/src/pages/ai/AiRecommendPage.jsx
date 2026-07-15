import React, { useState } from 'react';
import { aiApi } from '../../api/aiApi';
import PageHeader from '../../components/common/PageHeader';
import FormField from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AllocationGauge from '../../components/common/AllocationGauge';
import { toast } from '../../components/common/Toast';
import { SEVERITY_COLORS } from '../../utils/constants';

export default function AiRecommendPage() {
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
      const data = await aiApi.recommend(query.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to get recommendations');
      toast(err.message || 'AI recommendation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <PageHeader
        title="AI Resource Recommendation"
        subtitle="Use natural language to find available resources"
      />

      {/* Query Input */}
      <div style={styles.queryCard}>
        <form onSubmit={handleSubmit} style={styles.queryForm}>
          <FormField
            label="What are you looking for?"
            name="query"
            type="textarea"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`e.g. "Tìm Java Developer còn tối thiểu 50% available"`}
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
            {loading ? '🤖 Analyzing...' : '🔍 Analyze'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div style={styles.loadingBox}>
          <LoadingSpinner text="AI is analyzing resources..." />
          <p style={styles.loadingHint}>
            Gemini AI is processing your request and querying the database...
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
          {/* Explanation */}
          {result.explanation && (
            <div style={styles.explanationCard}>
              <div style={styles.explanationHeader}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <h3 style={styles.explanationTitle}>AI Analysis</h3>
              </div>
              <div style={styles.explanationText}>
                {result.explanation.split('\n').map((line, i) => {
                  // Bỏ dòng trống
                  if (!line.trim()) return null;
                  // Bullet points: "• **Name** — Role — available: **X%**"
                  if (line.trimStart().startsWith('•')) {
                    const clean = line.replace(/[*•]/g, '').trim();
                    return <div key={i} style={styles.bulletRow}>{clean}</div>;
                  }
                  // Emoji tip line
                  if (line.includes('💡')) {
                    const clean = line.replace(/[*💡]/g, '').trim();
                    return <div key={i} style={styles.tipRow}>💡 {clean}</div>;
                  }
                  return <p key={i} style={{ margin: 0 }}>{line}</p>;
                })}
              </div>
            </div>
          )}

          {/* Recommended Resources */}
          {result.recommendedResources?.length > 0 && (
            <>
              <h3 style={styles.sectionTitle}>
                Recommended Resources ({result.recommendedResources.length})
              </h3>
              <div style={styles.resourcesGrid}>
                {result.recommendedResources.map((r, idx) => (
                  <div
                    key={r.employeeId}
                    style={{
                      ...styles.resourceCard,
                      animation: `fadeInUp 0.3s ease-out`,
                      animationDelay: `${idx * 0.08}s`,
                    }}
                  >
                    <div style={styles.resourceHeader}>
                      <div style={styles.avatar}>
                        {r.employeeName?.charAt(0) || '?'}
                      </div>
                      <div style={styles.resourceInfo}>
                        <h4 style={styles.resourceName}>{r.employeeName}</h4>
                        <span style={styles.resourceRole}>{r.role}</span>
                      </div>
                    </div>

                    <div style={styles.resourceDetails}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Department</span>
                        <span>{r.department || '—'}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Email</span>
                        <span>{r.email || '—'}</span>
                      </div>
                    </div>

                    <div style={styles.availableSection}>
                      <div style={styles.availableLabel}>
                        <span>Available</span>
                        <span style={{
                          fontWeight: 'var(--font-bold)',
                          color: r.available >= 50
                            ? 'var(--color-success)'
                            : 'var(--color-warning)',
                        }}>
                          {r.available}%
                        </span>
                      </div>
                      <AllocationGauge
                        value={100 - r.available}
                        max={100}
                      />
                    </div>

                    {r.currentProjects?.length > 0 && (
                      <div style={styles.projectsSection}>
                        <span style={styles.projectsLabel}>Current Projects:</span>
                        <div style={styles.projectTags}>
                          {r.currentProjects.map((p, i) => (
                            <span key={i} style={styles.projectTag}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <div style={styles.warningsCard}>
              <h4 style={styles.warningsTitle}>⚠️ Warnings</h4>
              <ul style={styles.warningsList}>
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* No results */}
          {(!result.recommendedResources || result.recommendedResources.length === 0) && (
            <div style={styles.noResults}>
              <p>No matching resources found. Try adjusting your criteria.</p>
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
    transition: 'all var(--transition-fast)',
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
  explanationCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    animation: 'fadeInUp 0.3s ease-out',
  },
  explanationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-3)',
  },
  explanationTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
  },
  explanationText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.8,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  bulletRow: {
    padding: 'var(--space-2) var(--space-3)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)',
    fontSize: 'var(--text-sm)',
    borderLeft: '3px solid var(--color-primary-light)',
  },
  tipRow: {
    padding: 'var(--space-2) var(--space-3)',
    backgroundColor: 'var(--color-info-bg)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-info-dark)',
    fontSize: 'var(--text-sm)',
    marginTop: 'var(--space-2)',
  },
  sectionTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--font-semibold)',
  },
  resourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 'var(--space-4)',
  },
  resourceCard: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    transition: 'all var(--transition-normal)',
  },
  resourceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'var(--font-bold)',
    fontSize: 'var(--text-lg)',
    flexShrink: 0,
  },
  resourceInfo: {},
  resourceName: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
  },
  resourceRole: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
  },
  resourceDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    fontSize: 'var(--text-sm)',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--color-text)',
  },
  detailLabel: {
    color: 'var(--color-text-secondary)',
  },
  availableSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  },
  availableLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--text-sm)',
  },
  projectsSection: {
    borderTop: '1px solid var(--color-border-light)',
    paddingTop: 'var(--space-3)',
  },
  projectsLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
    fontWeight: 'var(--font-semibold)',
    display: 'block',
    marginBottom: 'var(--space-2)',
  },
  projectTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-1)',
  },
  projectTag: {
    padding: '2px 8px',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    color: 'var(--color-text-secondary)',
  },
  warningsCard: {
    backgroundColor: 'var(--color-warning-bg)',
    border: '1px solid var(--color-warning)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
  },
  warningsTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-semibold)',
    marginBottom: 'var(--space-2)',
    color: 'var(--color-warning-dark)',
  },
  warningsList: {
    paddingLeft: 'var(--space-4)',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
  },
  noResults: {
    textAlign: 'center',
    padding: 'var(--space-8)',
    color: 'var(--color-text-secondary)',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
  },
};
