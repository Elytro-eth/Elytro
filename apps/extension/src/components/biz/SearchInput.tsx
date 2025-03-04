import { cn } from '@/utils/shadcn/utils';
import React, { useState, useRef, useEffect } from 'react';
import { LabelInput } from './LabelInput';

interface SearchInputProps<T> {
  label: string;
  input: string;
  onSearch: (value: string) => T[];
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  placeholder?: string;
  maxSuggestions?: number;
}

export function SearchInput<T>({
  input,
  label,
  onSearch,
  onSelect,
  renderItem,
  placeholder = 'Search...',
}: SearchInputProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const res = onSearch(e.target.value);
    setSuggestions(res);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <LabelInput
        label={label}
        type="text"
        value={input}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'px-2 py-1.5 cursor-pointer hover:bg-accent hover:text-accent-foreground',
                {
                  'bg-accent text-accent-foreground':
                    index === highlightedIndex,
                }
              )}
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
