import React, { useMemo, useState } from 'react';
import { Category, CategoryGroup, Transaction, Account, IncomeSource, IncomeCategory, InvestmentPlatform } from '../types';
import { formatCurrency, getCurrencyClass, getMonthKey, formatMonth, getStartOfMonth, getEndOfMonth, formatDisplayAmount } from '../helpers';
import CategoryRow from './CategoryRow';
import AddTransactionModal from './AddTransactionModal';
import RecentTransactions from './RecentTransactions';
import TransactionListModal from './TransactionListModal';
import FloatingActionButton from './FloatingActionButton';
import AddGroupModal from './AddGroupModal';
import AddCategoryModal from './AddCategoryModal';
import ConfirmationModal from './ConfirmationModal';
import MonthYearPicker from './MonthYearPicker';
import { FolderPlusIcon, PlusCircleIcon, TrashIcon, ChevronDownIcon, ArrowUpIcon } from './icons';
import CategoryCardMobile from './CategoryCardMobile';
import IncomeSourceRow from './IncomeSourceRow';
import AddIncomeSourceModal from './AddIncomeSourceModal';
import { useCurrency } from '../contexts/CurrencyContext';
import BulkEditModal from './BulkEditModal';

interface TransactionsPageProps {
  categoryGroups: CategoryGroup[];
  transactions: Transaction[];
  accounts: Account[];
  incomeSources: IncomeSource[];
  investmentPlatforms: InvestmentPlatform[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onRemoveTransaction: (transactionId: string) => void;
  onRemoveMultipleTransactions: (transactionIds: string[]) => void;
  onBulkUpdateTransactions: (transactionIds: string[], updates: { newAccountId?: string, newCategoryId?: string }) => void;
  onAddCategoryGroup: (groupName: string) => void;
  onAddCategory: (groupId: string, categoryName: string) => void;
  onUpdateCategory: (categoryId: string, newName: string) => void;
  onRemoveCategory: (categoryId: string) => void;
  onRemoveCategoryGroup: (groupId: string) => void;
  onAddOrUpdateIncomeSource: (data: { id?: string; name: string; category: IncomeCategory; expectedAmount: number; description?: string, isRecurring?: boolean, paymentDay?: number }) => void;
  onRemoveIncomeSource: (sourceId: string) => void;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ 
  categoryGroups, 
  transactions, 
  accounts,
  incomeSources,
  investmentPlatforms,
  onAddTransaction, 
  onUpdateTransaction,
  onRemoveTransaction,
  onRemoveMultipleTransactions,
  onBulkUpdateTransactions,
  onAddCategoryGroup, 
  onAddCategory,
  onUpdateCategory, 
  onRemoveCategory, 
  onRemoveCategoryGroup,
  onAddOrUpdateIncomeSource,
  onRemoveIncomeSource,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionModalType, setTransactionModalType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [prefilledCategoryId, setPrefilledCategoryId] = useState<string | null>(null);
  
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  
  const [viewingCategory, setViewingCategory] = useState<{ id: string, name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'group' | 'category' | 'incomeSource', id: string, name: string } | null>(null);
  const [isRecentTransactionsCollapsed, setRecentTransactionsCollapsed] = useState(false);

  // State for Income Modals
  const [isIncomeSourceModalOpen, setIsIncomeSourceModalOpen] = useState(false);
  const [editingIncomeSource, setEditingIncomeSource] = useState<IncomeSource | null>(null);
  const { currency, rates, settings } = useCurrency();

  // State for Bulk Editing
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  const expenseCategoryGroups = useMemo(() => categoryGroups.filter(g => g.name !== 'Інвестиції'), [categoryGroups]);
  
  const {
    activityByCategoryId,
    transactionsForMonth,
    totalExpectedIncome,
    totalReceivedIncome,
    receivedBySource
  } = useMemo(() => {
    const start = getStartOfMonth(currentMonth);
    const end = getEndOfMonth(currentMonth);
    
    const transactionsForMonth = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
    
    // Calculate expense activity
    const activityByCategoryId = new Map<string, number>();
    transactionsForMonth.filter(t => t.type === 'expense' && t.payee !== "Початковий баланс").forEach(t => {
      if (t.categoryId) {
        const currentActivity = activityByCategoryId.get(t.categoryId) || 0;
        activityByCategoryId.set(t.categoryId, currentActivity - t.amount);
      }
    });

    // Calculate income details
    const incomeForMonth = transactionsForMonth.filter(t => t.type === 'income' && t.payee !== "Початковий баланс");
    const totalExpected = incomeSources.reduce((sum, s) => sum + s.expectedAmount, 0);
    const totalReceived = incomeForMonth.reduce((sum, t) => sum + t.amount, 0);
    
    // First, calculate totals based purely on transactions for the month
    const calculatedTotals = incomeForMonth.reduce((acc, t) => {
        if (t.incomeSourceId) {
            acc.set(t.incomeSourceId, (acc.get(t.incomeSourceId) || 0) + t.amount);
        }
        return acc;
    }, new Map<string, number>());

    // Then, create the final map that includes all sources, ensuring even those with 0 income are present
    const receivedBySource = new Map<string, number>();
    incomeSources.forEach(source => {
        receivedBySource.set(source.id, calculatedTotals.get(source.id) || 0);
    });

    return {
      activityByCategoryId,
      transactionsForMonth,
      totalExpectedIncome: totalExpected,
      totalReceivedIncome: totalReceived,
      receivedBySource,
    };
  }, [transactions, currentMonth, incomeSources]);

  const totalActivity = useMemo(() => {
      return Array.from(activityByCategoryId.values()).reduce((sum: number, activity: number) => sum + activity, 0);
  },[activityByCategoryId])

  const openAddTransactionModal = (type: 'income' | 'expense' | 'transfer') => {
    setTransactionModalType(type);
    setEditingTransaction(null);
    setIsAddTransactionModalOpen(true);
  };

  const openEditTransactionModal = (transaction: Transaction) => {
    setTransactionModalType(transaction.type);
    setEditingTransaction(transaction);
    setIsAddTransactionModalOpen(true);
  };
  
  const handleAddExpenseForCategory = (categoryId: string) => {
    setTransactionModalType('expense');
    setEditingTransaction(null);
    setPrefilledCategoryId(categoryId);
    setIsAddTransactionModalOpen(true);
  };
  
  const closeAddTransactionModal = () => {
    setIsAddTransactionModalOpen(false);
    setPrefilledCategoryId(null);
    setEditingTransaction(null);
  };
  
  const openAddCategoryModal = (groupId: string) => {
    setCurrentGroupId(groupId);
    setIsAddCategoryModalOpen(true);
  };

  const handleViewCategoryTransactions = (categoryId: string, categoryName: string) => {
    setViewingCategory({ id: categoryId, name: categoryName });
  };
  
  const transactionsForModal = useMemo(() => {
    if (!viewingCategory) return [];
    return transactionsForMonth.filter(t => t.categoryId === viewingCategory.id);
  }, [transactionsForMonth, viewingCategory]);
  
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'category') {
      onRemoveCategory(deleteTarget.id);
    } else if (deleteTarget.type === 'group') {
      onRemoveCategoryGroup(deleteTarget.id);
    } else if (deleteTarget.type === 'incomeSource') {
      onRemoveIncomeSource(deleteTarget.id);
    }
    setDeleteTarget(null);
  };
  
  const handleTransactionDeleteConfirm = () => {
    if (!transactionToDelete) return;
    onRemoveTransaction(transactionToDelete.id);
    setTransactionToDelete(null);
  }

  const handleMonthSelect = (newDate: Date) => {
    setCurrentMonth(newDate);
    setIsPickerOpen(false);
  };
  
  const openAddIncomeSourceModal = () => {
    setEditingIncomeSource(null);
    setIsIncomeSourceModalOpen(true);
  };
  const openEditIncomeSourceModal = (source: IncomeSource) => {
    setEditingIncomeSource(source);
    setIsIncomeSourceModalOpen(true);
  };

    const handleSaveBulkEdit = (updates: { newAccountId?: string, newCategoryId?: string }) => {
        onBulkUpdateTransactions(Array.from(selectedIds), updates);
        setIsBulkEditModalOpen(false);
        setSelectionMode(false);
        setSelectedIds(new Set());
    };
    
    const hasNonExpenseInSelection = useMemo(() => {
        return transactionsForMonth.filter(t => selectedIds.has(t.id)).some(t => t.type !== 'expense');
    }, [selectedIds, transactionsForMonth]);

  const getDeleteModalContent = () => {
    if (!deleteTarget) return { title: '', message: '' };
    switch (deleteTarget.type) {
      case 'category':
        return {
          title: `Видалити категорію`,
          message: <>
            <p>Ви впевнені, що хочете видалити "{deleteTarget.name}"?</p>
            <p className="mt-2 text-sm text-red-600 font-semibold">Усі транзакції в цій категорії буде видалено.</p>
            <p className="mt-2 text-sm text-slate-500">Цю дію неможливо скасувати.</p>
          </>
        };
      case 'group':
         return {
          title: `Видалити групу`,
          message: <>
            <p>Ви впевнені, що хочете видалити "{deleteTarget.name}"?</p>
            <p className="mt-2 text-sm text-red-600 font-semibold">Усі категорії та їхні транзакції в цій групі буде видалено.</p>
            <p className="mt-2 text-sm text-slate-500">Цю дію неможливо скасувати.</p>
          </>
        };
      case 'incomeSource':
        return {
          title: 'Видалити джерело доходу',
          message: <>
            <p>Ви впевнені, що хочете видалити "{deleteTarget.name}"?</p>
            <p className="mt-2 text-sm text-slate-500">Транзакції з цього джерела не буде видалено, але вони втратять зв'язок з ним.</p>
          </>
        };
      default:
        return { title: '', message: '' };
    }
  };
  const { title: deleteModalTitle, message: deleteModalMessage } = getDeleteModalContent();


  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
      
      {/* --- Summary Header --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 text-center md:text-left">
          <h2 className="text-base sm:text-lg font-medium text-slate-500">Доходи за місяць</h2>
          <p className="text-3xl sm:text-4xl font-bold mt-1 text-green-600">
            {formatDisplayAmount({ amountInUah: totalReceivedIncome, targetCurrency: currency, rates, settings })}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 text-center md:text-left">
          <h2 className="text-base sm:text-lg font-medium text-slate-500">Витрати за місяць</h2>
          <p className={`text-3xl sm:text-4xl font-bold mt-1 ${getCurrencyClass(totalActivity)}`}>
            {formatDisplayAmount({ amountInUah: totalActivity, targetCurrency: currency, rates, settings })}
          </p>
        </div>
      </div>
      
      {/* --- Income Section --- */}
      <div className="bg-green-50/50 border border-green-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2"><ArrowUpIcon className="w-5 h-5"/>Доходи</h3>
                <p className="text-sm text-green-700">Отримано {formatCurrency(totalReceivedIncome, 'UAH')} з {formatCurrency(totalExpectedIncome, 'UAH')} очікуваних</p>
            </div>
            <button
                onClick={openAddIncomeSourceModal}
                className="inline-flex items-center px-3 py-2 border border-green-600/30 text-sm font-medium rounded-md shadow-sm text-green-800 bg-white hover:bg-green-50 flex-shrink-0"
            >
                <PlusCircleIcon className="w-5 h-5 mr-2 -ml-1" />
                Додати джерело
            </button>
        </div>
        <div className="space-y-3">
            {incomeSources.map(source => (
                <IncomeSourceRow 
                    key={source.id}
                    source={source}
                    receivedAmount={receivedBySource.get(source.id) || 0}
                    onEdit={() => openEditIncomeSourceModal(source)}
                    onDelete={() => setDeleteTarget({ type: 'incomeSource', id: source.id, name: source.name })}
                />
            ))}
            {incomeSources.length === 0 && (
                <p className="text-center text-green-700/80 p-4">Ви ще не додали жодного джерела доходу.</p>
            )}
        </div>
      </div>

      {/* --- Desktop Table View (Expenses) --- */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3">Категорія</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Витрати</th>
              <th className="px-1 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {expenseCategoryGroups.map(group => (
              <React.Fragment key={group.id}>
                <tr className="bg-slate-100">
                  <td className="px-6 py-2 text-sm font-semibold text-slate-700 flex items-center">
                    {group.name}
                    <button 
                        onClick={() => setDeleteTarget({ type: 'group', id: group.id, name: group.name })}
                        className="ml-4 text-slate-400 hover:text-red-500"
                        title="Видалити групу"
                    >
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                  </td>
                  <td className="px-6 py-2 text-right">
                     <button 
                        onClick={() => openAddCategoryModal(group.id)}
                        className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                       <PlusCircleIcon className="w-4 h-4 mr-1" />
                       Додати категорію
                     </button>
                  </td>
                   <td>
                     <button onClick={() => setIsAddGroupModalOpen(true)} className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800">
                        <FolderPlusIcon className="w-4 h-4 mr-1" />
                        Додати групу
                      </button>
                   </td>
                </tr>
                {group.categories.map(category => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    activity={activityByCategoryId.get(category.id) || 0}
                    onActivityClick={handleViewCategoryTransactions}
                    onAddExpenseClick={handleAddExpenseForCategory}
                    onDelete={(categoryId, categoryName) => setDeleteTarget({ type: 'category', id: categoryId, name: categoryName })}
                  />
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Mobile Card View --- */}
      <div className="lg:hidden space-y-4">
        {/* Expense Categories */}
        {expenseCategoryGroups.map(group => (
          <div key={group.id} className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-4 py-3 border-b rounded-t-lg bg-slate-50 border-slate-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-slate-700 truncate">{group.name}</h3>
                        <button 
                            onClick={() => setDeleteTarget({ type: 'group', id: group.id, name: group.name })}
                            className="text-slate-400 hover:text-red-500 flex-shrink-0"
                            title="Видалити групу"
                        >
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                    <button 
                        onClick={() => openAddCategoryModal(group.id)}
                        className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 flex-shrink-0"
                    >
                        <PlusCircleIcon className="w-4 h-4 mr-1" />
                        <span>Додати</span>
                    </button>
                </div>
            </div>
            <div className="divide-y divide-slate-200">
                {group.categories.length > 0 ? group.categories.map(category => (
                    <CategoryCardMobile
                        key={category.id}
                        category={category}
                        activity={activityByCategoryId.get(category.id) || 0}
                        onActivityClick={handleViewCategoryTransactions}
                        onDelete={(categoryId, categoryName) => setDeleteTarget({ type: 'category', id: categoryId, name: categoryName })}
                    />
                )) : (
                    <p className="text-center text-slate-500 p-4 text-sm">Немає категорій у цій групі.</p>
                )}
            </div>
          </div>
        ))}
      </div>

      <RecentTransactions 
        transactions={transactionsForMonth} 
        categoryGroups={categoryGroups}
        incomeSources={incomeSources}
        accounts={accounts}
        isCollapsed={isRecentTransactionsCollapsed}
        onToggleCollapse={() => setRecentTransactionsCollapsed(!isRecentTransactionsCollapsed)}
        onEdit={openEditTransactionModal}
        onDelete={setTransactionToDelete}
        onRemoveMultiple={onRemoveMultipleTransactions}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onSetSelectionMode={setSelectionMode}
        onSetSelectedIds={setSelectedIds}
        onBulkEdit={() => setIsBulkEditModalOpen(true)}
      />

      <FloatingActionButton 
        onAddTransaction={openAddTransactionModal}
        disabled={accounts.length === 0}
      />

      {/* --- Modals --- */}
      {isAddTransactionModalOpen && (
        <AddTransactionModal
          isOpen={isAddTransactionModalOpen}
          onClose={closeAddTransactionModal}
          onAddTransaction={onAddTransaction}
          onUpdateTransaction={onUpdateTransaction}
          initialType={transactionModalType}
          categoryGroups={categoryGroups}
          accounts={accounts}
          incomeSources={incomeSources}
          investmentPlatforms={investmentPlatforms}
          defaultCategoryId={prefilledCategoryId}
          transactionToEdit={editingTransaction}
        />
      )}
      
      {viewingCategory && (
        <TransactionListModal
          isOpen={!!viewingCategory}
          onClose={() => setViewingCategory(null)}
          transactions={transactionsForModal}
          categoryName={viewingCategory.name}
          onEdit={openEditTransactionModal}
          onDelete={setTransactionToDelete}
          accounts={accounts}
        />
      )}
      
      {deleteTarget && (
        <ConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title={deleteModalTitle}
          message={deleteModalMessage}
        />
      )}
      
      {transactionToDelete && (
        <ConfirmationModal
          isOpen={!!transactionToDelete}
          onClose={() => setTransactionToDelete(null)}
          onConfirm={handleTransactionDeleteConfirm}
          title="Видалити транзакцію"
          message={<p>Ви впевнені, що хочете видалити цю транзакцію?</p>}
        />
      )}

      <AddGroupModal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        onAddGroup={onAddCategoryGroup}
      />
      
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onSave={(categoryName) => { if (currentGroupId) { onAddCategory(currentGroupId, categoryName); } }}
      />

      <AddIncomeSourceModal
          isOpen={isIncomeSourceModalOpen}
          onClose={() => setIsIncomeSourceModalOpen(false)}
          onSave={onAddOrUpdateIncomeSource}
          sourceToEdit={editingIncomeSource}
      />
      
      <BulkEditModal
          isOpen={isBulkEditModalOpen}
          onClose={() => setIsBulkEditModalOpen(false)}
          onSave={handleSaveBulkEdit}
          transactionCount={selectedIds.size}
          accounts={accounts}
          categoryGroups={categoryGroups}
          hasNonExpenseItems={hasNonExpenseInSelection}
      />
    </div>
  );
};

export default React.memo(TransactionsPage);
