import React, { useState, useEffect } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

interface SearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export const Search: React.FC<SearchProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  className = '',
  autoFocus = false,
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(internalValue);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange('');
    onSearch?.('');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
      
      <input
        type="text"
        value={internalValue}
        onChange={(e) => {
          setInternalValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-9 pr-9 py-2 bg-white border border-[#e5e5e5] rounded-md text-sm text-[#1a1a1a] placeholder-[#a3a3a3] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
      />
      
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="w-4 h-4 text-[#737373] hover:text-[#1a1a1a]" />
        </button>
      )}
    </form>
  );
};

// Hook for search with debounce
export const useSearch = (items: any[], searchFields: string[], delay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredItems(items);
        return;
      }

      const filtered = items.filter((item) =>
        searchFields.some((field) =>
          String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredItems(filtered);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, items, searchFields, delay]);

  return { searchTerm, setSearchTerm, filteredItems };
};
