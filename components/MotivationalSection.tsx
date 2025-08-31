

import React, { useMemo } from 'react';
import { Transaction, MonthlyGoals, MonthlyGoal } from '../types';
import { formatDisplayAmount, getMonthKey } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { LightBulbIcon, StarIcon, FireIcon, TrophyIcon } from './icons';

interface MotivationalSectionProps {
    transactions: Transaction[];
    monthlyGoals: MonthlyGoals;
    currentMonthGoal: MonthlyGoal;
    totalReceivedThisMonth: number;
}

const getMotivationalMessage = (received: number, goal: number): { message: string, remark: string } => {
    if (goal <= 0) {
        return { message: "Поставте собі ціль!", remark: "Визначте, скільки ви хочете заробити цього місяця, щоб почати." };
    }
    const progress = received / goal;
    if (progress >= 1.2) {
        return { message: "Неймовірна робота!", remark: "Ви встановлюєте нові стандарти для себе. Так тримати!" };
    }
    if (progress >= 1) {
        return { message: "Ціль досягнуто!", remark: "Ви це зробили! Чудовий результат, пишайтеся собою." };
    }
    if (progress >= 0.9) {
        return { message: "Майже geschafft!", remark: "Ви так близько! Зробіть останній ривок до перемоги." };
    }
    if (progress >= 0.5) {
        return { message: "Продовжуйте в тому ж дусі!", remark: "Ви на правильному шляху. Кожен крок має значення." };
    }
    return { message: "Початок покладено", remark: "Кожна велика подорож починається з одного кроку. У вас все вийде!" };
};

const getConsecutiveStreaks = (dates: Set<string>): number[] => {
    if (dates.size === 0) return [];
    const sortedDates = Array.from(dates).sort();
    const streaks: number[] = [];
    let currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1] + '-01');
        const current = new Date(sortedDates[i] + '-01');
        const expectedNextMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
        if (current.getTime() === expectedNextMonth.getTime()) {
            currentStreak++;
        } else {
            streaks.push(currentStreak);
            currentStreak = 1;
        }
    }
    streaks.push(currentStreak);
    return streaks;
}

const MotivationalSection: React.FC<MotivationalSectionProps> = ({ transactions, monthlyGoals, currentMonthGoal, totalReceivedThisMonth }) => {
    const { currency, rates, settings } = useCurrency();

    const personalRecords = useMemo(() => {
        const incomeByMonth = new Map<string, number>();
        let totalIncome = 0;
        
        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
                const monthKey = getMonthKey(new Date(t.date));
                incomeByMonth.set(monthKey, (incomeByMonth.get(monthKey) || 0) + t.amount);
            }
        });
        
        const bestMonthEntry = [...incomeByMonth.entries()].reduce((best, current) => current[1] > best[1] ? current : best, ['', 0]);
        const bestMonth = {
            month: bestMonthEntry[0],
            amount: bestMonthEntry[1],
        };

        const monthlyGoalsMet = new Set<string>();
        Object.keys(monthlyGoals).forEach(monthKey => {
            const goal = monthlyGoals[monthKey]?.totalGoal || 0;
            const income = incomeByMonth.get(monthKey) || 0;
            if (goal > 0 && income >= goal) {
                monthlyGoalsMet.add(monthKey);
            }
        });
        const streaks = getConsecutiveStreaks(monthlyGoalsMet);
        const longestStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
        
        return { bestMonth, longestStreak, totalIncome };
    }, [transactions, monthlyGoals]);

    const motivationalMessage = getMotivationalMessage(totalReceivedThisMonth, currentMonthGoal.totalGoal);

    return (
        <div className="border-t border-slate-200 pt-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Моя мотивація та натхнення</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Motivation & Message */}
                <div className="space-y-6">
                    {currentMonthGoal.motivation && (
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-500 text-sm">Моя ціль на цей місяць</h3>
                            <p className="text-lg text-slate-800 mt-2 italic">"{currentMonthGoal.motivation}"</p>
                        </div>
                    )}
                     <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-900 p-6 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <LightBulbIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-bold">{motivationalMessage.message}</h3>
                                <div className="mt-2 text-sm">
                                    <p>{motivationalMessage.remark}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Records */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                     <h3 className="text-lg font-bold text-slate-800 mb-2">Особисті рекорди</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <TrophyIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Найкращий місяць ({personalRecords.bestMonth.month ? new Date(personalRecords.bestMonth.month + '-02').toLocaleString('uk-UA', { month: 'long', year: 'numeric' }) : 'N/A'})</p>
                            <p className="font-semibold text-slate-800">{formatDisplayAmount({ amountInUah: personalRecords.bestMonth.amount, targetCurrency: currency, rates, settings })}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <FireIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Найдовша серія</p>
                            <p className="font-semibold text-slate-800">{personalRecords.longestStreak} міс. поспіль</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <StarIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Всього зароблено</p>
                            <p className="font-semibold text-slate-800">{formatDisplayAmount({ amountInUah: personalRecords.totalIncome, targetCurrency: currency, rates, settings })}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MotivationalSection;