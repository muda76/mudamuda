import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILES = 10;
const MAX_SIZE_MB = 8;

export default function PhotoUpload({ photos, onChange }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const addFiles = useCallback(
    (fileList) => {
      const incoming = Array.from(fileList);
      const accepted = [];
      let rejection = '';

      for (const file of incoming) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          rejection = `"${file.name}" isn't a supported image type.`;
          continue;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          rejection = `"${file.name}" is over ${MAX_SIZE_MB}MB.`;
          continue;
        }
        accepted.push(file);
      }

      const combined = [...photos, ...accepted].slice(0, MAX_FILES);
      if (photos.length + accepted.length > MAX_FILES) {
        rejection = `You can upload up to ${MAX_FILES} photos.`;
      }

      setError(rejection);
      onChange(combined);
    },
    [photos, onChange],
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeAt = (idx) => {
    onChange(photos.filter((_, i) => i !== idx));
  };

  const previewUrls = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos]);
  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);

  return (
    <div>
      <div
        className={`dropzone${dragActive ? ' drag-active' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
      >
        <div className="dz-icon">📷</div>
        <strong>Click to upload or drag photos here</strong>
        <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>
          JPG, PNG, WEBP, or HEIC — up to {MAX_FILES} photos, {MAX_SIZE_MB}MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((file, i) => (
            <div className="photo-thumb" key={`${file.name}-${i}`}>
              <img src={previewUrls[i]} alt={`Upload ${i + 1}`} />
              <button type="button" onClick={() => removeAt(i)} aria-label="Remove photo">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
