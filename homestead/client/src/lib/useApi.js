import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

// Fetch `path` on mount and whenever it changes; `reload` refetches.
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!path) return;
    try {
      setData(await api(path));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload };
}
