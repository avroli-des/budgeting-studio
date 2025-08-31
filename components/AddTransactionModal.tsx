import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Category, Transaction, Account, IncomeSource, CategoryGroup, InvestmentPlatform } from '../types';
import Calendar from './Calendar';
import { CalendarIcon } from './icons';
import { SUPPORTED_CURRENCIES } from '../constants';
import { useCurrency } from '../contexts/CurrencyContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  initialType: 'income' | 'expense' | 'transfer';
  categoryGroups: CategoryGroup[];
  accounts: Account[];
  incomeSources: IncomeSource[];
  investmentPlatforms: InvestmentPlatform[];
  defaultCategoryId?: string | null;
  transactionToEdit?: Transaction | null;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
    isOpen, 
    onClose, 
    onAddTransaction,
    onUpdateTransaction, 
    initialType, 
    categoryGroups, 
    accounts,
    incomeSources,
    investmentPlatforms,
    defaultCategoryId, 
    transactionToEdit 
}) => {
  const [type, setType] = useState(initialType);
  const [payee, setPayee] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [originalCurrency, setOriginalCurrency] = useState('UAH');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [rateSource, setRateSource] = useState<'api' | 'manual'>('manual');
  const [categoryId, setCategoryId] = useState<string | null>('');
  const [incomeSourceId, setIncomeSourceId] = useState<string | undefined>('');
  const [accountId, setAccountId] = useState('');
  const [transferToAccountId, setTransferToAccountId] = useState('');
  const [platformId, setPlatformId] = useState<string | undefined>('');
  const [date, setDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const { rates } = useCurrency();

  const isEditing = transactionToEdit != null;
  const toYYYYMMDD = (d: Date) => d.toISOString().split('T')[0];
  const toDisplayFormat = (d: Date) => new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  
  const isInvestmentCategory = useMemo(() => {
    if (!categoryId) return false;
    const investmentGroup = categoryGroups.find(g => g.name === 'Інвестиції');
    return investmentGroup?.categories.some(c => c.id === categoryId) || false;
  }, [categoryId, categoryGroups]);

  const uahEquivalent = useMemo(() => {
    const numAmount = parseFloat(originalAmount) || 0;
    const numRate = parseFloat(exchangeRate) || 0;
    return numAmount * numRate;
  }, [originalAmount, exchangeRate]);

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setType(transactionToEdit.type);
            setPayee(transactionToEdit.payee);
            setOriginalAmount(String(transactionToEdit.originalAmount ?? transactionToEdit.amount));
            setOriginalCurrency(transactionToEdit.originalCurrency ?? 'UAH');
            setExchangeRate(String(transactionToEdit.exchangeRate ?? 1));
            setRateSource(transactionToEdit.rateSource ?? 'manual');
            setDate(new Date(transactionToEdit.date));
            setCategoryId(transactionToEdit.categoryId);
            setIncomeSourceId(transactionToEdit.incomeSourceId);
            setAccountId(transactionToEdit.accountId);
            setTransferToAccountId(transactionToEdit.transferToAccountId || '');
            setPlatformId(transactionToEdit.platformId || '');
        } else {
            const firstCategory = categoryGroups.find(g => g.name !== 'Інвестиції')?.categories?.[0];
            setType(initialType);
            setPayee('');
            setOriginalAmount('');
            setOriginalCurrency('UAH');
            setExchangeRate('1');
            setRateSource('manual');
            setDate(new Date());
            setCategoryId(defaultCategoryId || (initialType === 'expense' && firstCategory ? firstCategory.id : null));
            setIncomeSourceId(initialType === 'income' && incomeSources.length > 0 ? incomeSources[0].id : undefined);
            setAccountId(accounts.length > 0 ? accounts[0].id : '');
            setTransferToAccountId('');
            setPlatformId(investmentPlatforms.length > 0 ? investmentPlatforms[0].id : '');
        }
        setIsCalendarOpen(false);
    }
  }, [isOpen, isEditing, transactionToEdit, defaultCategoryId, initialType, categoryGroups, accounts, incomeSources, investmentPlatforms]);

  useEffect(() => {
    if (originalCurrency === 'UAH') {
        setExchangeRate('1');
        setRateSource('manual');
    } else if (rates && rates[originalCurrency] && !isEditing) {
        // Only auto-fill for new transactions
        setExchangeRate(String(1 / rates[originalCurrency]));
        setRateSource('api');
    }
  }, [originalCurrency, rates, isEditing]);

  useEffect(() => {
    if (!isEditing) {
        if (type === 'income') {
            setCategoryId(null);
            setIncomeSourceId(incomeSources.length > 0 ? incomeSources[0].id : undefined);
        } else if (type === 'transfer') {
            setCategoryId(null);
            setIncomeSourceId(undefined);
        } else {
            const firstCategory = categoryGroups.find(g => g.name !== 'Інвестиції')?.categories?.[0];
            setCategoryId(defaultCategoryId || (firstCategory ? firstCategory.id : null));
            setIncomeSourceId(undefined);
        }
    }
  }, [type, isEditing, categoryGroups, incomeSources, defaultCategoryId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarContainerRef.current && !calendarContainerRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
    };
    if (isCalendarOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const handleIncomeSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIncomeSourceId = e.target.value;
    setIncomeSourceId(selectedIncomeSourceId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericOriginalAmount = parseFloat(originalAmount);
    if (!numericOriginalAmount || numericOriginalAmount <= 0) return alert("Будь ласка, введіть коректну суму.");
    if (!accountId) return alert("Будь ласка, оберіть рахунок.");
    if (type === 'transfer' && !transferToAccountId) return alert("Будь ласка, оберіть рахунок для переказу.");
    if (type === 'transfer' && accountId === transferToAccountId) return alert("Рахунки для переказу не можуть бути однаковими.");
    if (type === 'expense' && !categoryId) return alert("Будь ласка, оберіть категорію.");
    if (type === 'income' && !incomeSourceId) return alert("Будь ласка, оберіть джерело доходу.");

    const transactionData = {
      payee: payee.trim() || (type === 'transfer' ? 'Переказ' : (type === 'income' ? (incomeSources.find(s => s.id === incomeSourceId)?.name || "Дохід") : "Витрата")),
      amount: uahEquivalent,
      originalCurrency,
      originalAmount: numericOriginalAmount,
      exchangeRate: originalCurrency === 'UAH' ? 1 : parseFloat(exchangeRate) || 1,
      rateSource,
      categoryId: type === 'expense' ? categoryId : null,
      incomeSourceId: type === 'income' ? incomeSourceId : undefined,
      date: toYYYYMMDD(date),
      type,
      accountId,
      transferToAccountId: type === 'transfer' ? transferToAccountId : undefined,
      platformId: (type === 'expense' && isInvestmentCategory) ? platformId : undefined,
    };

    if (isEditing) {
        onUpdateTransaction({ ...transactionData, id: transactionToEdit.id });
    } else {
        onAddTransaction(transactionData);
    }
    onClose();
  };

  const renderTabs = () => (
    <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button type="button" onClick={() => setType('expense')} disabled={isEditing} className={`${type === 'expense' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm disabled:opacity-50`}>Витрата</button>
            <button type="button" onClick={() => setType('income')} disabled={isEditing} className={`${type === 'income' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm disabled:opacity-50`}>Дохід</button>
            <button type="button" onClick={() => setType('transfer')} disabled={isEditing} className={`${type === 'transfer' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm disabled:opacity-50`}>Переказ</button>
        </nav>
    </div>
  );

  if (!isOpen) return null;
  const title = isEditing ? 'Редагувати транзакцію' : 'Додати транзакцію';
  const marketRate = rates && rates[originalCurrency] ? 1 / rates[originalCurrency] : null;


  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md modal-enter" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            </div>

            <div className="p-6 space-y-4">
                {renderTabs()}
                
                {type === 'transfer' ? (
                    <>
                    <div>
                        <label htmlFor="fromAccount" className="block text-sm font-medium text-slate-700">З рахунку</label>
                        <select id="fromAccount" value={accountId} onChange={e => setAccountId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-slate-900 px-3 py-2">
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="toAccount" className="block text-sm font-medium text-slate-700">На рахунок</label>
                        <select id="toAccount" value={transferToAccountId} onChange={e => setTransferToAccountId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-slate-900 px-3 py-2">
                            <option value="" disabled>Оберіть рахунок</option>
                            {accounts.filter(a => a.id !== accountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    </>
                ) : (
                    <>
                    <div>
                        <label htmlFor="payee" className="block text-sm font-medium text-slate-700">{type === 'expense' ? "Отримувач (необов'язково)" : "Платник (необов'язково)"}</label>
                        <input type="text" id="payee" value={payee} onChange={e => setPayee(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="account" className="block text-sm font-medium text-slate-700">Рахунок</label>
                        <select id="account" value={accountId} onChange={e => setAccountId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    </>
                )}

                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Сума</label>
                    <div className="flex gap-2">
                        <input type="number" id="amount" value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="0.00" required step="0.01" />
                        <select id="currency" value={originalCurrency} onChange={e => setOriginalCurrency(e.target.value)} className="mt-1 block w-32 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                            {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                    </div>
                </div>

                {originalCurrency !== 'UAH' && (
                    <div>
                        <label htmlFor="exchangeRate" className="block text-sm font-medium text-slate-700">Обмінний курс (1 {originalCurrency} = ? UAH)</label>
                        <input 
                            type="number" 
                            id="exchangeRate" 
                            value={exchangeRate} 
                            onChange={e => { setExchangeRate(e.target.value); setRateSource('manual'); }} 
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                            placeholder="Напр., 39.5" 
                            required 
                            step="0.0001" 
                        />
                         {marketRate && (
                            <p className="mt-1 text-xs text-slate-500">
                                Ринковий курс: ≈ {marketRate.toFixed(4)}
                            </p>
                        )}
                        <p className="mt-1 text-sm text-slate-500 bg-slate-100 p-2 rounded-md text-center">
                           Еквівалент в UAH: <span className="font-bold">{uahEquivalent.toFixed(2)} ₴</span>
                        </p>
                    </div>
                )}


                {type === 'expense' && (
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700">Категорія</label>
                        <select
                            id="category"
                            value={categoryId || ''}
                            onChange={e => setCategoryId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="" disabled>Оберіть категорію</option>
                            {categoryGroups.map(group => (
                                <optgroup key={group.id} label={group.name}>
                                    {group.categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                )}
                
                {type === 'expense' && isInvestmentCategory && investmentPlatforms.length > 0 && (
                    <div>
                        <label htmlFor="platform" className="block text-sm font-medium text-slate-700">Інвестиційна платформа</label>
                        <select id="platform" value={platformId || ''} onChange={e => setPlatformId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                            <option value="" disabled>Оберіть платформу</option>
                            {investmentPlatforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}

                {type === 'income' && (
                    <div>
                    <label htmlFor="incomeSource" className="block text-sm font-medium text-slate-700">Джерело доходу</label>
                    <select id="incomeSource" value={incomeSourceId || ''} onChange={handleIncomeSourceChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        <option value="" disabled>Оберіть джерело</option>
                        {incomeSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    </div>
                )}
            
                <div>
                    <label className="block text-sm font-medium text-slate-700">Дата</label>
                    <div className="relative mt-1" ref={calendarContainerRef}>
                    <button type="button" onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="relative w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                        <span className="block truncate">{toDisplayFormat(date)}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /></span>
                    </button>
                    {isCalendarOpen && <Calendar selectedDate={date} onSelect={(d) => { setDate(d); setIsCalendarOpen(false); }} onClose={() => setIsCalendarOpen(false)} />}
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Скасувати</button>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{isEditing ? 'Зберегти зміни' : 'Додати'}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;