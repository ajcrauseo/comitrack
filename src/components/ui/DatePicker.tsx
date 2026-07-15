"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const DAYS_OF_WEEK = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  id?: string;
}

export function DatePicker({ value, onChange, id }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = parseLocalDate(value);
  const today = new Date();

  const [viewYear, setViewYear] = useState(
    selected ? selected.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selected ? selected.getMonth() : today.getMonth()
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync view when value changes externally
  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  }, [value]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number; currentMonth: boolean }[] = [];

  // Prev month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, currentMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true });
  }
  // Next month padding to fill up to 42 cells
  let next = 1;
  while (cells.length < 42) {
    cells.push({ day: next++, currentMonth: false });
  }

  const isSelected = (cell: { day: number; currentMonth: boolean }) => {
    if (!selected || !cell.currentMonth) return false;
    return (
      selected.getFullYear() === viewYear &&
      selected.getMonth() === viewMonth &&
      selected.getDate() === cell.day
    );
  };

  const isToday = (cell: { day: number; currentMonth: boolean }) => {
    if (!cell.currentMonth) return false;
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === cell.day
    );
  };

  const handleSelect = (cell: { day: number; currentMonth: boolean }) => {
    let y = viewYear;
    let m = viewMonth;
    if (!cell.currentMonth) {
      if (cells.indexOf(cell) < 7) {
        // prev month
        if (m === 0) { m = 11; y--; } else { m--; }
      } else {
        // next month
        if (m === 11) { m = 0; y++; } else { m++; }
      }
    }
    const picked = new Date(y, m, cell.day);
    onChange(formatISO(picked));
    setOpen(false);
  };

  const displayLabel = selected
    ? selected.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Seleccionar fecha";

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between gap-2 transition-colors hover:border-slate-700"
      >
        <span className={selected ? "text-slate-200" : "text-slate-500"}>
          {displayLabel}
        </span>
        <CalendarDays className="h-4 w-4 text-slate-500 shrink-0" />
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div
          className="absolute z-50 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3"
          style={{
            minWidth: "260px",
            animation: "calendarIn 0.15s ease-out",
          }}
        >
          {/* Month/Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-slate-200">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold uppercase text-slate-500 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((cell, idx) => {
              const selected_ = isSelected(cell);
              const today_ = isToday(cell);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(cell)}
                  className={[
                    "h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-all",
                    selected_
                      ? "bg-blue-600 text-white shadow-md shadow-blue-900/50"
                      : today_
                      ? "text-blue-400 border border-blue-500/40 hover:bg-slate-800"
                      : cell.currentMonth
                      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                      : "text-slate-600 hover:bg-slate-800/50 hover:text-slate-400",
                  ].join(" ")}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                onChange(formatISO(today));
                setViewYear(today.getFullYear());
                setViewMonth(today.getMonth());
                setOpen(false);
              }}
              className="w-full text-xs text-center text-blue-400 hover:text-blue-300 py-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              Hoy
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes calendarIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
