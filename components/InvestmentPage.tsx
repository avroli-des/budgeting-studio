import React, { useMemo, useState } from 'react';
import { CategoryGroup, Transaction, Category, Account, InvestmentPlatform, InvestmentPlatformCategory } from '../types';
import { ChartBarSquareIcon, PlusIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import InvestmentCard from './InvestmentCard';
import AddInvestmentModal from './AddInvestmentModal';
import EmergencyFundSection from './EmergencyFundSection';
import InvestmentAccountsSection from './InvestmentAccountsSection';
import MonthlyInvestmentTracker from './MonthlyInvestmentTracker';
import InvestmentPlatformsSection from './InvestmentPlatformsSection';
import { getMonthKey } from '../helpers';
import InvestmentCalculator from './InvestmentCalculator';
import CostOfDelayCalculator from './CostOfDelayCalculator';
import FinancialIndependenceCalculator from './FinancialIndependenceCalculator';
import InvestmentAnalyticsDashboard from './InvestmentAnalyticsDashboard';

interface InvestmentPageProps {
  categoryGroups: CategoryGroup[];
  transactions: Transaction[];
  accounts: Account[];
  platforms: InvestmentPlatform[];
  monthlyInvestmentTarget: number;
  onAddOrUpdateInvestment: (data: { id?: string, name: string; target: number }) => void;
  onRemoveInvestment: (goalId: string) => void;
  onUpdateCategoryDetails: (categoryId: string, details: Partial<Omit<Category, 'id'>>) => void;
  onAddOrUpdatePlatform: (data: Omit<InvestmentPlatform, 'id'> | InvestmentPlatform) => void;
  onRemovePlatform: (platformId: string) => void;
  onSetMonthlyInvestmentTarget: (target: number) => void;
}

const InvestmentPage: React.FC<InvestmentPageProps> = ({ 
    categoryGroups, 
    transactions, 
    accounts,
    platforms,
    monthlyInvestmentTarget,
    onAddOrUpdateInvestment,
    onRemoveInvestment,
    onUpdateCategoryDetails,
    onAddOrUpdatePlatform,
    onRemovePlatform,
    onSetMonthlyInvestmentTarget,
}) => {
    const [investmentToDelete, setInvestmentToDelete] = useState<Category | null>(null);
    const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<Category | null>(null);

    const investmentAccounts = useMemo(() => accounts.filter(a => a.type === 'investment'), [accounts]);

    const emergencyFundCategory = useMemo(() => {
        return categoryGroups.flatMap(g => g.categories).find(c => c.name === "Фонд на випадок надзвичайних ситуацій");
    }, [categoryGroups]);

    const emergencyFundSaved = useMemo(() => {
        if (!emergencyFundCategory) return 0;
        return transactions
            .filter(t => t.type === 'expense' && t.categoryId === emergencyFundCategory.id && t.payee !== "Початковий баланс")
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions, emergencyFundCategory]);
    
    const averageMonthlyExpenses = useMemo(() => {
        const expenseTransactions = transactions.filter(t => t.type === 'expense' && t.payee !== "Початковий баланс");
        if (expenseTransactions.length === 0) return 0;

        const monthlyExpenses = new Map<string, number>();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        expenseTransactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate >= threeMonthsAgo) {
                const monthKey = getMonthKey(tDate);
                const category = categoryGroups.flatMap(g => g.categories).find(c => c.id === t.categoryId);
                const isSaving = category?.name.toLowerCase().includes('накопичення') || category?.name.toLowerCase().includes('інвестиції') || category?.name.includes('Фонд');

                if (!isSaving) {
                    monthlyExpenses.set(monthKey, (monthlyExpenses.get(monthKey) || 0) + t.amount);
                }
            }
        });

        if (monthlyExpenses.size === 0) return 0;
        const total = Array.from(monthlyExpenses.values()).reduce((sum, v) => sum + v, 0);
        return total / monthlyExpenses.size;
    }, [transactions, categoryGroups]);

    const investmentGroup = useMemo(() => categoryGroups.find(g => g.name === "Інвестиції"), [categoryGroups]);
    const investments = investmentGroup ? investmentGroup.categories : [];
    
    const savedAmounts = useMemo(() => {
        const amounts = new Map<string, number>();
        investments.forEach(inv => {
            const totalSaved = transactions
                .filter(t => t.categoryId === inv.id && t.type === 'expense' && t.payee !== "Початковий баланс")
                .reduce((sum, t) => sum + t.amount, 0);
            amounts.set(inv.id, totalSaved);
        });
        return amounts;
    }, [investments, transactions]);
    
    const totalCurrentPortfolioValue = useMemo(() => {
        return platforms.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    }, [platforms]);

    const openAddInvestmentModal = () => {
        setEditingInvestment(null);
        setIsInvestmentModalOpen(true);
    };

    const openEditInvestmentModal = (investment: Category) => {
        setEditingInvestment(investment);
        setIsInvestmentModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (investmentToDelete) {
            onRemoveInvestment(investmentToDelete.id);
            setInvestmentToDelete(null);
        }
    };
    
  return (
    <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <ChartBarSquareIcon className="w-8 h-8 text-purple-600"/>
                <h1 className="text-3xl font-bold text-slate-800">Інвестиції та Цілі</h1>
            </div>
        </div>

        <InvestmentAnalyticsDashboard
            transactions={transactions}
            categoryGroups={categoryGroups}
            platforms={platforms}
            monthlyInvestmentTarget={monthlyInvestmentTarget}
        />

        <InvestmentCalculator startAmountValue={totalCurrentPortfolioValue} />
        <CostOfDelayCalculator />
        <FinancialIndependenceCalculator currentPortfolio={totalCurrentPortfolioValue} />

        <MonthlyInvestmentTracker
            target={monthlyInvestmentTarget}
            transactions={transactions}
            categoryGroups={categoryGroups}
            onSetTarget={onSetMonthlyInvestmentTarget}
        />

        <EmergencyFundSection 
            category={emergencyFundCategory}
            savedAmount={emergencyFundSaved}
            avgMonthlyExpenses={averageMonthlyExpenses}
            onSetGoal={(target) => {
                if(emergencyFundCategory) {
                    onUpdateCategoryDetails(emergencyFundCategory.id, { goalTarget: target });
                }
            }}
        />

        <InvestmentPlatformsSection
            platforms={platforms}
            transactions={transactions}
            onAddOrUpdatePlatform={onAddOrUpdatePlatform}
            onRemovePlatform={onRemovePlatform}
        />

        <InvestmentAccountsSection accounts={investmentAccounts} />

        <div className="border-t border-slate-200 pt-8">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-800">Інвестиційні цілі</h2>
                <button
                    onClick={openAddInvestmentModal}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    Додати ціль
                </button>
            </div>

            {investments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {investments.map(inv => (
                        <InvestmentCard 
                            key={inv.id} 
                            investment={inv} 
                            savedAmount={savedAmounts.get(inv.id) || 0}
                            onEdit={() => openEditInvestmentModal(inv)}
                            onDelete={() => setInvestmentToDelete(inv)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-300">
                    <ChartBarSquareIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-lg font-medium text-slate-900">У вас ще немає інвестиційних цілей</h3>
                    <p className="mt-1 text-sm text-slate-500">Додайте свою першу ціль, щоб відстежувати прогрес.</p>
                </div>
            )}
        </div>

        <AddInvestmentModal 
            isOpen={isInvestmentModalOpen}
            onClose={() => setIsInvestmentModalOpen(false)}
            onSave={onAddOrUpdateInvestment}
            investmentToEdit={editingInvestment}
        />

        {investmentToDelete && (
            <ConfirmationModal
                isOpen={!!investmentToDelete}
                onClose={() => setInvestmentToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={`Видалити ціль "${investmentToDelete.name}"?`}
                message={
                    <>
                     <p>Ви впевнені, що хочете видалити цю інвестиційну ціль?</p>
                     <p className="mt-2 text-sm text-red-600 font-semibold">
                        Усі пов'язані транзакції буде від'єднано від цієї категорії.
                     </p>
                     <p className="mt-2 text-sm text-slate-500">Цю дію неможливо скасувати.</p>
                    </>
                }
            />
        )}
    </div>
  );
};

export default React.memo(InvestmentPage);