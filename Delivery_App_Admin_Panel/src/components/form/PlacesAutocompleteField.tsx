import { useState, useRef, useEffect, useCallback } from "react";
import {
  fetchPredictions,
  getPlaceDetails,
  PlacePrediction,
  PlaceDetails,
} from "../../services/places.service";
import Label from "./Label";

interface PlacesAutocompleteFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (details: PlaceDetails) => void;
  onSelectionCleared?: () => void;
  disabled?: boolean;
}

export default function PlacesAutocompleteField({
  label,
  placeholder = "Search address in Addis Ababa...",
  value,
  onChange,
  onPlaceSelected,
  onSelectionCleared,
  disabled = false,
}: PlacesAutocompleteFieldProps) {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const nextSessionToken = () => {
    sessionTokenRef.current = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return sessionTokenRef.current;
  };

  const fetchSuggestions = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      if (!sessionTokenRef.current) nextSessionToken();
      const preds = await fetchPredictions(trimmed, sessionTokenRef.current);
      setSuggestions(preds);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (pred: PlacePrediction) => {
    setLoading(true);
    setShowDropdown(false);
    setSuggestions([]);
    try {
      const details = await getPlaceDetails(
        pred.placeId,
        sessionTokenRef.current || undefined
      );
      sessionTokenRef.current = "";
      const display = (details.name && details.name.trim()) ? details.name : details.formattedAddress;
      onChange(display);
      onPlaceSelected(details);
    } catch {
      // keep current value
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : i));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v);
          setShowDropdown(true);
          if (onSelectionCleared) onSelectionCleared();
        }}
        onFocus={() => value.trim().length >= 2 && setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:opacity-50"
      />
      {showDropdown && (suggestions.length > 0 || loading) && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          role="listbox"
        >
          {loading ? (
            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </li>
          ) : (
            suggestions.map((pred, i) => (
              <li
                key={pred.placeId}
                role="option"
                aria-selected={i === activeIndex}
                className={`cursor-pointer px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  i === activeIndex ? "bg-gray-100 dark:bg-gray-700" : ""
                }`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(pred);
                }}
              >
                {pred.description}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
