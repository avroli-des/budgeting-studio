

import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, CalendarDaysIcon, DocumentArrowDownIcon } from './icons';
import { Transaction, IncomeSource, Account } from '../types';
import { getMonthKey, formatCurrency, exportToCSV, getStartOfMonth, getEndOfMonth } from '../helpers';

interface PracticalToolsSectionProps {
  transactions: Transaction[];
  incomeSources: IncomeSource[];
  currentMonth: Date;
  accounts: Account[];
}

const CalendarDay: React.FC<{ day: number, events: { name: string, status: 'pending' | 'received' }[] }> = ({ day, events }) => {
    return (
        <div className="h-28 border-b border-r border-slate-200 p-1 flex flex-col">
            <span className="text-xs font-semibold text-slate-600">{day}</span>
            <div className="mt-1 space-y-1 overflow-y-auto">
                {events.map(event => (
                    <div key={event.name} className={`px-1.5 py-0.5 rounded text-xs font-medium truncate ${event.status === 'received' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`} title={event.name}>
                        {event.name}
                    </div>
                ))}
            </div>
        </div>
    );
};

const InsightCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <h4 className="font-bold text-slate-700 mb-2">{title}</h4>
        <div className="text-sm text-slate-600 space-y-1">{children}</div>
    </div>
);

