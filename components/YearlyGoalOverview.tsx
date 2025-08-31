
import React, { useMemo } from 'react';
import { MonthlyGoals, Transaction } from '../types';
import { getMonthKey, getStartOfMonth, getEndOfMonth } from '../helpers';

interface YearlyGoalOverviewProps {
  monthlyGoals: MonthlyGoals;
  transactions: Transaction[];
  year: number;
}

const getAchievementColor = (percentage: number | null): string => {
    if (percentage === null) return 'bg-slate-100 text-slate-400';
    if (percentage >= 100) return 'bg-green-500 text-white';
    if (percentage >= 90) return 'bg-green-300 text-green-800';
    if (percentage >= 70) return 'bg-yellow-300 text-yellow-800';
    if (percentage >= 50) return 'bg-orange-400 text-orange-800';
    return 'bg-red-400 text-white';
};

const YearlyGoalOverview: React.FC<YearlyGoalOverviewProps> = ({ monthlyGoals, transactions, year }) => {
  const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];

  const yearlyData = useMemo(() => {
    const incomeByMonth: { [monthKey: string]: number } = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        const monthKey = getMonthKey(new Date(t.date));
        incomeByMonth[monthKey] = (incomeByMonth[monthKey] || 0) + t.amount;
      }
    });

    return months.map((monthName, index) => {
      const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
      const goal = monthlyGoals[monthKey]?.totalGoal;
      const received = incomeByMonth[monthKey] || 0;
      
      let percentage: number | null = null;
      if (goal && goal > 0) {
        percentage = (received / goal) * 100;
      } else {
        // If no goal is set, but there was income, we can't calculate a percentage
        // If it's a past month and no goal was set, it's just gray.
        const isPastOrCurrentMonth = new Date() >= new Date(year, index, 1);
        if(!isPastOrCurrentMonth) percentage = null; // Future months are gray
        // else, past months without goals are also gray (null percentage)
      }

      return {
        name: monthName,
        percentage: percentage,
      };
    });
  }, [year, monthlyGoals, transactions]);

  return (
    <div className="border-t border-slate-200 pt-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Огляд року: {year}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {yearlyData.map(({ name, percentage }) => {
          const colorClass = getAchievementColor(percentage);
          return (
            <div key={name} className={`p-4 rounded-lg text-center ${colorClass} shadow-sm`}>
              <p className="font-bold">{name}</p>
              <p className="text-sm font-mono">{percentage !== null ? `${percentage.toFixed(0)}%` : '-'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YearlyGoalOverview;