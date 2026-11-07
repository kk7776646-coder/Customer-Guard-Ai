import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, User, ArrowRight, AlertCircle } from 'lucide-react';
import { RiskBadge, ChurnStatusBadge } from './ui';

interface GlobalHeaderSearchProps {
  customers: any[];
  onSelectCustomer: (customerId: string) => void;
  thresholds?: { medium: number; high: number };
  className?: string;
}

export function GlobalHeaderSearch({
  customers = [],
  onSelectCustomer,
  thresholds = { medium: 35, high: 65 },
  className = ''
}: GlobalHeaderSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter matching customers based on ID, Name, Email, Contract, Payment, Internet, ChurnStatus
  const matchingCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return customers.filter((c: any) => {
      const idMatch = String(c.id || '').toLowerCase().includes(q);
      const nameMatch = String(c.name || '').toLowerCase().includes(q);
      const emailMatch = String(c.email || '').toLowerCase().includes(q);
      const contractMatch = String(c.contract || '').toLowerCase().includes(q);
      const paymentMatch = String(c.payment || '').toLowerCase().includes(q);
      const internetMatch = String(c.internet || '').toLowerCase().includes(q);
      const statusMatch = String(c.churnStatus || '').toLowerCase().includes(q);
      const phoneMatch = String(c.phoneService || '').toLowerCase().includes(q);

      return idMatch || nameMatch || emailMatch || contractMatch || paymentMatch || internetMatch || statusMatch || phoneMatch;
    }).slice(0, 10);
  }, [customers, query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Keyboard shortcut: Press "/" or "Ctrl/Cmd + K" to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll selected item into view in dropdown
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Reset selected index when matches change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [matchingCustomers]);

  const handleSelectCustomer = (customerId: string) => {
    onSelectCustomer(customerId);
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (matchingCustomers.length > 0) {
        setSelectedIndex(prev => (prev < matchingCustomers.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (matchingCustomers.length > 0) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : matchingCustomers.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingCustomers.length > 0) {
        const target = selectedIndex >= 0 ? matchingCustomers[selectedIndex] : matchingCustomers[0];
        if (target) {
          handleSelectCustomer(target.id);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setIsMobileSearchOpen(false);
      inputRef.current?.blur();
      mobileInputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
    mobileInputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative flex items-center ${className}`}>
      {/* Mobile Search Trigger Icon Button */}
      <button
        type="button"
        onClick={() => {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        }}
        className="sm:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-secondary)] border border-transparent hover:border-[var(--border-subtle)] transition cursor-pointer"
        aria-label="Open customer search"
        title="Search accounts"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Desktop Search Input Box */}
      <div className="hidden sm:flex items-center relative w-64 md:w-80 lg:w-96">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search by ID, name, email, contract..."
          aria-label="Search customers globally"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          className="w-full h-9 pl-9 pr-14 text-xs font-normal text-[var(--text-primary)] bg-[var(--bg-input)] hover:bg-[var(--bg-card-secondary)] focus:bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-purple-500 rounded-lg shadow-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-150"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-highlight)] transition cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--text-muted)] bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay Drawer / Popup */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col p-3 sm:hidden animate-in fade-in duration-150">
          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-2 shadow-xl">
            <Search className="w-4 h-4 text-[var(--text-secondary)] ml-1 shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search customers..."
              className="flex-1 bg-transparent border-0 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Clear text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setIsOpen(false);
              }}
              className="px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)] rounded-lg"
            >
              Cancel
            </button>
          </div>

          {/* Results in mobile modal */}
          <div className="mt-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-2xl max-h-[75vh] overflow-y-auto">
            {renderResultsContent()}
          </div>
        </div>
      )}

      {/* Desktop Autocomplete Results Dropdown */}
      {isOpen && query.trim().length > 0 && !isMobileSearchOpen && (
        <div className="hidden sm:block absolute left-0 top-full mt-2 w-80 md:w-96 lg:w-[440px] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {renderResultsContent()}
        </div>
      )}
    </div>
  );

  function renderResultsContent() {
    if (matchingCustomers.length === 0) {
      return (
        <div className="p-6 text-center space-y-2">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-[var(--text-primary)]">No matching customers found</p>
          <p className="text-[11px] text-[var(--text-secondary)] max-w-xs mx-auto">
            No accounts match &ldquo;{query}&rdquo;. Try searching by customer ID (e.g. 7590), full name, email, or contract type.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        {/* Dropdown Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-card-secondary)] border-b border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-secondary)]">
          <span>Matching Accounts ({matchingCustomers.length})</span>
          <span className="hidden sm:inline text-[10px] text-[var(--text-muted)]">
            Press <kbd className="font-mono text-[var(--text-primary)]">↵</kbd> to open Trends &amp; Insights
          </span>
        </div>

        {/* Customer Results List */}
        <ul ref={listRef} className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)] py-1" role="listbox">
          {matchingCustomers.map((cust: any, index: number) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={cust.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectCustomer(cust.id)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors duration-100 ${
                  isSelected ? 'bg-[var(--bg-highlight)]' : 'hover:bg-[var(--bg-card-secondary)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)] shrink-0 font-medium text-[11px]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {cust.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-app)] text-[var(--text-secondary)] border border-[var(--border-subtle)] shrink-0">
                        {cust.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                      <span className="truncate">{cust.email || 'No email registered'}</span>
                      {cust.contract && (
                        <>
                          <span>·</span>
                          <span className="shrink-0 text-[var(--text-muted)]">{cust.contract}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {cust.churnStatus && <ChurnStatusBadge status={cust.churnStatus} />}
                  {cust.probability !== undefined && (
                    <RiskBadge probability={cust.probability} thresholds={thresholds} size="sm" />
                  )}
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0.5 text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
                </div>
              </li>
            );
          })}
        </ul>

        {/* Dropdown Footer Tip */}
        <div className="px-3.5 py-2 bg-[var(--bg-card-secondary)] border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] flex items-center justify-between">
          <span>Opens Customer Analysis in Trends &amp; Insights</span>
          <span className="hidden sm:inline font-mono text-[var(--text-muted)]">Esc to close</span>
        </div>
      </div>
    );
  }
}
