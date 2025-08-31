import React, { useMemo, useRef, useEffect, useState } from 'react';
import { toYYYYMMDD, formatCurrency, isColorLight, formatDisplayAmount } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';

interface CalendarHeatmapProps {
  month: Date; // A date within the month to display
  data: Map<string, number>; // Key: 'YYYY-MM-DD', Value: total spending
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
}

const getGradientColor = (percentage: number): string => {
    // A multi-stop gradient inspired by thermographic maps.
    const stops = [
        { p: 0.0,  color: { r: 96, g: 165, b: 250 } },  // blue-400
        { p: 0.33, color: { r: 52, g: 211, b: 153 } }, // emerald-400
        { p: 0.66, color: { r: 250, g: 204, b: 21 } },  // yellow-400
        { p: 1.0,  color: { r: 248, g: 113, b: 113 } }  // red-400
    ];

    if (percentage <= 0) {
        return `rgb(241, 245, 249)`; // slate-100 for zero spending
    }

    for (let i = 0; i < stops.length - 1; i++) {
        const start = stops[i];
        const end = stops[i + 1];

        if (percentage >= start.p && percentage <= end.p) {
            const t = (percentage - start.p) / (end.p - start.p);
            const r = Math.round(start.color.r + t * (end.color.r - start.color.r));
            const g = Math.round(start.color.g + t * (end.color.g - start.color.g));
            const b = Math.round(start.color.b + t * (end.color.b - start.color.b));
            return `rgb(${r}, ${g}, ${b})`;
        }
    }
    
    const lastStop = stops[stops.length - 1].color;
    return `rgb(${lastStop.r}, ${lastStop.g}, ${lastStop.b})`;
};

const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ month: displayMonth, data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: '' });
  const { currency, rates, settings } = useCurrency();

  const { year, month, calendarDays, maxValue, monthName } = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const monthNames = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 

    const calendarDays: ({ day: number, date: Date | null, value?: number })[][] = Array.from({ length: 6 }, () => []);
    
    let currentDay = 1;

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if ((row === 0 && col < startDayOfWeek) || currentDay > daysInMonth) {
          calendarDays[row][col] = { day: 0, date: null };
        } else {
          const date = new Date(year, month, currentDay);
          const dateKey = toYYYYMMDD(date);
          const value = data.get(dateKey) || 0;
          calendarDays[row][col] = { day: currentDay, date, value };
          currentDay++;
        }
      }
    }
    
    const monthValues = Array.from(data.keys())
        .filter((key: string) => key.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
        .map(key => data.get(key) || 0);

    const maxValue = monthValues.length > 0 ? Math.max(...monthValues) : 0;
    
    return { year, month, calendarDays, maxValue, monthName: monthNames[month] };
  }, [displayMonth, data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId: number | null = null;

    const draw = () => {
        const { width, height } = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio;
        
        if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }

        const cellWidth = width / 7;
        const cellHeight = height / 7; // 1 row for labels, 6 for days
        const cellPadding = 2;

        ctx.clearRect(0, 0, width, height);

        // Draw day labels
        const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#64748b'; // slate-500
        daysOfWeek.forEach((day, i) => {
            ctx.fillText(day, i * cellWidth + cellWidth / 2, cellHeight / 2);
        });

        // Draw day cells
        const maxLog = maxValue > 0 ? Math.log(maxValue + 1) : 0;
        
        calendarDays.forEach((week, rowIndex) => {
            week.forEach((day, colIndex) => {
                if (!day.date) return;
                
                const value = day.value || 0;
                const percentage = maxLog > 0 ? Math.log(value + 1) / maxLog : 0;
                
                const cellColor = getGradientColor(percentage);
                ctx.fillStyle = cellColor;
                ctx.beginPath();
                ctx.roundRect(
                    colIndex * cellWidth + cellPadding, 
                    (rowIndex + 1) * cellHeight + cellPadding, 
                    cellWidth - cellPadding * 2, 
                    cellHeight - cellPadding * 2,
                    4 // border radius
                );
                ctx.fill();

                ctx.fillStyle = isColorLight(cellColor) ? '#1e293b' : '#ffffff'; // slate-900 or white
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(day.day.toString(), colIndex * cellWidth + cellWidth / 2, (rowIndex + 1) * cellHeight + cellHeight / 2);
            });
        });
    };
    
    const resizeObserver = new ResizeObserver(() => {
        if (animationFrameId) {
            window.cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = window.requestAnimationFrame(draw);
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }
    
    draw();

    return () => {
        resizeObserver.disconnect();
        if (animationFrameId) {
            window.cancelAnimationFrame(animationFrameId);
        }
    };
  }, [calendarDays, maxValue]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const { width, height } = canvas.getBoundingClientRect();
    const cellWidth = width / 7;
    const cellHeight = height / 7;
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight) - 1;

    if (row >= 0 && row < 6 && col >= 0 && col < 7) {
        const day = calendarDays[row][col];
        if (day?.date) {
            const formattedDate = day.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
            const formattedAmount = formatDisplayAmount({
                amountInUah: day.value || 0,
                targetCurrency: currency,
                rates,
                settings,
            });
            setTooltip({
                visible: true,
                x: x,
                y: y - 10,
                content: `<strong>${formattedDate}</strong><br/>Витрати: ${formattedAmount}`,
            });
        } else {
            setTooltip({ ...tooltip, visible: false });
        }
    } else {
        setTooltip({ ...tooltip, visible: false });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
        <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
            className="w-full h-full cursor-pointer"
        />
        {tooltip.visible && (
            <div
                className="absolute p-2 text-xs text-white bg-slate-800 rounded-md shadow-lg pointer-events-none transform -translate-y-full -translate-x-1/2"
                style={{ top: tooltip.y, left: tooltip.x }}
                dangerouslySetInnerHTML={{ __html: tooltip.content }}
            />
        )}
    </div>
  );
};

export default CalendarHeatmap;
