"use client";

import { useEffect, useRef, useState } from "react";

interface TimeFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const timeFilterOptions = [
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "year", label: "Este ano" },
  { value: "all", label: "Desde sempre" },
];

export default function TimeFilterDropdown({
  value,
  onChange,
}: TimeFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const currentLabel =
    timeFilterOptions.find((opt) => opt.value === value)?.label ||
    "Desde sempre";

  const handleSelect = (newValue: string) => {
    setIsOpen(false);
    onChange(newValue);
  };

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-amber-50 text-gray-700 py-2 pl-4 pr-3 rounded-lg shadow-sm hover:shadow-md border border-transparent hover:border-emerald-400 transition-all duration-150 cursor-pointer text-sm font-medium"
      >
        <span>{currentLabel}</span>
        {/* Ícone de seta */}
        <svg
          className={`h-4 w-4 text-emerald-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {/* Opções */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-full w-max bg-amber-50 rounded-lg shadow-md border border-transparent z-50">
          {timeFilterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`block w-full text-left px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-150 first:rounded-t-lg last:rounded-b-lg whitespace-nowrap ${
                value === option.value
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-700 hover:bg-amber-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
