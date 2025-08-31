import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler, DoughnutController,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Transaction, IncomeSource, MonthlyGoals } from '../types';
import { formatDisplayAmount, getMonthKey, getMonthKeysInRange, formatChartAxis } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { ChevronDownIcon, ChartBarSquareIcon, ScaleIcon, CheckBadgeIcon, TrendingUpIcon } from './icons';

ChartJS.register( CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler, DoughnutController );

type Period = '6m' | '12m' | 'all';
const chartColors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1'];

interface IncomeAnalyticsProps {
  transactions: Transaction[];
  incomeSources: IncomeSource[];
  monthlyGoals: MonthlyGoals;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-100/80 p-4 rounded-lg flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode; placeholder?: boolean }> = ({ title, children, placeholder = false }) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 min-h-[380px] flex flex-col">
    <h3 className="text-base font-semibold text-slate-800 mb-4 text-center">{title}</h3>
    <div className="flex-grow h-64 relative">
      {placeholder ? (
        <div className="flex items-center justify-center h-full text-slate-500">
          Недостатньо даних для відображення
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

const IncomeAnalytics: React.FC<IncomeAnalyticsProps> = ({ transactions, incomeSources, monthlyGoals }) => {
    const [period, setPeriod] = useState<Period>('6m');
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { currency, rates, settings } = useCurrency();
    const incomeSourcesById = useMemo(() => new Map(incomeSources.map(s => [s.id, s])), [incomeSources]);

    const processedData = useMemo(() => {
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        if (incomeTransactions.length === 0) return null;

        const earliestDate = period === 'all' 
            ? incomeTransactions.reduce((earliest, t) => new Date(t.date) < earliest ? new Date(t.date) : earliest, new Date())
            : (() => {
                const now = new Date();
                const monthsToGoBack = period === '6m' ? 5 : 11;
                return new Date(now.getFullYear(), now.getMonth() - monthsToGoBack, 1);
            })();

        const endDate = new Date();
        const monthKeys = getMonthKeysInRange(earliestDate, endDate);
        
        const incomeByMonth = new Map<string, number>();
        const goalsByMonth = new Map<string, number>();
        const incomeBySource = new Map<string, number>();

        monthKeys.forEach(key => {
            incomeByMonth.set(key, 0);
            goalsByMonth.set(key, monthlyGoals[key]?.totalGoal || 0);
        });

        incomeTransactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate >= earliestDate && tDate <= endDate) {
                const monthKey = getMonthKey(tDate);
                incomeByMonth.set(monthKey, (incomeByMonth.get(monthKey) || 0) + t.amount);
                if (t.incomeSourceId) {
                    incomeBySource.set(t.incomeSourceId, (incomeBySource.get(t.incomeSourceId) || 0) + t.amount);
                }
            }
        });

        return { monthKeys, incomeByMonth, goalsByMonth, incomeBySource };
    }, [period, transactions, monthlyGoals]);

    const analyticsMetrics = useMemo(() => {
        if (!processedData) return null;
        const { monthKeys, incomeByMonth, goalsByMonth } = processedData;

        const totalIncome = Array.from(incomeByMonth.values()).reduce((sum: number, val: number) => sum + val, 0);
        const averageMonthlyIncome = totalIncome / monthKeys.length;

        let monthsWithGoals = 0;
        let monthsGoalsMet = 0;
        monthKeys.forEach(key => {
            const goal = goalsByMonth.get(key) || 0;
            if (goal > 0) {
                monthsWithGoals++;
                const income = incomeByMonth.get(key) || 0;
                if (income >= goal) {
                    monthsGoalsMet++;
                }
            }
        });
        const goalAchievementRate = monthsWithGoals > 0 ? (monthsGoalsMet / monthsWithGoals) * 100 : 0;
        
        const bestMonthEntry = Array.from(incomeByMonth.entries()).reduce<[string, number]>((best, current) => (current[1] > best[1] ? current : best), ['', 0]);
        const bestMonth = {
            month: bestMonthEntry[0],
            amount: bestMonthEntry[1],
        };

        return { totalIncome, averageMonthlyIncome, goalAchievementRate, bestMonth };
    }, [processedData]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context: any) => `${context.dataset.label || ''}: ${formatDisplayAmount({ amountInUah: context.parsed.y, targetCurrency: currency, rates, settings, simple: true })}`,
                },
            },
        },
        scales: {
            y: { ticks: { callback: (value: any) => formatChartAxis(value, currency, rates) } },
        },
    }), [currency, rates, settings]);

    const incomeTimelineData = useMemo(() => {
        if (!processedData) return null;
        const labels = processedData.monthKeys.map(key => new Date(key + '-02').toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' }));
        return {
            labels,
            datasets: [{
                label: 'Дохід',
                data: Array.from(processedData.incomeByMonth.values()),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.3,
            }],
        };
    }, [processedData]);
    
    const goalVsActualData = useMemo(() => {
        if (!processedData) return null;
        const labels = processedData.monthKeys.map(key => new Date(key + '-02').toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' }));
        return {
            labels,
            datasets: [
                { label: 'Ціль', data: Array.from(processedData.goalsByMonth.values()), backgroundColor: '#a5b4fc' },
                { label: 'Фактично', data: Array.from(processedData.incomeByMonth.values()), backgroundColor: '#4f46e5' },
            ],
        };
    }, [processedData]);

    const sourceContributionData = useMemo(() => {
        if (!processedData || processedData.incomeBySource.size === 0) return null;
        const labels = Array.from(processedData.incomeBySource.keys()).map(id => incomeSourcesById.get(id)?.name || 'Невідомо');
        const data = Array.from(processedData.incomeBySource.values());
        return {
            labels,
            datasets: [{ data, backgroundColor: chartColors }],
        };
    }, [processedData, incomeSourcesById]);


    return (
        <div className="border-t border-slate-200 pt-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full p-4 flex justify-between items-center hover:bg-slate-50"
                >
                    <h2 className="text-2xl font-bold text-slate-800">Аналітика та інсайти</h2>
                    <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>

                {!isCollapsed && (
                    <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-200 space-y-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-600 mr-2">Період:</span>
                            {(['6m', '12m', 'all'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1 text-sm rounded-full transition-colors ${period === p ? 'bg-blue-600 text-white font-semibold' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'}`}
                                >
                                    {p === '6m' ? '6 міс.' : p === '12m' ? '12 міс.' : 'Весь час'}
                                </button>
                            ))}
                        </div>
                        
                        {!processedData || !analyticsMetrics ? (
                            <p className="text-center text-slate-500 py-8">Недостатньо даних для аналізу за цей період.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <StatCard title="Сер. місячний дохід" value={formatDisplayAmount({ amountInUah: analyticsMetrics.averageMonthlyIncome, targetCurrency: currency, rates, settings })} icon={<ScaleIcon className="w-6 h-6 text-slate-500"/>} />
                                    <StatCard title="Виконання цілей" value={`${analyticsMetrics.goalAchievementRate.toFixed(0)}%`} icon={<CheckBadgeIcon className="w-6 h-6 text-green-500"/>} />
                                    <StatCard title="Найкращий місяць" value={analyticsMetrics.bestMonth.amount > 0 ? formatDisplayAmount({ amountInUah: analyticsMetrics.bestMonth.amount, targetCurrency: currency, rates, settings }) : '-'} icon={<TrendingUpIcon className="w-6 h-6 text-blue-500"/>} />
                                </div>
                                <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-900 p-4 rounded-r-lg">
                                    <h4 className="font-bold">Ключові інсайти</h4>
                                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                                        <li>Ваш середній дохід за останні {period === '6m' ? 6 : period === '12m' ? 12 : processedData.monthKeys.length} місяців склав {formatDisplayAmount({ amountInUah: analyticsMetrics.averageMonthlyIncome, targetCurrency: currency, rates, settings })}.</li>
                                        <li>Ви досягли своєї фінансової цілі у {analyticsMetrics.goalAchievementRate.toFixed(0)}% місяців (коли ціль була встановлена).</li>
                                        {analyticsMetrics.bestMonth.amount > 0 && <li>Вашим найприбутковішим місяцем був {new Date(analyticsMetrics.bestMonth.month + '-02').toLocaleString('uk-UA', { month: 'long', year: 'numeric' })}.</li>}
                                        {sourceContributionData && sourceContributionData.labels.length > 0 && <li>Ваше основне джерело доходу - "{sourceContributionData.labels[0]}".</li>}
                                    </ul>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <ChartContainer title="Динаміка доходів" placeholder={!incomeTimelineData}>
                                        {incomeTimelineData && <Line data={incomeTimelineData} options={chartOptions as any} />}
                                    </ChartContainer>
                                    <ChartContainer title="Ціль vs Фактичний дохід" placeholder={!goalVsActualData}>
                                        {goalVsActualData && <Bar data={goalVsActualData} options={chartOptions as any} />}
                                    </ChartContainer>
                                    <ChartContainer title="Дохід за джерелами" placeholder={!sourceContributionData}>
                                        {sourceContributionData && <Doughnut data={sourceContributionData} options={{...chartOptions, plugins: {...chartOptions.plugins, legend: { display: true, position: 'bottom' }, tooltip: { callbacks: { label: (context: any) => `${context.label || ''}: ${formatDisplayAmount({ amountInUah: context.parsed, targetCurrency: currency, rates, settings, simple: true })}` }}}}} />}
                                    </ChartContainer>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncomeAnalytics;
