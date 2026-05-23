'use client';

// useFilterOptions — fetches the distinct professional filter values
// (cities, professionalTypes, specializations, languages) that actually
// exist in the database, so search / filter dropdowns always match real data.
// The result is cached at module scope so it is fetched only once per load.

import { useState, useEffect } from 'react';
import professionalService from '@/services/professionalService';

const EMPTY = {
  professionalTypes: [],
  cities: [],
  specializations: [],
  languages: [],
};

let cache = null;

export function useFilterOptions() {
  const [options, setOptions] = useState(cache || EMPTY);

  useEffect(() => {
    if (cache) {
      setOptions(cache);
      return undefined;
    }
    let active = true;
    professionalService
      .getFilterOptions()
      .then((data) => {
        cache = data || EMPTY;
        if (active) setOptions(cache);
      })
      .catch(() => {
        /* keep empty options on failure */
      });
    return () => {
      active = false;
    };
  }, []);

  return options;
}

export default useFilterOptions;
