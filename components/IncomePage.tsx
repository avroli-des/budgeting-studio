import React, { useMemo, useState } from 'react';
import { Transaction, IncomeSource, IncomeCategory, MonthlyGoals, MonthlyGoal, Achievement, AchievementWithStatus, Account } from '../types';
import { formatCurrency, formatMonth, getStartOfMonth, getEndOfMonth, getMonthKey } from '../helpers';
import AddIncomeSourceModal from './AddIncomeSourceModal';
import ConfirmationModal from './ConfirmationModal';
import MonthYearPicker from './MonthYearPicker';
import IncomeSourceCard from './IncomeSourceCard';
import MonthlyGoalProgress from './MonthlyGoalProgress';
import YearlyGoalOverview from './YearlyGoalOverview';
import SetMonthlyGoalModal from './SetMonthlyGoalModal';
import AchievementsHighlight from './gamification/AchievementsHighlight';
import AchievementsModal from './gamification/AchievementsModal';
import IncomeAnalytics from './IncomeAnalytics';
import MotivationalSection from './MotivationalSection';
import PracticalToolsSection from './PracticalToolsSection';
import { PlusIcon, ChevronDownIcon, ArrowUpIcon, FlagIcon } from './icons';

interface IncomePageProps {
  transactions: Transaction[];
  incomeSources: IncomeSource[];
  monthlyGoals: MonthlyGoals;
  achievements: AchievementWithStatus[];
  accounts: Account[];
  onAddOrUpdateIncomeSource: (data: { id?: string; name: string; category: IncomeCategory; expectedAmount: number; description?: string; isRecurring?: boolean; paymentDay?: number; }) => void;
  onRemoveIncomeSource: (sourceId: string) => void;
  onAddOrUpdateMonthlyGoal: (monthKey: string, goalData: MonthlyGoal) => void;
}

