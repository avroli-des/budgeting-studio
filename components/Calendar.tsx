
import React, { useState } from 'react';
import { ChevronDownIcon } from './icons';

interface CalendarProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  align?: 'left' | 'right';
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelect, align = 'left' }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  const calendarDays = [];
  const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({ day: lastDayOfPrevMonth - i, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, isCurrentMonth: true });
  }

  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false });
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(year, month, day);
    onSelect(newDate);
  };
  
  const changeMonth = (offset: number) => {
      setViewDate(new Date(year, month + offset, 1));
  };

  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const alignmentClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className={`absolute top-full mt-1 z-10 bg-white rounded-lg shadow-xl border border-slate-200 p-4 w-72 ${alignmentClass}`}>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronDownIcon className="w-5 h-5 rotate-90 text-slate-600" />
        </button>
        <div className="text-sm font-semibold text-slate-800">{monthNames[month]} {year}</div>
        <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronDownIcon className="w-5 h-5 -rotate-90 text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {daysOfWeek.map(day => (
          <div key={day} className="font-medium text-slate-500 py-1">{day}</div>
        ))}
        {calendarDays.map((d, index) => {
          const isSelected = d.isCurrentMonth && 
                             d.day === selectedDate.getDate() && 
                             month === selectedDate.getMonth() && 
                             year === selectedDate.getFullYear();

          const isToday = d.isCurrentMonth &&
                          d.day === new Date().getDate() &&
                          month === new Date().getMonth() &&
                          year === new Date().getFullYear();

          const buttonClasses = `w-8 h-8 flex items-center justify-center rounded-full transition-colors text-sm ${
            !d.isCurrentMonth ? 'text-slate-300 cursor-default' : 
            isSelected ? 'bg-blue-600 text-white font-semibold' :
            isToday ? 'bg-slate-100 text-slate-900' :
            'hover:bg-blue-100'
          }`;

          return (
            <button
              type="button"
              key={index}
              onClick={() => d.isCurrentMonth && handleDateClick(d.day)}
              className={buttonClasses}
              disabled={!d.isCurrentMonth}
            >
              {d.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
