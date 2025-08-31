

import React from 'react';
import { MonthlyGoal } from '../types';
import { formatDisplayAmount, getGoalStatus } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { FlagIcon, TrendingUpIcon, CalendarIcon } from './icons';

interface MonthlyGoalProgressProps {
    totalReceived: number;
    goal: MonthlyGoal;
    month: Date;
    onSetGoal: () => void;
}

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; }> = ({ label, value, icon }) => (
    <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const MonthlyGoalProgress: React.FC<MonthlyGoalProgressProps> = ({ totalReceived, goal, month, onSetGoal }) => {
    const { currency, rates, settings } = useCurrency();
    const { totalGoal = 0 } = goal;

    const progress = totalGoal > 0 ? Math.min((totalReceived / totalGoal) * 100, 100) : 0;
    const { status, color, projection } = getGoalStatus(totalReceived, totalGoal, month);

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth();
    const daysRemaining = isCurrentMonth ? daysInMonth - today.getDate() : daysInMonth;

    const colorClasses = {
        green: 'text-green-500',
        yellow: 'text-yellow-500',
        red: 'text-red-500',
        slate: 'text-slate-400'
    };
    const ringColorClass = colorClasses[color as keyof typeof colorClasses] || 'text-slate-400';
    const bgColorClass = ringColorClass.replace('text', 'bg').replace('-500', '-100');

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Progress Circle */}
                <div className="flex justify-center items-center">
                    <div className="relative w-48 h-48">
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                            {/* Background Circle */}
                            <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="20" className="stroke-slate-200" />
                            {/* Progress Circle */}
                            <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="20"
                                strokeLinecap="round"
                                transform="rotate(-90 100 100)"
                                className={`transition-all duration-1000 ease-out ${ringColorClass}`}
                                style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-4xl font-bold text-slate-800">{progress.toFixed(0)}%</span>
                            <span className={`font-semibold ${ringColorClass}`}>{status}</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                            <p className="text-slate-500">Ціль на місяць</p>
                            <p className="text-4xl font-bold text-slate-800">{formatDisplayAmount({ amountInUah: totalGoal, targetCurrency: currency, rates, settings })}</p>
                            <p className="text-slate-500">Отримано: {formatDisplayAmount({ amountInUah: totalReceived, targetCurrency: currency, rates, settings })}</p>
                        </div>
                        <button onClick={onSetGoal} className="mt-2 sm:mt-0 text-sm font-semibold text-blue-600 hover:text-blue-800">
                            {totalGoal > 0 ? 'Редагувати ціль' : 'Встановити ціль'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                         <StatCard 
                            label="Прогноз на місяць"
                            value={formatDisplayAmount({ amountInUah: projection, targetCurrency: currency, rates, settings })}
                            icon={<TrendingUpIcon className="w-5 h-5 text-slate-500" />}
                        />
                        <StatCard 
                            label="Залишилось днів"
                            value={String(daysRemaining)}
                            icon={<CalendarIcon className="w-5 h-5 text-slate-500" />}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyGoalProgress;