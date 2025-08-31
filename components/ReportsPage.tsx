import React, { useMemo, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale,
  DoughnutController,
  Filler, // <-- IMPORTED FILLER PLUGIN
  type Chart,
  type ChartConfiguration,
  type ChartTypeRegistry,
  type Point,
  type BubbleDataPoint,
  type ChartEvent,
  type ActiveElement
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { CategoryGroup, Transaction, Account } from '../types';
import { formatCurrency, isColorLight, formatDisplayAmount } from '../helpers';
import { ChartIcon, ArrowDownIcon, ArrowUpIcon } from './icons';
import DateRangeFilter from './DateRangeFilter';
import { useCurrency } from '../contexts/CurrencyContext';
import CalendarHeatmap from './CalendarHeatmap';


// Custom plugin to draw percentage labels on pie/doughnut charts
const percentageLabelsPlugin = {
  id: 'percentageLabels',
  afterDatasetsDraw: (chart: Chart<keyof ChartTypeRegistry, (number | [number, number] | Point | BubbleDataPoint)[], unknown>) => {
    const config = chart.config as ChartConfiguration;
    // Only apply to pie and doughnut charts
    if (config.type !== 'pie' && config.type !== 'doughnut') return;

    const { ctx, data } = chart;
    const dataset = data.datasets[0];
    if (!dataset || !dataset.data) return;

    const total = (dataset.data as number[]).reduce((sum, value) => sum + (value || 0), 0);
    if (total === 0) return;

    ctx.save();
    data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((element, index) => {
        const value = dataset.data[index];
        if (typeof value !== 'number' || value === 0) return;

        const arcElement = element as ArcElement;
        const backgroundColor = arcElement.options.backgroundColor;

        // Don't draw on slices that are too small
        const angle = arcElement.endAngle - arcElement.startAngle;
        if (angle < 0.25) return; 

        // Calculate the mid-point of the arc to position the label correctly
        const radius = (arcElement.innerRadius + arcElement.outerRadius) / 2;
        const midAngle = arcElement.startAngle + (angle / 2);
        const x = arcElement.x + Math.cos(midAngle) * radius;
        const y = arcElement.y + Math.sin(midAngle) * radius;

        const percentage = ((value / total) * 100).toFixed(0) + '%';
        
        // Choose text color based on background brightness for better visibility
        ctx.fillStyle = isColorLight(backgroundColor) ? '#334155' : '#ffffff'; // slate-700 or white
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(percentage, x, y);
      });
    });
    ctx.restore();
  }
};


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale,
  DoughnutController,
  Filler, // <-- REGISTERED FILLER PLUGIN
  percentageLabelsPlugin // Register our custom plugin
);

const chartColors = ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#eab308', '#14b8a6', '#ec4899', '#64748b', '#0ea5e9'];

const ChartContainer: React.FC<{ title: string; children: React.ReactNode; placeholder?: boolean }> = ({ title, children, placeholder = false }) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 min-h-[420px] flex flex-col">
    <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">{title}</h3>
    <div className="flex-grow h-80 relative">
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

const PercentageIndicator: React.FC<{ change: number | null; periodText: string; isIncome: boolean }> = ({ change, periodText, isIncome }) => {
    if (change === null || change === 0) {
        return null;
    }
    
    if (!isFinite(change)) {
        return (
            <div 
                className="flex items-center text-xs font-semibold text-green-600"
                title={`у порівнянні з ${periodText} (було 0)`}
            >
                <ArrowUpIcon className="w-4 h-4" />
                <span>Новий</span>
            </div>
        );
    }

    const isPositive = change > 0;
    const isNegative = change < 0;
    
    const isGoodChange = isIncome ? isPositive : isNegative;
    const colorClass = isGoodChange ? 'text-green-600' : 'text-red-600';
    const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;

    return (
        <div 
            className={`flex items-center text-xs font-semibold ${colorClass}`}
            title={`у порівнянні з ${periodText}`}
        >
            <Icon className="w-4 h-4" />
            <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
    );
};

const SummaryCard: React.FC<{ 
    title: string; 
    uahAmount: number; 
    colorClass: string; 
    icon: React.ReactNode; 
    change?: number | null;
    comparisonPeriod?: string;
    isIncome?: boolean;
}> = ({ title, uahAmount, colorClass, icon, change, comparisonPeriod, isIncome = false }) => {
    const { currency, rates, settings } = useCurrency();
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="flex items-center">
                <div className={`rounded-full p-3 mr-4 ${colorClass}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-2xl font-bold text-slate-800">{formatDisplayAmount({ amountInUah: uahAmount, targetCurrency: currency, rates, settings })}</p>
                </div>
            </div>
             {comparisonPeriod && <PercentageIndicator change={change ?? null} periodText={comparisonPeriod} isIncome={isIncome} />}
        </div>
    );
};


interface ReportsPageProps {
  categoryGroups: CategoryGroup[];
  transactions: Transaction[];
  accounts: Account[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ categoryGroups, transactions, accounts }) => {
  const { currency, rates, settings } = useCurrency();
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);
    return { startDate, endDate };
  });
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(categoryGroups.length > 0 ? categoryGroups[0].id : null);

  const getChartOptions = useCallback((title?: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
              let label = context.dataset.label || context.label || '';
              if (label) {
                  label += ': ';
              }
              const uahValue = context.parsed?.y ?? context.parsed;
              if (typeof uahValue === 'number') {
                  label += formatDisplayAmount({ amountInUah: uahValue, targetCurrency: currency, rates, settings });
              }
              return label;
          }
        }
      }
    },
  }), [currency, rates, settings]);

  const pieChartOptions = useMemo(() => {
      const baseOptions = getChartOptions();
      return {
          ...baseOptions,
          cutout: '60%',
          plugins: {
              ...baseOptions.plugins,
              legend: {
                  display: false,
              }
          }
      };
  }, [getChartOptions]);

  const allCategories = useMemo(() => categoryGroups.flatMap(g => g.categories), [categoryGroups]);
  
  const filteredTransactions = useMemo(() => {
    const rangeEnd = new Date(dateRange.endDate);
    rangeEnd.setHours(23, 59, 59, 999);
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        return t.type !== 'transfer' && tDate >= dateRange.startDate && tDate <= rangeEnd && t.payee !== "Початковий баланс";
    });
  }, [transactions, dateRange]);

  const spendingByDay = useMemo(() => {
    const dailyTotals = new Map<string, number>();
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            // t.date is already 'YYYY-MM-DD' string
            dailyTotals.set(t.date, (dailyTotals.get(t.date) || 0) + t.amount);
        });
    return dailyTotals;
  }, [filteredTransactions]);

  const summaryData = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.income += t.amount;
        } else if (t.type === 'expense') {
            acc.expenses += t.amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });
  }, [filteredTransactions]);

    const { previousPeriod, comparisonPeriodText } = useMemo(() => {
        const { startDate, endDate } = dateRange;

        const durationMs = endDate.getTime() - startDate.getTime();
        const prevEndDateMs = startDate.getTime() - 1; 
        const prevStartDateMs = prevEndDateMs - durationMs;

        const prevStartDateFinal = new Date(prevStartDateMs);
        const prevEndDateFinal = new Date(prevEndDateMs);

        const toFriendlyDateFmt = new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedPrevStart = toFriendlyDateFmt.format(prevStartDateFinal);
        const formattedPrevEnd = toFriendlyDateFmt.format(prevEndDateFinal);

        return {
            previousPeriod: { startDate: prevStartDateFinal, endDate: prevEndDateFinal },
            comparisonPeriodText: `${formattedPrevStart} - ${formattedPrevEnd}`,
        };
    }, [dateRange]);

    const previousSummaryData = useMemo(() => {
        const rangeEnd = new Date(previousPeriod.endDate);
        rangeEnd.setHours(23, 59, 59, 999);

        const prevTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return t.type !== 'transfer' && tDate >= previousPeriod.startDate && tDate <= rangeEnd && t.payee !== "Початковий баланс";
        });

        return prevTransactions.reduce((acc, t) => {
            if (t.type === 'income') {
                acc.income += t.amount;
            } else if (t.type === 'expense') {
                acc.expenses += t.amount;
            }
            return acc;
        }, { income: 0, expenses: 0 });

    }, [transactions, previousPeriod]);

    const { incomeChange, expenseChange } = useMemo(() => {
        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) {
                return current > 0 ? Infinity : 0;
            }
            return ((current - previous) / previous) * 100;
        };

        return {
            incomeChange: calculateChange(summaryData.income, previousSummaryData.income),
            expenseChange: calculateChange(summaryData.expenses, previousSummaryData.expenses)
        }
    }, [summaryData, previousSummaryData]);

  const spendingByGroupData = useMemo(() => {
      const spending = new Map<string, number>();
      const groupNames = new Map<string, string>();
      
      const groupMap = new Map<string, string>();
      categoryGroups.forEach(g => {
        g.categories.forEach(c => c.id && groupMap.set(c.id, g.id));
        groupNames.set(g.id, g.name);
      });

      filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            if (t.categoryId && t.categoryId !== 'income') {
                const groupId = groupMap.get(t.categoryId);
                if (groupId) {
                    spending.set(groupId, (spending.get(groupId) || 0) + t.amount);
                }
            }
        });
        
      const entries = Array.from(spending.entries())
        .map(([groupId, amount]) => ({
            id: groupId,
            name: groupNames.get(groupId) || 'Невідома група',
            amount,
        }))
        .sort((a,b) => b.amount - a.amount);
        
      if (entries.length === 0) return null;
      
      const labels = entries.map(e => e.name);
      const data = entries.map(e => e.amount);
      const groupIds = entries.map(e => e.id);

      return {
          labels,
          datasets: [{ data, backgroundColor: chartColors, borderColor: '#ffffff', borderWidth: 2 }],
          groupIds,
      };
  }, [filteredTransactions, categoryGroups]);

  const totalGroupSpending = useMemo(() => {
    if (!spendingByGroupData) return 0;
    return spendingByGroupData.datasets[0].data.reduce((sum, amount) => sum + amount, 0);
  }, [spendingByGroupData]);

  const spendingByGroupOptions = useMemo(() => ({
    ...pieChartOptions,
    onClick: (event: ChartEvent, elements: ActiveElement[]) => {
        if (elements.length > 0) {
            const index = elements[0].index;
            if (spendingByGroupData?.groupIds) {
                setSelectedGroupId(spendingByGroupData.groupIds[index]);
            }
        }
    },
    plugins: { ...pieChartOptions.plugins } // Tooltip already configured
  }), [spendingByGroupData, pieChartOptions]);
  
  const spendingInSelectedGroupData = useMemo(() => {
      if (!selectedGroupId) return null;

      const selectedGroup = categoryGroups.find(g => g.id === selectedGroupId);
      if (!selectedGroup) return null;

      const categoryIdsInGroup = new Set(selectedGroup.categories.map(c => c.id));
      const spending = new Map<string, number>();

      filteredTransactions
        .filter(t => t.type === 'expense' && t.categoryId && categoryIdsInGroup.has(t.categoryId))
        .forEach(t => {
            if (t.categoryId) {
                spending.set(t.categoryId, (spending.get(t.categoryId) || 0) + t.amount);
            }
        });

      if (spending.size === 0) return null;

      const labels = Array.from(spending.keys()).map((id: string) => allCategories.find(c => c.id === id)?.name || 'N/A');
      const data = Array.from(spending.values());
      
      return {
          labels,
          datasets: [{ data, backgroundColor: chartColors, borderColor: '#ffffff', borderWidth: 2 }],
      };
  }, [filteredTransactions, selectedGroupId, categoryGroups, allCategories]);

  const totalSelectedGroupSpending = useMemo(() => {
    if (!spendingInSelectedGroupData) return 0;
    return spendingInSelectedGroupData.datasets[0].data.reduce((sum, amount) => sum + amount, 0);
  }, [spendingInSelectedGroupData]);

  const incomeVsExpenseData = useMemo(() => {
    const dataByMonth = new Map<string, { income: number; expenses: number }>();
    
    let current = new Date(dateRange.startDate);
    current.setDate(1);
    const end = new Date(dateRange.endDate);

    while (current <= end) {
        const key = `${current.getFullYear()}-${String(current.getMonth()).padStart(2, '0')}`;
        dataByMonth.set(key, { income: 0, expenses: 0 });
        current.setMonth(current.getMonth() + 1);
    }

    filteredTransactions.forEach(t => {
      const tDate = new Date(t.date);
      const key = `${tDate.getFullYear()}-${String(tDate.getMonth()).padStart(2, '0')}`;
      if (dataByMonth.has(key)) {
        const currentData = dataByMonth.get(key)!;
        if (t.type === 'income') currentData.income += t.amount;
        else if (t.type === 'expense') currentData.expenses += t.amount;
      }
    });
    
    const sortedEntries = Array.from(dataByMonth.entries()).sort();
    const monthLabelsUk = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
    const labels = sortedEntries.map(([key]) => {
        const [year, month] = key.split('-');
        return `${monthLabelsUk[parseInt(month)]} '${year.slice(2)}`;
    });
    
    return {
      labels,
      datasets: [
        { label: 'Доходи', data: sortedEntries.map(([, data]) => data.income), borderColor: 'rgb(34, 197, 94)', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.2 },
        { label: 'Витрати', data: sortedEntries.map(([, data]) => data.expenses), borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.2 },
      ],
    };
  }, [filteredTransactions, dateRange]);
  
  const incomeAllocationData = useMemo(() => {
    const { income, expenses } = summaryData;

    if (income <= 0) return null;

    const savings = income - expenses;

    const chartData: number[] = [];
    const chartLabels: string[] = [];
    const chartColors: string[] = [];

    if (expenses > 0) {
        chartData.push(expenses);
        chartLabels.push('Витрати');
        chartColors.push('#ef4444'); // Red
    }
    if (savings > 0) {
        chartData.push(savings);
        chartLabels.push('Заощадження');
        chartColors.push('#22c55e'); // Green
    }

    if (chartData.length === 0) return null;

    return {
        labels: chartLabels,
        datasets: [{ 
            data: chartData, 
            backgroundColor: chartColors, 
            borderColor: '#ffffff', 
            borderWidth: 2 
        }],
    };
}, [summaryData]);

  const spendingByAccountData = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;

    const spending = new Map<string, number>();
    const accountsById = new Map<string, Account>(accounts.map(acc => [acc.id, acc]));

    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            if (t.accountId) {
                spending.set(t.accountId, (spending.get(t.accountId) || 0) + t.amount);
            }
        });
        
    if (spending.size === 0) return null;

    const entries = Array.from(spending.entries())
        .map(([accountId, amount]) => ({
            id: accountId,
            name: accountsById.get(accountId)?.name || 'Невідомий рахунок',
            amount,
        }))
        .sort((a,b) => b.amount - a.amount);
        
    const labels = entries.map(e => e.name);
    const data = entries.map(e => e.amount);

    return {
        labels,
        datasets: [{ data, backgroundColor: chartColors, borderColor: '#ffffff', borderWidth: 2 }],
    };
  }, [filteredTransactions, accounts]);

  if (transactions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-center">
          <ChartIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="mt-4 text-xl font-semibold text-slate-800">Звіти (Тестове оновлення)</h2>
          <p className="mt-2 text-slate-500">Додайте транзакції, щоб побачити візуалізацію ваших фінансів.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SummaryCard 
                title="Дохід" 
                uahAmount={summaryData.income} 
                colorClass="bg-green-100 text-green-600" 
                icon={<ArrowUpIcon className="h-6 w-6" />}
                change={incomeChange}
                comparisonPeriod={comparisonPeriodText}
                isIncome={true}
            />
            <SummaryCard 
                title="Витрати" 
                uahAmount={summaryData.expenses} 
                colorClass="bg-red-100 text-red-600" 
                icon={<ArrowDownIcon className="h-6 w-6" />} 
                change={expenseChange}
                comparisonPeriod={comparisonPeriodText}
                isIncome={false}
            />
        </div>
    
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-red-50/50 border border-red-200 rounded-lg shadow-sm p-4 sm:p-6 min-h-[420px] flex flex-col">
          <h3 className="text-lg font-semibold text-red-800 mb-4 text-center">Витрати за групами</h3>
          {spendingByGroupData && totalGroupSpending > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center flex-grow">
                  <div className="h-60 md:h-full relative">
                      <Doughnut data={spendingByGroupData} options={spendingByGroupOptions} />
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                      {spendingByGroupData.labels.map((label, index) => {
                          const amount = spendingByGroupData.datasets[0].data[index];
                          return (
                              <button key={label} onClick={() => setSelectedGroupId(spendingByGroupData.groupIds[index])} className="w-full flex justify-between items-center p-2 rounded-md hover:bg-red-100/50 transition-colors">
                                  <div className="flex items-center gap-2 min-w-0">
                                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: spendingByGroupData.datasets[0].backgroundColor[index] }}></span>
                                      <span className="text-sm text-slate-700 text-left truncate">{label}</span>
                                  </div>
                                  <div className="text-sm font-medium text-slate-800 text-right font-mono flex-shrink-0 ml-2">
                                      {formatDisplayAmount({ amountInUah: amount, targetCurrency: currency, rates, settings })}
                                  </div>
                              </button>
                          )
                      })}
                  </div>
              </div>
          ) : (
              <div className="flex-grow flex items-center justify-center text-slate-500">
                  Недостатньо даних для відображення
              </div>
          )}
        </div>

        <div className="bg-blue-50/50 border border-blue-200 rounded-lg shadow-sm p-4 sm:p-6 min-h-[420px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h3 className="text-lg font-semibold text-blue-800 text-center sm:text-left">Витрати у вибраній групі</h3>
                <select
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="block w-full sm:max-w-xs p-2 border-slate-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                >
                  {categoryGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
            </div>
             {spendingInSelectedGroupData && totalSelectedGroupSpending > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center flex-grow">
                    <div className="h-60 md:h-full relative">
                        <Doughnut data={spendingInSelectedGroupData} options={pieChartOptions} />
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                        {spendingInSelectedGroupData.labels.map((label, index) => {
                            const amount = spendingInSelectedGroupData.datasets[0].data[index];
                            return (
                                <div key={label} className="w-full flex justify-between items-center p-2 rounded-md">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: spendingInSelectedGroupData.datasets[0].backgroundColor[index] }}></span>
                                        <span className="text-sm text-slate-700 text-left truncate">{label}</span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-800 text-right font-mono flex-shrink-0 ml-2">
                                        {formatDisplayAmount({ amountInUah: amount, targetCurrency: currency, rates, settings })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-slate-500">
                   Оберіть групу або додайте транзакції
               </div>
            )}
        </div>
         
         <div className="bg-green-50/50 border border-green-200 rounded-lg shadow-sm p-4 sm:p-6 min-h-[420px] flex flex-col">
            <h3 className="text-lg font-semibold text-green-800 mb-4 text-center">Розподіл Доходу</h3>
             {incomeAllocationData && summaryData.income > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center flex-grow">
                    <div className="h-60 md:h-full relative">
                        <Doughnut data={incomeAllocationData} options={pieChartOptions} />
                    </div>
                    <div className="space-y-1 max-h-64 self-center pr-2">
                        {incomeAllocationData.labels.map((label, index) => {
                            const amount = incomeAllocationData.datasets[0].data[index];
                            return (
                                <div key={label} className="w-full flex justify-between items-center p-2 rounded-md">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: incomeAllocationData.datasets[0].backgroundColor[index] }}></span>
                                        <span className="text-sm text-slate-700 text-left truncate">{label}</span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-800 text-right font-mono flex-shrink-0 ml-2">
                                        {formatDisplayAmount({ amountInUah: amount, targetCurrency: currency, rates, settings })}
                                    </div>
                                </div>
                            )
                        })}
                        <div className="!mt-4 pt-2 border-t border-green-200 w-full flex justify-between items-center p-2 rounded-md">
                          <div className="text-sm font-bold text-slate-700">Всього дохід</div>
                           <div className="text-sm font-bold text-slate-800 text-right font-mono">
                                {formatDisplayAmount({ amountInUah: summaryData.income, targetCurrency: currency, rates, settings })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center text-slate-500">
                    Недостатньо даних для відображення
                </div>
            )}
        </div>

        <ChartContainer title="Динаміка доходів та витрат">
          <Line data={incomeVsExpenseData} options={getChartOptions()} />
        </ChartContainer>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer title="Витрати за рахунками" placeholder={!spendingByAccountData}>
                {spendingByAccountData && <Doughnut data={spendingByAccountData} options={pieChartOptions} />}
            </ChartContainer>
           <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 min-h-[420px] flex flex-col">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Теплова карта витрат</h3>
                <div className="flex-grow w-full max-w-lg mx-auto">
                    <CalendarHeatmap 
                        month={dateRange.endDate} 
                        data={spendingByDay} 
                    />
                </div>
            </div>
       </div>
    </div>
  );
};

export default React.memo(ReportsPage);