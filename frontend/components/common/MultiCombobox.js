'use client';

// MultiCombobox — searchable multi-select. Selected values render as a row
// of removable chips; unselected values appear in a dropdown filtered by a
// type-to-search input.
//
// Props:
//   - label, name — form-control labelling
//   - value: string[] — currently selected option values
//   - onChange: (next: string[]) => void — called with the new array
//   - options: Array<{ value, label }>
//   - placeholder: button label when nothing is selected
//   - error, hint, required, className, disabled
//   - emptyLabel: shown when search has no matches

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function MultiCombobox({
  label,
  name,
  value = [],
  onChange,
  options = [],
  placeholder = 'Select…',
  error,
  hint,
  required = false,
  disabled = false,
  className = '',
  emptyLabel = 'No matches',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedSet = useMemo(
    () => new Set((value || []).map((v) => String(v))),
    [value]
  );

  const selectedOptions = useMemo(
    () =>
      options.filter((o) => selectedSet.has(String(o.value))) ||
      [],
    [options, selectedSet]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      String(o.label).toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
    if (!open) setQuery('');
  }, [open]);

  function toggle(optionValue) {
    if (typeof onChange !== 'function') return;
    const key = String(optionValue);
    const next = new Set((value || []).map((v) => String(v)));
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next));
  }

  function removeChip(optionValue, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    toggle(optionValue);
  }

  const triggerClass = `flex min-h-[2.5rem] w-full items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-sm transition focus:outline-none focus:ring-4 ${
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 hover:border-amber-300 focus:border-amber-400 focus:ring-amber-100'
  } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <button
        type="button"
        id={name}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={triggerClass}
      >
        <span className="flex flex-1 flex-wrap items-center gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="px-1 text-slate-400">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
              >
                {opt.label}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${opt.label}`}
                  onClick={(e) => removeChip(opt.value, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      removeChip(opt.value, e);
                    }
                  }}
                  className="rounded-full p-0.5 hover:bg-amber-100"
                >
                  <X size={12} />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card-lg">
          <div className="border-b border-slate-100 px-2 py-2">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search…"
                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-2 text-sm text-slate-800 outline-none focus:border-amber-300 focus:bg-white"
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400">
                {emptyLabel}
              </li>
            ) : (
              filtered.map((opt) => {
                const checked = selectedSet.has(String(opt.value));
                return (
                  <li key={opt.value} role="option" aria-selected={checked}>
                    <button
                      type="button"
                      onClick={() => toggle(opt.value)}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition ${
                        checked
                          ? 'bg-amber-50 text-amber-800'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      <input
                        type="checkbox"
                        readOnly
                        checked={checked}
                        tabIndex={-1}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-amber-500"
                      />
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {hint && !error && (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
