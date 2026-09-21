import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoUpload from '../components/PhotoUpload.jsx';
import { ADD_ONS, calculateEstimate, CONDITIONS, FREQUENCIES, SERVICE_TYPES } from '../lib/pricing.js';

const STEP_LABELS = ['Service', 'Property', 'Condition & add-ons', 'Photos', 'Your details'];

const INITIAL_FORM = {
  serviceType: 'standard',
  propertyType: 'house',
  bedrooms: 2,
  bathrooms: 1,
  sqft: 1200,
  hasPets: false,
  condition: 'average',
  frequency: 'oneTime',
  addOns: [],
  contact: { name: '', email: '', phone: '', address: '', notes: '' },
};

export default function Estimate() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  const estimate = useMemo(() => calculateEstimate(form), [form]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const updateContact = (patch) => setForm((f) => ({ ...f, contact: { ...f.contact, ...patch } }));

  const toggleAddOn = (key) => {
    setForm((f) => ({
      ...f,
      addOns: f.addOns.includes(key) ? f.addOns.filter((k) => k !== key) : [...f.addOns, key],
    }));
  };

  const canProceed = () => {
    if (step === 1) return form.sqft >= 100 && form.bedrooms >= 0 && form.bathrooms >= 1;
    if (step === 4) return form.contact.name && form.contact.email && form.contact.phone;
    return true;
  };

  const next = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const body = new FormData();
      body.append('data', JSON.stringify(form));
      photos.forEach((file) => body.append('photos', file));

      const res = await fetch('/api/leads', { method: 'POST', body });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Something went wrong submitting your estimate.');

      navigate('/thank-you', { state: { estimate: payload.estimate, name: form.contact.name } });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wizard-page">
      <div className="container wizard-layout">
        <div className="wizard-panel">
          <div className="progress-track">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className={`progress-seg${i <= step ? ' active' : ''}`} />
            ))}
          </div>
          <div className="step-label">
            Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}
          </div>

          {step === 0 && (
            <ServiceStep value={form.serviceType} onChange={(v) => update({ serviceType: v })} />
          )}
          {step === 1 && <PropertyStep form={form} update={update} />}
          {step === 2 && (
            <ConditionStep form={form} update={update} toggleAddOn={toggleAddOn} />
          )}
          {step === 3 && <PhotosStep photos={photos} setPhotos={setPhotos} />}
          {step === 4 && (
            <ContactStep
              contact={form.contact}
              updateContact={updateContact}
              submitError={submitError}
            />
          )}

          <div className="wizard-actions">
            <button className="btn btn-secondary" onClick={back} disabled={step === 0 || submitting}>
              ← Back
            </button>
            {step < STEP_LABELS.length - 1 ? (
              <button className="btn btn-primary" onClick={next} disabled={!canProceed()}>
                Continue →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={submit} disabled={!canProceed() || submitting}>
                {submitting ? 'Submitting…' : 'Get my estimate'}
              </button>
            )}
          </div>
        </div>

        <EstimateSummary estimate={estimate} photoCount={photos.length} />
      </div>
    </div>
  );
}

