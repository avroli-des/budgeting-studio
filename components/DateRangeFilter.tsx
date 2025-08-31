import React, { useState, useRef, useEffect } from 'react';
import { getStartOfMonth, getEndOfMonth, getStartOfYear, getEndOfYear } from '../helpers';
import Calendar from './Calendar';
import { CalendarIcon } from './icons';

interface DateRangeFilterProps {
  value: { startDate: Date; endDate: Date };
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

// Helper to compare dates (ignoring time)
const datesAreEqual = (d1: Date, d2: Date): boolean => {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const [pickerOpen, setPickerOpen] = useState<'start' | 'end' | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setPickerOpen(null);
      }
    };
    if (pickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pickerOpen]);
  
  // Effect to determine active preset from the date range value
  useEffect(() => {
    const now = new Date();
    let matched: string | null = null;
    
    const presets: { [key: string]: { start: Date; end: Date } } = {
        this_month: { start: getStartOfMonth(now), end: getEndOfMonth(now) },
        last_month: { start: getStartOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)), end: getEndOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)) },
        '2_months_ago': { start: getStartOfMonth(new Date(now.getFullYear(), now.getMonth() - 2, 1)), end: getEndOfMonth(new Date(now.getFullYear(), now.getMonth() - 2, 1)) },
        '3_months_ago': { start: getStartOfMonth(new Date(now.getFullYear(), now.getMonth() - 3, 1)), end: getEndOfMonth(new Date(now.getFullYear(), now.getMonth() - 3, 1)) },
        last_6_months: { start: getStartOfMonth(new Date(now.getFullYear(), now.getMonth() - 5, 1)), end: getEndOfMonth(now) },
        this_year: { start: getStartOfYear(now), end: getEndOfYear(now) },
        last_year: { start: getStartOfYear(new Date(now.getFullYear() - 1, 0, 1)), end: getEndOfYear(new Date(now.getFullYear() - 1, 0, 1)) }
    };

    for (const key in presets) {
        if (datesAreEqual(value.startDate, presets[key].start) && datesAreEqual(value.endDate, presets[key].end)) {
            matched = key;
            break;
        }
    }
    setActivePreset(matched);
  }, [value]);

  const handlePresetClick = (preset: string) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (preset) {
      case 'this_month':
        startDate = getStartOfMonth(now);
        endDate = getEndOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = getStartOfMonth(lastMonth);
        endDate = getEndOfMonth(lastMonth);
        break;
      case '2_months_ago':
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        startDate = getStartOfMonth(twoMonthsAgo);
        endDate = getEndOfMonth(twoMonthsAgo);
        break;
      case '3_months_ago':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        startDate = getStartOfMonth(threeMonthsAgo);
        endDate = getEndOfMonth(threeMonthsAgo);
        break;
      case 'last_6_months':
        endDate = getEndOfMonth(now);
        startDate = getStartOfMonth(new Date(now.getFullYear(), now.getMonth() - 5, 1));
        break;
      case 'this_year':
        startDate = getStartOfYear(now);
        endDate = getEndOfYear(now);
        break;
      case 'last_year':
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        startDate = getStartOfYear(lastYear);
        endDate = getEndOfYear(lastYear);
        break;
    }
    onChange({ startDate, endDate });
    setPickerOpen(null);
  };
  
  const handleDateSelect = (newDate: Date, type: 'start' | 'end') => {
    let newStartDate = value.startDate;
    let newEndDate = value.endDate;

    if (type === 'start') {
        newStartDate = newDate;
        if(newDate > newEndDate) {
            newEndDate = newDate; // Ensure end date is not before start date
        }
    } else {
        newEndDate = newDate;
        newEndDate.setHours(23, 59, 59, 999); // Ensure end date includes the full day
        if(newEndDate < newStartDate) {
            newStartDate = newEndDate; // Ensure start date is not after end date
        }
    }
    onChange({ startDate: newStartDate, endDate: newEndDate });
    setPickerOpen(null);
  };
  
  const toDisplayFormat = (d: Date): string => {
    return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d);
  };
  
  const toButtonFormat = (d: Date): string => {
    return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  };
  
  const inactiveClass = "px-3 py-1 text-sm rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors";
  const activeClass = "px-3 py-1 text-sm rounded-full bg-blue-600 text-white font-semibold shadow-sm";

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4" ref={containerRef}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600 mr-2">Швидкий вибір:</span>
        <button onClick={() => handlePresetClick('this_month')} className={activePreset === 'this_month' ? activeClass : inactiveClass}>Цей місяць</button>
        <button onClick={() => handlePresetClick('last_month')} className={activePreset === 'last_month' ? activeClass : inactiveClass}>Минулий місяць</button>
        <button onClick={() => handlePresetClick('2_months_ago')} className={activePreset === '2_months_ago' ? activeClass : inactiveClass}>2 місяці тому</button>
        <button onClick={() => handlePresetClick('3_months_ago')} className={activePreset === '3_months_ago' ? activeClass : inactiveClass}>3 місяці тому</button>
        <button onClick={() => handlePresetClick('last_6_months')} className={activePreset === 'last_6_months' ? activeClass : inactiveClass}>Останні 6 міс.</button>
        <button onClick={() => handlePresetClick('this_year')} className={activePreset === 'this_year' ? activeClass : inactiveClass}>Цей рік</button>
        <button onClick={() => handlePresetClick('last_year')} className={activePreset === 'last_year' ? activeClass : inactiveClass}>Минулий рік</button>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 font-medium">
          <CalendarIcon className="h-5 w-5 text-slate-500" />
          <span className="text-slate-800">{toDisplayFormat(value.startDate)}</span>
          <span className="text-slate-500">-</span>
          <span className="text-slate-800">{toDisplayFormat(value.endDate)}</span>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative">
               <button
                  type="button"
                  onClick={() => setPickerOpen(pickerOpen === 'start' ? null : 'start')}
                  className="relative w-36 cursor-pointer rounded-md border border-slate-300 bg-white pl-3 pr-8 py-2 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  <span className="block truncate">{toButtonFormat(value.startDate)}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </button>
                {pickerOpen === 'start' && (
                  <Calendar
                    selectedDate={value.startDate}
                    onSelect={(d) => handleDateSelect(d, 'start')}
                    onClose={() => setPickerOpen(null)}
                  />
                )}
           </div>
          <span className="text-slate-500 hidden sm:inline">-</span>
           <div className="relative">
               <button
                  type="button"
                  onClick={() => setPickerOpen(pickerOpen === 'end' ? null : 'end')}
                  className="relative w-36 cursor-pointer rounded-md border border-slate-300 bg-white pl-3 pr-8 py-2 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  <span className="block truncate">{toButtonFormat(value.endDate)}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </button>
                {pickerOpen === 'end' && (
                  <Calendar
                    selectedDate={value.endDate}
                    onSelect={(d) => handleDateSelect(d, 'end')}
                    onClose={() => setPickerOpen(null)}
                    align="right"
                  />
                )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;