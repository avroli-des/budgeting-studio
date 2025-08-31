import React from 'react';
import { getStartOfMonth, getEndOfMonth, getStartOfYear, getEndOfYear } from '../helpers';

interface DateRangeFilterProps {
  value: { startDate: Date; endDate: Date };
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  
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
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const dateValue = e.target.value;
    if (!dateValue) {
      // Do not update state if input is cleared, to prevent an invalid date.
      return;
    }

    const newDate = new Date(dateValue);
    // Also check for invalid date formats that `new Date` might not parse correctly.
    if (isNaN(newDate.getTime())) {
      return;
    }
    
    // Adjust for timezone offset to prevent day-before issues
    const adjustedDate = new Date(newDate.valueOf() + newDate.getTimezoneOffset() * 60 * 1000);
    
    if (type === 'start') {
        onChange({ startDate: adjustedDate, endDate: value.endDate });
    } else {
        // Set to end of day
        adjustedDate.setHours(23,59,59,999);
        onChange({ startDate: value.startDate, endDate: adjustedDate });
    }
  };

  const toInputFormat = (date: Date) => date.toISOString().split('T')[0];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600 mr-2">Період:</span>
        <button onClick={() => handlePresetClick('this_month')} className="px-3 py-1 text-sm rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">Цей місяць</button>
        <button onClick={() => handlePresetClick('last_month')} className="px-3 py-1 text-sm rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">Минулий місяць</button>
        <button onClick={() => handlePresetClick('last_6_months')} className="px-3 py-1 text-sm rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">Останні 6 міс.</button>
        <button onClick={() => handlePresetClick('this_year')} className="px-3 py-1 text-sm rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">Цей рік</button>
        <button onClick={() => handlePresetClick('last_year')} className="px-3 py-1 text-sm rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">Минулий рік</button>
      </div>
      <div className="flex items-center gap-2">
         <input
            type="date"
            value={toInputFormat(value.startDate)}
            onChange={(e) => handleDateChange(e, 'start')}
            className="px-3 py-2 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-slate-900"
        />
        <span className="text-slate-500">-</span>
         <input
            type="date"
            value={toInputFormat(value.endDate)}
            onChange={(e) => handleDateChange(e, 'end')}
            className="px-3 py-2 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-slate-900"
        />
      </div>
    </div>
  );
};

export default DateRangeFilter;