const PracticalToolsSection: React.FC<PracticalToolsSectionProps> = ({ transactions, incomeSources, currentMonth, accounts }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const incomeSourcesById = useMemo(() => new Map<string, IncomeSource>(incomeSources.map(s => [s.id, s])), [incomeSources]);
    const accountsById = useMemo(() => new Map<string, Account>(accounts.map(a => [a.id, a])), [accounts]);
    
    const calendarData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
        
        const recurringSources = incomeSources.filter(s => s.isRecurring && s.paymentDay);
        
        const receivedPayments = new Set<string>();
        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (t.type === 'income' && t.incomeSourceId && tDate.getFullYear() === year && tDate.getMonth() === month) {
                receivedPayments.add(t.incomeSourceId);
            }
        });

        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const events = recurringSources
                .filter(s => s.paymentDay === day)
                .map(s => ({
                    name: s.name,
                    status: receivedPayments.has(s.id) ? 'received' : 'pending' as 'pending' | 'received'
                }));
            return { day, events };
        });

        return { startDayOfWeek, days };
    }, [currentMonth, incomeSources, transactions]);

    const smartInsights = useMemo(() => {
        const today = new Date();
        const recurringSources = incomeSources.filter(s => s.isRecurring && s.paymentDay);
        const receivedThisMonth = new Set<string>();
        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (t.type === 'income' && t.incomeSourceId && tDate.getFullYear() === today.getFullYear() && tDate.getMonth() === today.getMonth()) {
                receivedThisMonth.add(t.incomeSourceId);
            }
        });

        const latePayments = recurringSources.filter(source => {
            if (today.getFullYear() !== currentMonth.getFullYear() || today.getMonth() !== currentMonth.getMonth()) return false;
            return source.paymentDay && today.getDate() > source.paymentDay && !receivedThisMonth.has(source.id);
        });
        
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        const recentIncome = transactions.filter(t => t.type === 'income' && new Date(t.date) >= sixMonthsAgo);

        const totalsBySource = new Map<string, number>();
        recentIncome.forEach(t => {
             if (t.incomeSourceId) {
                totalsBySource.set(t.incomeSourceId, (totalsBySource.get(t.incomeSourceId) || 0) + t.amount);
            }
        });

        const topPerformer = [...totalsBySource.entries()].sort((a,b) => b[1] - a[1])[0];

        const monthlyIncomeBySource = new Map<string, Map<string, number>>();
        recentIncome.forEach(t => {
            if(t.incomeSourceId) {
                const monthKey = getMonthKey(new Date(t.date));
                if (!monthlyIncomeBySource.has(t.incomeSourceId)) {
                    monthlyIncomeBySource.set(t.incomeSourceId, new Map());
                }
                const sourceMap = monthlyIncomeBySource.get(t.incomeSourceId)!;
                sourceMap.set(monthKey, (sourceMap.get(monthKey) || 0) + t.amount);
            }
        });

        const consistencyScores = new Map<string, number>();
        monthlyIncomeBySource.forEach((monthlyData, sourceId) => {
            const incomes = Array.from(monthlyData.values());
            if (incomes.length < 2) return;
            const mean = incomes.reduce((a, b) => a + b, 0) / incomes.length;
            const variance = incomes.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / incomes.length;
            const stdDev = Math.sqrt(variance);
            if (mean > 0) {
                consistencyScores.set(sourceId, stdDev / mean); // Coefficient of variation
            }
        });

        const mostConsistent = [...consistencyScores.entries()].sort((a,b) => a[1] - b[1])[0];

        return {
            latePayments,
            topPerformer: topPerformer ? incomeSourcesById.get(topPerformer[0]) : null,
            mostConsistent: mostConsistent ? incomeSourcesById.get(mostConsistent[0]) : null,
        }
    }, [transactions, incomeSources, incomeSourcesById, currentMonth]);

    const handleExport = () => {
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        const headers = ['Date', 'Source', 'Amount', 'Account', 'Memo'];
        const data = incomeTransactions.map(t => [
            t.date,
            t.incomeSourceId ? incomeSourcesById.get(t.incomeSourceId)?.name : 'Uncategorized',
            t.amount,
            t.accountId ? accountsById.get(t.accountId)?.name : 'Unknown',
            t.memo
        ]);
        const date = new Date().toISOString().split('T')[0];
        exportToCSV(headers, data, `income-data-${date}.csv`);
    };

    return (
        <div className="border-t border-slate-200 pt-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full p-4 flex justify-between items-center hover:bg-slate-50"
                >
                    <h2 className="text-2xl font-bold text-slate-800">Практичні інструменти та планування</h2>
                    <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>

                {!isCollapsed && (
                    <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-200 space-y-8">
                        {/* Calendar */}
                        <div className="space-y-4">
                             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <CalendarDaysIcon className="w-6 h-6 text-blue-600"/>
                                Календар очікуваних доходів
                            </h3>
                             <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                                <div className="grid grid-cols-7 text-center font-semibold text-sm text-slate-700 border-b border-slate-200">
                                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => <div key={d} className="py-2">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7">
                                    {Array.from({ length: calendarData.startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className="h-28 border-r border-slate-200"></div>)}
                                    {calendarData.days.map(d => <CalendarDay key={d.day} day={d.day} events={d.events} />)}
                                </div>
                             </div>
                        </div>

                        {/* Smart Insights */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800">Смарт-інсайти</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               <InsightCard title="Прострочені платежі">
                                    {smartInsights.latePayments.length > 0 ? (
                                        <ul>{smartInsights.latePayments.map(s => <li key={s.id}>- {s.name}</li>)}</ul>
                                    ) : <p>Все гаразд, прострочених платежів немає!</p>}
                                </InsightCard>
                                 <InsightCard title="Топ-виконавець (6 міс.)">
                                    {smartInsights.topPerformer ? <p>{smartInsights.topPerformer.name}</p> : <p>Недостатньо даних.</p>}
                                </InsightCard>
                                <InsightCard title="Найстабільніше джерело (6 міс.)">
                                    {smartInsights.mostConsistent ? <p>{smartInsights.mostConsistent.name}</p> : <p>Недостатньо даних.</p>}
                                </InsightCard>
                            </div>
                        </div>

                        {/* Export */}
                        <div className="space-y-4">
                             <h3 className="text-lg font-bold text-slate-800">Управління даними</h3>
                             <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-slate-700">Експорт даних про доходи</h4>
                                    <p className="text-sm text-slate-500">Завантажте всі транзакції доходів у форматі CSV.</p>
                                </div>
                                <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-md hover:bg-slate-800">
                                    <DocumentArrowDownIcon className="w-5 h-5" />
                                    Експорт (CSV)
                                </button>
                             </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticalToolsSection;