import { MONTHS } from '../lib/api.js';

export default function SeasonStrip({ season, month }) {
  return (
    <div className="season-strip" aria-label={`In season: ${season.map((m) => MONTHS[m - 1]).join(', ')}`}>
      {MONTHS.map((name, i) => (
        <span key={name} className={`season-cell${season.includes(i + 1) ? ' on' : ''}${month === i + 1 ? ' now' : ''}`} title={name}>
          {name[0]}
        </span>
      ))}
    </div>
  );
}
