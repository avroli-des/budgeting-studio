import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Transaction, Category, Account, IncomeSource, CategoryGroup, Currency } from '../types';
import { getCurrencyClass, formatDisplayAmount } from '../helpers';
import { ListCollapseIcon, ChevronDownIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, ArrowRightLeftIcon } from './icons';
import { useCurrency } from '../contexts/CurrencyContext';
import ConfirmationModal from './ConfirmationModal';

interface TransactionMenuProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const TransactionMenu: React.FC<TransactionMenuProps> = ({ transaction, onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Меню транзакції"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <button
                            onClick={() => { onEdit(transaction); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            <PencilIcon className="w-4 h-4 text-slate-500" />
                            <span>Редагувати</span>
                        </button>
                        <button
                            onClick={() => { onDelete(transaction); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                            <TrashIcon className="w-4 h-4 text-red-500" />
                            <span>Видалити</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


interface RecentTransactionsProps {
  transactions: Transaction[];
  categoryGroups: CategoryGroup[];
  accounts: Account[];
  incomeSources: IncomeSource[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onRemoveMultiple: (ids: string[]) => void;
  
  // Selection control props from parent
  selectionMode: boolean;
  selectedIds: Set<string>;
  onSetSelectionMode: (mode: boolean) => void;
  onSetSelectedIds: (ids: Set<string>) => void;
  onBulkEdit: () => void;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
    transactions, 
    categoryGroups, 
    accounts, 
    incomeSources, 
    isCollapsed, 
    onToggleCollapse, 
    onEdit, 
    onDelete, 
    onRemoveMultiple,
    selectionMode,
    selectedIds,
    onSetSelectionMode,
    onSetSelectedIds,
    onBulkEdit,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterAccountId, setFilterAccountId] = useState('all');
  const [filterCategoryId, setFilterCategoryId] = useState('all');
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const { currency, rates, settings } = useCurrency();

  const accountsById = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);
  const categoriesById = useMemo(() => {
      const map = new Map<string, Category>();
      categoryGroups.forEach(group => {
          group.categories.forEach(cat => {
              map.set(cat.id, cat);
          });
      });
      return map;
  }, [categoryGroups]);
  const incomeSourcesById = useMemo(() => new Map(incomeSources.map(s => [s.id, s])), [incomeSources]);

  // Reset category filter if type is not compatible
  useEffect(() => {
      if (filterType === 'income' || filterType === 'transfer') {
          setFilterCategoryId('all');
      }
  }, [filterType]);
  
  const handleResetFilters = () => {
      setFilterType('all');
      setFilterAccountId('all');
      setFilterCategoryId('all');
  };

  const sortedTransactions = useMemo(() => [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [transactions]);
    
  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter(t => {
        const typeMatch = filterType === 'all' || t.type === filterType;
        const accountMatch = filterAccountId === 'all' || t.accountId === filterAccountId || t.transferToAccountId === filterAccountId;
        
        let categoryMatch = true;
        if (filterCategoryId !== 'all') {
            categoryMatch = t.type === 'expense' && t.categoryId === filterCategoryId;
        }

        return typeMatch && accountMatch && categoryMatch;
    });
  }, [sortedTransactions, filterType, filterAccountId, filterCategoryId]);

  const transactionsToDisplay = showAll ? filteredTransactions : filteredTransactions.slice(0, 10);

  const findCategoryName = (t: Transaction): string => {
    if (t.type === 'income') {
        if (t.incomeSourceId) return incomeSourcesById.get(t.incomeSourceId)?.name || 'Дохід';
        return 'Дохід';
    }
    if (t.type === 'transfer') return 'Переказ';
    if (t.categoryId) return categoriesById.get(t.categoryId)?.name || 'Без категорії';
    return 'Без категорії';
  };

  const getTransactionSubtext = (t: Transaction): React.ReactNode => {
    if (t.type === 'transfer') {
        const fromAcc = accountsById.get(t.accountId)?.name || 'Невідомий';
        const toAcc = t.transferToAccountId ? accountsById.get(t.transferToAccountId)?.name || 'Невідомий' : 'Невідомий';
        return (
            <span className="flex items-center gap-1.5">
                <span>{fromAcc}</span>
                <ArrowRightLeftIcon className="w-3 h-3 text-slate-400"/>
                <span>{toAcc}</span>
            </span>
        )
    }
    const categoryName = findCategoryName(t);
    const accountName = accountsById.get(t.accountId)?.name || 'Невідомий';
    return `${categoryName} · ${accountName}`;
  };
  
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSetSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      onSetSelectedIds(new Set());
    } else {
      onSetSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const handleCancelSelectionMode = () => {
    onSetSelectionMode(false);
    onSetSelectedIds(new Set());
  };
  
  const handleDeleteSelected = () => {
      if (selectedIds.size > 0) {
          setIsConfirmModalOpen(true);
      }
  };

  const handleConfirmDelete = () => {
    onRemoveMultiple(Array.from(selectedIds));
    setIsConfirmModalOpen(false);
    onSetSelectionMode(false);
    onSetSelectedIds(new Set());
  };
  
  const hasTransfersInSelection = useMemo(() => {
    return filteredTransactions.filter(t => selectedIds.has(t.id)).some(t => t.type === 'transfer');
  }, [selectedIds, filteredTransactions]);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const numSelected = selectedIds.size;
      const numTotal = filteredTransactions.length;
      selectAllCheckboxRef.current.checked = numSelected === numTotal && numTotal > 0;
      selectAllCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numTotal;
    }
  }, [selectedIds, filteredTransactions.length]);


  const hasFilters = filterType !== 'all' || filterAccountId !== 'all' || filterCategoryId !== 'all';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <button 
          onClick={onToggleCollapse}
          className="w-full p-4 border-b border-slate-200 flex justify-between items-center hover:bg-slate-50"
          aria-expanded={!isCollapsed}
        >
          <div className="flex items-center">
            <ListCollapseIcon className="h-6 w-6 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-800 ml-3">Останні транзакції</h3>
          </div>
          <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>
        {!isCollapsed && (
          <div>
            {/* --- Filter Section --- */}
            <div className="p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                    <label htmlFor="filter-type" className="block text-xs font-medium text-slate-500">Тип</label>
                    <select id="filter-type" value={filterType} onChange={e => setFilterType(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="all">Всі типи</option>
                        <option value="expense">Витрати</option>
                        <option value="income">Доходи</option>
                        <option value="transfer">Перекази</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="filter-account" className="block text-xs font-medium text-slate-500">Рахунок</label>
                    <select id="filter-account" value={filterAccountId} onChange={e => setFilterAccountId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="all">Всі рахунки</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="filter-category" className="block text-xs font-medium text-slate-500">Категорія (витрати)</label>
                    <select id="filter-category" value={filterCategoryId} onChange={e => setFilterCategoryId(e.target.value)} disabled={filterType === 'income' || filterType === 'transfer'} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm disabled:bg-slate-100 disabled:cursor-not-allowed focus:ring-blue-500 focus:border-blue-500">
                        <option value="all">Всі категорії</option>
                        {categoryGroups.filter(g => g.name !== 'Інвестиції').map(group => (
                            <optgroup key={group.id} label={group.name}>
                                {group.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>
                <div>
                    <button onClick={handleResetFilters} className="w-full bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Скинути
                    </button>
                </div>
            </div>
             {/* Action Header for Selection */}
            <div className="p-4 border-b border-slate-200">
                {selectionMode ? (
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                ref={selectAllCheckboxRef}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label className="text-sm font-medium text-slate-700">
                                {selectedIds.size > 0 ? `${selectedIds.size} вибрано` : 'Вибрати все'}
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                             <button
                                onClick={onBulkEdit}
                                disabled={selectedIds.size === 0 || hasTransfersInSelection}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                                title={hasTransfersInSelection ? "Масове редагування недоступне для переказів" : ""}
                            >
                                <PencilIcon className="w-4 h-4 mr-2" />
                                Редагувати
                            </button>
                            <button
                                onClick={handleDeleteSelected}
                                disabled={selectedIds.size === 0}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300"
                            >
                                <TrashIcon className="w-4 h-4 mr-2" />
                                Видалити
                            </button>
                            <button
                                onClick={handleCancelSelectionMode}
                                className="bg-white py-1.5 px-3 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Скасувати
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-end">
                        <button
                            onClick={() => onSetSelectionMode(true)}
                            className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Вибрати транзакції
                        </button>
                    </div>
                )}
            </div>

            {transactionsToDisplay.length > 0 ? (
                <ul className="divide-y divide-slate-200">
                    {transactionsToDisplay.map(t => {
                        const uahAmountWithSign = t.type === 'income' ? t.amount : -t.amount;
                        const currencyClass = t.type === 'transfer' ? 'text-slate-600' : getCurrencyClass(uahAmountWithSign);
                        const originalAmountWithSign = t.type === 'income' ? t.originalAmount : -(t.originalAmount ?? 0);
                        
                        return (
                             <li key={t.id} className={`flex justify-between items-center hover:bg-slate-50 ${selectionMode ? 'cursor-pointer' : ''} ${selectedIds.has(t.id) ? 'bg-blue-50' : ''}`} onClick={selectionMode ? () => toggleSelection(t.id) : undefined}>
                                {selectionMode && (
                                    <div className="pl-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(t.id)}
                                            readOnly
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                                        />
                                    </div>
                                )}
                                <div className={`flex-1 min-w-0 py-4 ${!selectionMode ? 'pl-4' : 'pl-3'}`}>
                                    <p className="font-medium text-slate-800 truncate">{t.payee}</p>
                                    <p className="text-sm text-slate-500">
                                        {new Date(t.date).toLocaleDateString('uk-UA')} · {getTransactionSubtext(t)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 ml-4 pr-4">
                                  <p className={`font-mono font-medium text-right ${currencyClass}`}>
                                      {formatDisplayAmount({
                                          amountInUah: t.type === 'transfer' ? t.amount : uahAmountWithSign,
                                          targetCurrency: currency,
                                          rates,
                                          settings,
                                          originalAmount: t.type === 'transfer' ? t.originalAmount : originalAmountWithSign,
                                          originalCurrency: t.originalCurrency as Currency,
                                      })}
                                  </p>
                                  {!selectionMode && <TransactionMenu transaction={t} onEdit={onEdit} onDelete={onDelete} />}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            ) : (
                <p className="text-center text-slate-500 p-8">
                    {hasFilters ? "Не знайдено транзакцій, що відповідають фільтрам." : "Ще немає жодних транзакцій для цього місяця."}
                </p>
            )}
            {!showAll && filteredTransactions.length > 10 && (
              <div className="p-4 text-center border-t border-slate-200">
                <button
                  onClick={() => setShowAll(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded px-3 py-1"
                >
                  Показати всі ({filteredTransactions.length})
                </button>
              </div>
            )}
          </div>
        )}
         <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title={`Видалити транзакції (${selectedIds.size})`}
            message={
                <p>Ви впевнені, що хочете видалити вибрані транзакції? Цю дію неможливо скасувати.</p>
            }
        />
    </div>
  );
};

export default RecentTransactions;
