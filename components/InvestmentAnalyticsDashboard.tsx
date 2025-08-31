import React, { useState, useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Transaction, CategoryGroup, InvestmentPlatform } from '../types';
import { formatDisplayAmount, getMonthKey, getMonthKeysInRange, getCurrencyClass, formatChartAxis } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { ChevronDownIcon, ChartBarSquareIcon, ScaleIcon, CheckBadgeIcon, TrendingUpIcon, FireIcon, BanknotesIcon } from './icons';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler, ChartData } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

type Period = '6m' | '12m' | 'all';
const chartColors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1'];

interface InvestmentAnalyticsDashboardProps {
  transactions: Transaction[];
  categoryGroups: CategoryGroup[];
  platforms: InvestmentPlatform[];
  monthlyInvestmentTarget: number;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; helpText?: string }> = ({ title, value, icon, helpText }) => (
    <div className="bg-slate-100/80 p-4 rounded-lg flex items-start gap-4" title={helpText}>
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


const InvestmentAnalyticsDashboard: React.FC<InvestmentAnalyticsDashboardProps> = ({ transactions, categoryGroups, platforms, monthlyInvestmentTarget }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [period, setPeriod] = useState<Period>('12m');
    const { currency, rates, settings } = useCurrency();

    const investmentData = useMemo(() => {
        const investmentCategoryIds = new Set(categoryGroups.find(g => g.name === 'Інвестиції')?.categories.map(c => c.id) || []);
        const allInvestmentTransactions = transactions.filter(t => t.type === 'expense' && t.categoryId && investmentCategoryIds.has(t.categoryId) && t.payee !== "Початковий баланс");
        if (allInvestmentTransactions.length === 0) return null;

        const earliestDate = period === 'all'
            ? allInvestmentTransactions.reduce((earliest, t) => new Date(t.date) < earliest ? new Date(t.date) : earliest, new Date())
            : (() => {
                const now = new Date();
                const monthsToGoBack = period === '6m' ? 5 : 11;
                return new Date(now.getFullYear(), now.getMonth() - monthsToGoBack, 1);
            })();

        const endDate = new Date();
        const monthKeys = getMonthKeysInRange(earliestDate, endDate);

        const investmentsByMonth = new Map<string, number>();
        monthKeys.forEach(key => investmentsByMonth.set(key, 0));

        allInvestmentTransactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate >= earliestDate && tDate <= endDate) {
                const monthKey = getMonthKey(tDate);
                investmentsByMonth.set(monthKey, (investmentsByMonth.get(monthKey) || 0) + t.amount);
            }
        });

        // Metrics
        const totalInvestedInPeriod = Array.from(investmentsByMonth.values()).reduce((sum, val) => sum + val, 0);
        const averageMonthlyInvestment = totalInvestedInPeriod / monthKeys.length;
        
        const monthsWithInvestment = Array.from(investmentsByMonth.values()).filter(v => v > 0).length;
        const consistencyScore = monthKeys.length > 0 ? (monthsWithInvestment / monthKeys.length) * 100 : 0;

        let streak = 0;
        if (monthlyInvestmentTarget > 0) {
            const sortedMonths = [...monthKeys].sort().reverse();
            let streakEnded = false;
            for(const key of sortedMonths) {
                if(!streakEnded && (investmentsByMonth.get(key) || 0) >= monthlyInvestmentTarget) {
                    streak++;
                } else {
                    streakEnded = true;
                }
            }
        }
        
        // Chart Data
        const cumulativeContributionsData = Array.from(investmentsByMonth.values()).reduce((acc, val) => [...acc, (acc.length > 0 ? acc[acc.length - 1] : 0) + val], [] as number[]);
        const contributionsGrowthChart = {
            labels: monthKeys.map(key => new Date(key + '-02').toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' })),
            datasets: [{
                label: 'Загальні внески',
                data: cumulativeContributionsData,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.2,
            }],
        };
        
        const monthlyChart = {
            labels: monthKeys.map(key => new Date(key + '-02').toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' })),
            datasets: [
                { label: 'Інвестовано', data: Array.from(investmentsByMonth.values()), backgroundColor: '#3b82f6' },
                ...(monthlyInvestmentTarget > 0 ? [{ label: 'Ціль', data: Array(monthKeys.length).fill(monthlyInvestmentTarget), backgroundColor: '#a5b4fc', type: 'line' as const, pointRadius: 0, borderWidth: 2, borderColor: '#6366f1' }] : [])
            ]
        };

        const platformAllocationChart = {
            labels: platforms.map(p => p.name),
            datasets: [{
                data: platforms.map(p => p.currentValue || 0),
                backgroundColor: chartColors,
            }],
        };

        const totalCurrentValue = platforms.reduce((sum, p) => sum + (p.currentValue || 0), 0);
        const totalContributionsAllTime = allInvestmentTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalGainLoss = totalCurrentValue - totalContributionsAllTime;

        return {
            totalCurrentValue,
            totalContributionsAllTime,
            totalGainLoss,
            averageMonthlyInvestment,
            consistencyScore,
            streak,
            contributionsGrowthChart,
            monthlyChart,
            platformAllocationChart,
        };
    }, [period, transactions, categoryGroups, platforms, monthlyInvestmentTarget]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context: any) => `${context.dataset.label || ''}: ${formatDisplayAmount({ amountInUah: context.parsed.y || context.parsed, targetCurrency: currency, rates, settings, simple: true })}`,
                },
            },
        },
        scales: {
            y: { ticks: { callback: (value: any) => formatChartAxis(value, currency, rates) } },
        },
    }), [currency, rates, settings]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full p-4 flex justify-between items-center hover:bg-slate-50"
            >
                <div className="flex items-center gap-3">
                    <ChartBarSquareIcon className="w-7 h-7 text-purple-600" />
                    <h2 className="text-2xl font-bold text-slate-800">Аналітика та ефективність</h2>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>
            {!isCollapsed && (
                 <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-200 space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-600 mr-2">Період:</span>
                        {(['6m', '12m', 'all'] as const).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-sm rounded-full transition-colors ${period === p ? 'bg-purple-600 text-white font-semibold' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'}`}>
                                {p === '6m' ? '6 міс.' : p === '12m' ? '12 міс.' : 'Весь час'}
                            </button>
                        ))}
                    </div>

                    {!investmentData ? (
                         <p className="text-center text-slate-500 py-8">Недостатньо даних для аналізу. Додайте транзакції до ваших інвестиційних цілей.</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                               <StatCard title="Загальна вартість" value={formatDisplayAmount({ amountInUah: investmentData.totalCurrentValue, targetCurrency: currency, rates, settings })} icon={<BanknotesIcon className="w-6 h-6 text-purple-600"/>} />
                               <StatCard title="Прибуток / збиток" value={formatDisplayAmount({ amountInUah: investmentData.totalGainLoss, targetCurrency: currency, rates, settings })} icon={<TrendingUpIcon className={`w-6 h-6 ${getCurrencyClass(investmentData.totalGainLoss)}`}/>} />
                               <StatCard title="Загальні внески" value={formatDisplayAmount({ amountInUah: investmentData.totalContributionsAllTime, targetCurrency: currency, rates, settings })} icon={<ScaleIcon className="w-6 h-6 text-slate-500"/>} />
                               <StatCard title="Сер. місячні інвестиції" value={formatDisplayAmount({ amountInUah: investmentData.averageMonthlyInvestment, targetCurrency: currency, rates, settings })} icon={<ScaleIcon className="w-6 h-6 text-slate-500"/>} helpText={`За обраний період: ${period === '6m' ? '6 міс.' : period === '12m' ? '12 міс.' : 'весь час'}`}/>
                               <StatCard title="Коефіцієнт постійності" value={`${investmentData.consistencyScore.toFixed(0)}%`} icon={<CheckBadgeIcon className="w-6 h-6 text-green-500"/>} helpText={`Відсоток місяців з інвестиціями за обраний період`}/>
                               <StatCard title="Серія інвестицій" value={`${investmentData.streak} міс.`} icon={<FireIcon className="w-6 h-6 text-orange-500"/>} helpText={`Кількість місяців поспіль, коли ви досягли своєї інвестиційної цілі`}/>
                            </div>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ChartContainer title="Зростання внесків з часом">
                                    <Line data={investmentData.contributionsGrowthChart} options={chartOptions as any} />
                                </ChartContainer>
                                <ChartContainer title="Щомісячні інвестиції vs. Ціль">
                                    <Bar data={investmentData.monthlyChart as any} options={chartOptions as any} />
                                </ChartContainer>
                                 <ChartContainer title="Розподіл за платформами" placeholder={platforms.length === 0}>
                                    <Doughnut data={investmentData.platformAllocationChart} options={{...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: true, position: 'bottom' }, tooltip: { callbacks: { label: (context: any) => `${context.label || ''}: ${formatDisplayAmount({ amountInUah: context.parsed, targetCurrency: currency, rates, settings, simple: true })}` } } }}} />
                                </ChartContainer>
                             </div>
                        </>
                    )}
                 </div>
            )}
        </div>
    );
};

export default InvestmentAnalyticsDashboard;