function ServiceStep({ value, onChange }) {
  return (
    <div>
      <h2>What kind of cleaning do you need?</h2>
      <div className="option-grid">
        {Object.entries(SERVICE_TYPES).map(([key, s]) => (
          <button
            key={key}
            type="button"
            className={`option-card${value === key ? ' selected' : ''}`}
            onClick={() => onChange(key)}
          >
            <div className="title">{s.label}</div>
            <div className="desc">Starting at ${s.minimum}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PropertyStep({ form, update }) {
  return (
    <div>
      <h2>Tell us about the space</h2>
      <div className="field-row">
        <div className="field">
          <label>Property type</label>
          <select value={form.propertyType} onChange={(e) => update({ propertyType: e.target.value })}>
            <option value="house">House</option>
            <option value="apartment">Apartment / Condo</option>
            <option value="office">Office</option>
          </select>
        </div>
        <div className="field">
          <label>Approx. square footage</label>
          <input
            type="number"
            min={100}
            step={50}
            value={form.sqft}
            onChange={(e) => update({ sqft: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Bedrooms</label>
          <input
            type="number"
            min={0}
            max={15}
            value={form.bedrooms}
            onChange={(e) => update({ bedrooms: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Bathrooms</label>
          <input
            type="number"
            min={1}
            max={15}
            value={form.bathrooms}
            onChange={(e) => update({ bathrooms: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="toggle-row">
        <div>
          <strong>Pets in the home?</strong>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Extra hair &amp; dander cleanup</div>
        </div>
        <input
          type="checkbox"
          checked={form.hasPets}
          onChange={(e) => update({ hasPets: e.target.checked })}
          style={{ width: 20, height: 20 }}
        />
      </div>
    </div>
  );
}

function ConditionStep({ form, update, toggleAddOn }) {
  return (
    <div>
      <h2>Current condition &amp; extras</h2>
      <div className="option-grid">
        {Object.entries(CONDITIONS).map(([key, c]) => (
          <button
            key={key}
            type="button"
            className={`option-card${form.condition === key ? ' selected' : ''}`}
            onClick={() => update({ condition: key })}
          >
            <div className="title">{c.label}</div>
          </button>
        ))}
      </div>

      <div className="field" style={{ margin: '20px 0' }}>
        <label>How often?</label>
        <select value={form.frequency} onChange={(e) => update({ frequency: e.target.value })}>
          {Object.entries(FREQUENCIES).map(([key, f]) => (
            <option key={key} value={key}>
              {f.label}
              {f.discount > 0 ? ` (${Math.round(f.discount * 100)}% off)` : ''}
            </option>
          ))}
        </select>
      </div>

      <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Add-ons</label>
      <div className="checkbox-grid">
        {Object.entries(ADD_ONS).map(([key, a]) => (
          <label key={key} className={`checkbox-item${form.addOns.includes(key) ? ' checked' : ''}`}>
            <input
              type="checkbox"
              checked={form.addOns.includes(key)}
              onChange={() => toggleAddOn(key)}
            />
            {a.label} (+${a.price})
          </label>
        ))}
      </div>
    </div>
  );
}

function PhotosStep({ photos, setPhotos }) {
  return (
    <div>
      <h2>Show us the space (optional)</h2>
      <p style={{ color: 'var(--color-muted)' }}>
        Photos of the rooms or areas you want cleaned help our team confirm your estimate is accurate before the
        crew arrives — no obligation to book.
      </p>
      <PhotoUpload photos={photos} onChange={setPhotos} />
    </div>
  );
}

function ContactStep({ contact, updateContact, submitError }) {
  return (
    <div>
      <h2>Almost done — where should we send this?</h2>
      {submitError && <div className="error-banner">{submitError}</div>}
      <div className="field-row">
        <div className="field">
          <label>Full name *</label>
          <input value={contact.name} onChange={(e) => updateContact({ name: e.target.value })} />
        </div>
        <div className="field">
          <label>Email *</label>
          <input type="email" value={contact.email} onChange={(e) => updateContact({ email: e.target.value })} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Phone *</label>
          <input type="tel" value={contact.phone} onChange={(e) => updateContact({ phone: e.target.value })} />
        </div>
        <div className="field">
          <label>Address</label>
          <input value={contact.address} onChange={(e) => updateContact({ address: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label>Anything else we should know?</label>
        <textarea
          rows={3}
          value={contact.notes}
          onChange={(e) => updateContact({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}

function EstimateSummary({ estimate, photoCount }) {
  return (
    <div className="summary-card">
      <div className="step-label">Your instant estimate</div>
      <div className="summary-total">
        ${estimate.low} – ${estimate.high}
      </div>
      <div className="summary-sub">Estimated price range, updated live as you answer</div>

      {estimate.lineItems.map((line) => (
        <div className="summary-line" key={line.label}>
          <span>{line.label}</span>
          <span>{line.amount < 0 ? '-' : ''}${Math.abs(line.amount)}</span>
        </div>
      ))}

      {photoCount > 0 && (
        <div className="summary-line">
          <span>Photos attached</span>
          <span>{photoCount}</span>
        </div>
      )}

      <p className="disclaimer">
        This is an automated estimate based on the details provided. Final pricing is confirmed after our team
        reviews your submission (and any photos you attach).
      </p>
    </div>
  );
}
