// A horizontal bar showing coverage against a goal of 100%. Bars past the
// goal are clamped visually but the label shows the true percentage.
export default function CoverageBar({ label, value, detail }) {
  const pct = Math.round(value * 100);
  const tone = value >= 1 ? 'good' : value >= 0.5 ? 'fair' : 'low';
  return (
    <div className="coverage-row">
      <div className="coverage-label">
        <span>{label}</span>
        <span className={`coverage-pct tone-${tone}`}>{pct}%</span>
      </div>
      <div className="coverage-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(pct, 100)} aria-label={label}>
        <div className={`coverage-fill tone-${tone}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      {detail && <div className="coverage-detail muted small">{detail}</div>}
    </div>
  );
}
