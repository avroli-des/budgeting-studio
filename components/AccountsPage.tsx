import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Account, Transaction, Currency } from '../types';
import { formatCurrency, getCurrencyClass, formatDisplayAmount } from '../helpers';
import { useCurrency } from '../contexts/CurrencyContext';
import { PlusIcon, WalletCardsIcon, ChevronDownIcon, EllipsisVerticalIcon, PencilIcon } from './icons';

interface AccountTransactionListProps {
    transactions: Transaction[];
    accountName: string;
    accountId: string;
    accounts: Account[];
}

const AccountTransactionList: React.FC<AccountTransactionListProps> = ({ transactions, accountName, accountId, accounts }) => {
    const accountsById = new Map<string, Account>(accounts.map(a => [a.id, a]));
    const { currency, rates, settings } = useCurrency();

    const getPayee = (t: Transaction) => {
        if (t.type === 'transfer') {
             const fromAcc = accountsById.get(t.accountId)?.name || 'Невідомий';
             const toAcc = t.transferToAccountId ? accountsById.get(t.transferToAccountId)?.name : 'Невідомий';
             return `Переказ: ${fromAcc} → ${toAcc}`;
        }
        return t.payee;
    }
    
    return (
        <div className="bg-slate-50 px-4 sm:px-6 py-4 border-t border-slate-200">
            <h4 className="font-semibold text-slate-700 mb-3">Транзакції: {accountName}</h4>
            <div className="max-h-96 overflow-y-auto">
                 <ul className="divide-y divide-slate-200">
                {transactions.length > 0 ? transactions.map(t => {
                    let uahAmountWithSign: number;
                    let originalAmountWithSign: number;

                    if (t.type === 'transfer') {
                        uahAmountWithSign = t.accountId === accountId ? -t.amount : t.amount;
                        originalAmountWithSign = t.accountId === accountId ? -(t.originalAmount ?? 0) : (t.originalAmount ?? 0);
                    } else {
                        uahAmountWithSign = t.type === 'income' ? t.amount : -t.amount;
                        originalAmountWithSign = t.type === 'income' ? (t.originalAmount ?? 0) : -(t.originalAmount ?? 0);
                    }
                    
                    const currencyClass = getCurrencyClass(uahAmountWithSign);
                    
                    return (
                        <li key={t.id} className="py-3 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-800">{getPayee(t)}</p>
                                <p className="text-sm text-slate-500">{new Date(t.date).toLocaleDateString('uk-UA')}</p>
                            </div>
                           <span className={`font-mono font-medium ${currencyClass}`}>
                                {formatDisplayAmount({
                                    amountInUah: uahAmountWithSign,
                                    targetCurrency: currency,
                                    rates,
                                    settings,
                                    originalAmount: originalAmountWithSign,
                                    originalCurrency: t.originalCurrency as Currency,
                                })}
                            </span>
                        </li>
                    )
                }) : <p className="text-slate-500 text-center py-4">Для цього рахунку немає транзакцій.</p>}
            </ul>
            </div>
        </div>
    )
}

interface AccountMenuProps {
  onEdit: () => void;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ onEdit }) => {
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
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Меню рахунку"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <button
                            onClick={() => { onEdit(); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            <PencilIcon className="w-4 h-4 text-slate-500" />
                            <span>Редагувати</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


interface AccountRowProps {
    account: Account;
    transactions: Transaction[];
    accounts: Account[];
    onEdit: (account: Account) => void;
}

const AccountRow: React.FC<AccountRowProps> = ({ account, transactions, accounts, onEdit }) => {
    const { currency, rates, settings } = useCurrency();
    const [isExpanded, setIsExpanded] = useState(false);

    const workingBalance = account.balance;
    
    const accountTransactions = useMemo(() => {
        return transactions.filter(t => t.accountId === account.id || t.transferToAccountId === account.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, account.id]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 cursor-pointer hover:bg-slate-50" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{account.name}</h3>
                            <p className="text-sm text-slate-500 capitalize">{account.type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="text-right">
                            <p className={`text-xl font-mono font-bold ${getCurrencyClass(workingBalance)}`}>
                                {formatDisplayAmount({ amountInUah: workingBalance, targetCurrency: currency, rates, settings })}
                            </p>
                        </div>
                        <AccountMenu onEdit={() => onEdit(account)} />
                        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>
            {isExpanded && (
                <AccountTransactionList 
                    transactions={accountTransactions} 
                    accountName={account.name}
                    accountId={account.id}
                    accounts={accounts}
                />
            )}
        </div>
    );
};


interface AccountsPageProps {
  accounts: Account[];
  transactions: Transaction[];
  onAddAccount: () => void;
  onEditAccount: (account: Account) => void;
}

const AccountsPage: React.FC<AccountsPageProps> = ({ accounts, transactions, onAddAccount, onEditAccount }) => {
  const { currency, rates, settings } = useCurrency();
  
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  const sortedAccounts = [...accounts].sort((a,b) => a.name.localeCompare(b.name));

  if (accounts.length === 0) {
      return (
         <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-300">
            <WalletCardsIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-lg font-medium text-slate-900">У вас ще немає рахунків</h3>
            <p className="mt-1 text-sm text-slate-500">Додайте банківський рахунок, готівку або кредитку, щоб почати.</p>
            <div className="mt-6">
                <button
                    type="button"
                    onClick={onAddAccount}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Додати перший рахунок
                </button>
            </div>
        </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto">
       <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <WalletCardsIcon className="w-8 h-8 text-blue-600"/>
                <h1 className="text-3xl font-bold text-slate-800">Рахунки</h1>
            </div>
            <button
                onClick={onAddAccount}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
                <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                Додати рахунок
            </button>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Загальний баланс</h2>
            <p className="text-3xl font-bold font-mono">{formatDisplayAmount({ amountInUah: totalBalance, targetCurrency: currency, rates, settings })}</p>
        </div>


        <div className="space-y-4">
            {sortedAccounts.map(account => (
                <AccountRow 
                    key={account.id} 
                    account={account} 
                    transactions={transactions} 
                    accounts={accounts}
                    onEdit={onEditAccount}
                />
            ))}
        </div>
    </div>
  );
};

export default React.memo(AccountsPage);