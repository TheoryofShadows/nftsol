/**
 * Autocomplete Suggestions Component
 * Display search suggestions as user types
 */

import React from 'react';

interface AutocompleteSuggestionsProps {
  suggestions: string[];
  loading: boolean;
  onSelect: (suggestion: string) => void;
}

export const AutocompleteSuggestions: React.FC<AutocompleteSuggestionsProps> = ({
  suggestions,
  loading,
  onSelect,
}) => {
  if (!suggestions.length && !loading) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-cyan-500/30 rounded-lg shadow-xl z-50 overflow-hidden">
      {loading && (
        <div className="px-4 py-3 text-gray-400 text-sm flex items-center gap-2">
          <div className="animate-spin">⏳</div>
          Loading suggestions...
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <ul className="py-2 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => onSelect(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-cyan-500/20 text-white transition-colors flex items-center gap-2"
              >
                <span className="text-gray-500">🔍</span>
                <span>{suggestion}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && !suggestions.length && (
        <div className="px-4 py-3 text-gray-400 text-sm">No suggestions found</div>
      )}
    </div>
  );
};

export default AutocompleteSuggestions;
