import React, { useState } from 'react';
import { ChevronDownIcon } from './icons';

interface MonthYearPickerProps {
  currentDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ currentDate, onSelect, onClose }) => {
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());
  
  const months = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const handleMonthClick = (monthIndex: number) => {
    onSelect(new Date(viewYear, monthIndex, 1));
  };

  return (
    // Position it absolutely relative to its parent container on BudgetPage
    <div className="absolute top-full mt-2 z-10 bg-white rounded-lg shadow-xl border border-slate-200 p-4 w-72">
      {/* Year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewYear(y => y - 1)} className="p-1 rounded-full hover:bg-slate-200">
          <ChevronDownIcon className="w-5 h-5 rotate-90" />
        </button>
        <span className="text-lg font-semibold">{viewYear}</span>
        <button onClick={() => setViewYear(y => y + 1)} className="p-1 rounded-full hover:bg-slate-200">
          <ChevronDownIcon className="w-5 h-5 -rotate-90" />
        </button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => {
          const isSelected = index === currentDate.getMonth() && viewYear === currentDate.getFullYear();
          return (
            <button
              key={month}
              onClick={() => handleMonthClick(index)}
              className={`p-2 text-sm rounded-md transition-colors ${
                isSelected 
                  ? 'bg-blue-600 text-white font-semibold' 
                  : 'hover:bg-slate-100'
              }`}
            >
              {months[index].substring(0,3)}
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default MonthYearPicker;
