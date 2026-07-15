import { useState, useEffect, useCallback } from 'react';

/**
 * Generic API hook for data fetching
 * @param {string} key - Unique cache key
 * @param {Function} fetchFn - Async function to call
 * @param {Object} options
 * @param {boolean} options.immediate - Fetch immediately on mount (default: true)
 * @param {Array} options.deps - Dependencies to refetch
 */
export function useApi(key, fetchFn, options = {}) {
  const { immediate = true, deps = [] } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError({
        message: err.message || 'An unexpected error occurred',
        code: err.code || 'UNKNOWN_ERROR',
        status: err.status || 500,
        fields: err.fields || null,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, execute, setData };
}
