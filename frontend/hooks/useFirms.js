'use client';

// Firms listing hook — fetches ONLY from the backend API.
// Filtering/sorting/pagination is server-side; there is no mock-data fallback.
// On an API error the list is empty and the error message is surfaced.

import { useState, useEffect, useCallback, useRef } from 'react';
import firmService from '@/services/firmService';

/** Map the UI filter params to the backend query params. */
function toQuery(params = {}) {
  const { search, city, location, firmType, minRating, sort, page, limit } =
    params;
  return {
    search: search || undefined,
    city: city || location || undefined,
    firmType: firmType || undefined,
    minRating: minRating || undefined,
    sort: sort || undefined,
    page: page || undefined,
    limit: limit || undefined,
  };
}

export function useFirms(initialParams = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const query = toQuery(params);
  const queryKey = JSON.stringify(query);
  const requestId = useRef(0);

  const fetchData = useCallback(async () => {
    const myRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await firmService.getAll(query);
      if (myRequest !== requestId.current) return;
      setItems(Array.isArray(res && res.data) ? res.data : []);
      setMeta((res && res.meta) || null);
    } catch (err) {
      if (myRequest !== requestId.current) return;
      setError(err.message || 'Failed to load firms.');
      setItems([]);
      setMeta(null);
    } finally {
      if (myRequest === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    items,
    // Backward-compatible alias for pages that still read `firms`.
    firms: items,
    meta,
    loading,
    error,
    params,
    setParams,
    refetch: fetchData,
  };
}

export default useFirms;