const IncomePage: React.FC<IncomePageProps> = ({ 
    transactions,
    incomeSources,
    monthlyGoals,
    achievements,
    accounts,
    onAddOrUpdateIncomeSource,
    onRemoveIncomeSource,
    onAddOrUpdateMonthlyGoal,
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IncomeSource | null>(null);

    const currentMonthKey = useMemo(() => getMonthKey(currentMonth), [currentMonth]);
    const currentGoal = useMemo(() => monthlyGoals[currentMonthKey] || { totalGoal: 0, sourceGoals: {}, motivation: '' }, [monthlyGoals, currentMonthKey]);

    const { monthlyTotals, allTimeTotals, totalReceived } = useMemo(() => {
        const start = getStartOfMonth(currentMonth);
        const end = getEndOfMonth(currentMonth);

        const calculatedMonthlyTotals = new Map<string, number>();
        const calculatedAllTimeTotals = new Map<string, number>();
        
        transactions.forEach(t => {
            if (t.type === 'income' && t.payee !== "Початковий баланс" && t.incomeSourceId) {
                // All time total
                const currentAllTime = calculatedAllTimeTotals.get(t.incomeSourceId) || 0;
                calculatedAllTimeTotals.set(t.incomeSourceId, currentAllTime + t.amount);
                
                // Monthly total
                const tDate = new Date(t.date);
                if (tDate >= start && tDate <= end) {
                    const currentMonthly = calculatedMonthlyTotals.get(t.incomeSourceId) || 0;
                    calculatedMonthlyTotals.set(t.incomeSourceId, currentMonthly + t.amount);
                }
            }
        });

        // Create final maps that include all sources, even those with 0 income
        const finalMonthlyTotals = new Map<string, number>();
        const finalAllTimeTotals = new Map<string, number>();

        incomeSources.forEach(s => {
            finalMonthlyTotals.set(s.id, calculatedMonthlyTotals.get(s.id) || 0);
            finalAllTimeTotals.set(s.id, calculatedAllTimeTotals.get(s.id) || 0);
        });

        const totalReceived = Array.from(finalMonthlyTotals.values()).reduce((sum, amount) => sum + amount, 0);

        return { monthlyTotals: finalMonthlyTotals, allTimeTotals: finalAllTimeTotals, totalReceived };
    }, [transactions, incomeSources, currentMonth]);


    const handleMonthSelect = (newDate: Date) => {
        setCurrentMonth(newDate);
        setIsPickerOpen(false);
    };
    
    const openAddSourceModal = () => {
        setEditingSource(null);
        setIsSourceModalOpen(true);
    };

    const openEditSourceModal = (source: IncomeSource) => {
        setEditingSource(source);
        setIsSourceModalOpen(true);
    };
    
    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        onRemoveIncomeSource(deleteTarget.id);
        setDeleteTarget(null);
    };

    const handleSaveGoal = (goalData: MonthlyGoal) => {
        onAddOrUpdateMonthlyGoal(currentMonthKey, goalData);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
             <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <FlagIcon className="w-8 h-8 text-blue-600"/>
                        <h1 className="text-3xl font-bold text-slate-800">Планування доходів</h1>
                    </div>
                     <p className="text-slate-500 mt-1">Встановлюйте цілі, відстежуйте прогрес та досягайте нових фінансових вершин.</p>
                </div>
                <button
                    onClick={openAddSourceModal}
                    className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    Додати джерело
                </button>
            </div>

            <div className="relative flex items-center justify-center space-x-2 sm:space-x-4">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-slate-200">
                <ChevronDownIcon className="w-6 h-6 rotate-90" />
                </button>
                <button onClick={() => setIsPickerOpen(true)} className="text-xl sm:text-2xl font-bold text-slate-700 text-center hover:bg-slate-100 rounded-md px-3 py-1 min-w-0">
                {formatMonth(currentMonth)}
                </button>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-slate-200">
                <ChevronDownIcon className="w-6 h-6 -rotate-90" />
                </button>
                {isPickerOpen && (
                    <MonthYearPicker
                    currentDate={currentMonth}
                    onSelect={handleMonthSelect}
                    onClose={() => setIsPickerOpen(false)}
                    />
                )}
            </div>

            <MonthlyGoalProgress 
                totalReceived={totalReceived}
                goal={currentGoal}
                month={currentMonth}
                onSetGoal={() => setIsGoalModalOpen(true)}
            />

            <MotivationalSection
                transactions={transactions}
                monthlyGoals={monthlyGoals}
                currentMonthGoal={currentGoal}
                totalReceivedThisMonth={totalReceived}
            />

            <AchievementsHighlight
                achievements={achievements}
                onViewAll={() => setIsAchievementsModalOpen(true)}
            />
            
            <div className="border-t border-slate-200 pt-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Джерела доходу</h2>
                {incomeSources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {incomeSources.map(source => (
                            <IncomeSourceCard
                                key={source.id}
                                source={source}
                                earnedThisMonth={monthlyTotals.get(source.id) || 0}
                                earnedAllTime={allTimeTotals.get(source.id) || 0}
                                goalAmount={currentGoal.sourceGoals[source.id]}
                                onEdit={() => openEditSourceModal(source)}
                                onDelete={() => setDeleteTarget(source)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-300">
                        <ArrowUpIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-lg font-medium text-slate-900">У вас немає джерел доходу</h3>
                        <p className="mt-1 text-sm text-slate-500">Додайте своє перше джерело, щоб почати відстежувати доходи.</p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={openAddSourceModal}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                Додати перше джерело
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <YearlyGoalOverview 
                monthlyGoals={monthlyGoals}
                transactions={transactions}
                year={currentMonth.getFullYear()}
            />

            <IncomeAnalytics
                transactions={transactions}
                incomeSources={incomeSources}
                monthlyGoals={monthlyGoals}
            />

            <PracticalToolsSection
                transactions={transactions}
                incomeSources={incomeSources}
                currentMonth={currentMonth}
                accounts={accounts}
            />

            <AchievementsModal
                isOpen={isAchievementsModalOpen}
                onClose={() => setIsAchievementsModalOpen(false)}
                achievements={achievements}
            />

            <AddIncomeSourceModal
                isOpen={isSourceModalOpen}
                onClose={() => setIsSourceModalOpen(false)}
                onSave={onAddOrUpdateIncomeSource}
                sourceToEdit={editingSource}
            />
            
            <SetMonthlyGoalModal 
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                onSave={handleSaveGoal}
                incomeSources={incomeSources}
                currentGoal={currentGoal}
            />

            {deleteTarget && (
                <ConfirmationModal
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDeleteConfirm}
                    title="Видалити джерело доходу"
                    message={
                        <>
                        <p>Ви впевнені, що хочете видалити "{deleteTarget.name}"?</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Транзакції з цього джерела не буде видалено, але вони втратять зв'язок з ним.
                        </p>
                        </>
                    }
                />
            )}
        </div>
    );
};

export default React.memo(IncomePage);