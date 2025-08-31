import React, { useEffect, useState, useContext, useRef, useMemo, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import TransactionsPage from './components/TransactionsPage';
import ReportsPage from './components/ReportsPage';
import AccountsPage from './components/AccountsPage';
import IncomePage from './components/IncomePage';
import InvestmentPage from './components/InvestmentPage';
import SettingsPage from './components/SettingsPage';
import ImportDataModal from './components/ImportDataModal';
import AddAccountModal from './components/AddAccountModal';
import AchievementToast from './components/gamification/AchievementToast';
import { Category, CategoryGroup, Transaction, Account, IncomeSource, IncomeCategory, MonthlyGoals, MonthlyGoal, UnlockedAchievements, Achievement, AchievementWithStatus, InvestmentPlatform, CurrencySettings, Currency, AppData } from './types';
import { generateDummyData } from './dummyData';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { FirestoreService } from './api/firestore';
import { toYYYYMMDD } from './helpers';
import { ALL_ACHIEVEMENTS, processDataForAchievements } from './gamification/achievements';
import { SUPPORTED_CURRENCIES } from './constants';
import ConfirmationModal from './components/ConfirmationModal';


const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map(c => c.code) as Currency[];
const isValidCurrency = (c: any): c is Currency => {
    return typeof c === 'string' && SUPPORTED_CURRENCY_CODES.includes(c as Currency);
};

const defaultCurrencySettings: CurrencySettings = {
  default: 'UAH',
  reports: 'UAH',
  investments: 'USD',
  roundToWholeNumbers: true,
  showOriginalCurrency: true,
};

const hydrateAppData = (data: Partial<AppData>): AppData => {
    const fullData = {
        appName: 'Мій Поточний Бюджет',
        categoryGroups: [],
        transactions: [],
        accounts: [],
        incomeSources: [],
        monthlyGoals: {},
        unlockedAchievements: {},
        investmentPlatforms: [],
        monthlyInvestmentTarget: 0,
        currencySettings: defaultCurrencySettings,
        ...data,
    };


    const hydratedGroups = (fullData.categoryGroups || []).map(group => ({
        ...group,
        categories: (group.categories || []).map(cat => ({
            ...cat,
        })),
    }));

    const hydratedTransactions = (fullData.transactions || []).map(t => {
        let finalType: Transaction['type'];
        if (t.transferToAccountId) finalType = 'transfer';
        else if (t.incomeSourceId) finalType = 'income';
        else finalType = t.type || 'expense';

        return {
            ...t,
            id: t.id || uuidv4(),
            type: finalType,
            memo: t.memo ?? '',
            accountId: t.accountId ?? '',
            transferToAccountId: finalType === 'transfer' ? (t.transferToAccountId ?? undefined) : undefined,
            categoryId: finalType === 'expense' ? (t.categoryId ?? null) : null,
            incomeSourceId: finalType === 'income' ? (t.incomeSourceId ?? undefined) : undefined,
            platformId: t.platformId ?? undefined,
            originalCurrency: t.originalCurrency || 'UAH',
            originalAmount: typeof t.originalAmount === 'number' ? t.originalAmount : t.amount,
            exchangeRate: typeof t.exchangeRate === 'number' ? t.exchangeRate : 1,
            rateSource: t.rateSource || 'manual',
        };
    });

    const hydratedAccounts = (fullData.accounts || []).map(acc => ({ ...acc, balance: acc.balance ?? 0, isArchived: acc.isArchived ?? false }));
    
    console.log('Before hydration:', (fullData.incomeSources || []).map(s => s.id));
    const hydratedIncomeSources = (fullData.incomeSources || []).map(is => ({ 
        ...is,
        id: is.id || uuidv4(), 
        expectedAmount: is.expectedAmount ?? 0, 
        category: is.category ?? 'other', 
        description: is.description ?? '', 
        isRecurring: is.isRecurring ?? false, 
        paymentDay: is.paymentDay ?? undefined 
    }));
    console.log('After hydration:', hydratedIncomeSources.map(s => s.id));
    
    const rawSettings = fullData.currencySettings;
    const hydratedCurrencySettings: CurrencySettings = {
        default: (rawSettings && isValidCurrency(rawSettings.default)) ? rawSettings.default : defaultCurrencySettings.default,
        reports: (rawSettings && isValidCurrency(rawSettings.reports)) ? rawSettings.reports : defaultCurrencySettings.reports,
        investments: (rawSettings && isValidCurrency(rawSettings.investments)) ? rawSettings.investments : defaultCurrencySettings.investments,
        roundToWholeNumbers: (rawSettings && typeof rawSettings.roundToWholeNumbers === 'boolean') ? rawSettings.roundToWholeNumbers : defaultCurrencySettings.roundToWholeNumbers,
        showOriginalCurrency: (rawSettings && typeof rawSettings.showOriginalCurrency === 'boolean') ? rawSettings.showOriginalCurrency : defaultCurrencySettings.showOriginalCurrency,
    };

    return {
        ...fullData,
        categoryGroups: hydratedGroups,
        transactions: hydratedTransactions,
        accounts: hydratedAccounts,
        incomeSources: hydratedIncomeSources,
        currencySettings: hydratedCurrencySettings,
    };
};

const AppContent: React.FC = () => {
    const { user, isLoading: isAuthLoading } = useContext(AuthContext);
    const [firestoreService, setFirestoreService] = useState<FirestoreService | null>(null);
    const [appData, setAppData] = useState<AppData | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

    const appDataRef = useRef(appData);
    appDataRef.current = appData;

    // Initialize Firestore service when user logs in
    useEffect(() => {
        if (user?.uid) {
            setFirestoreService(new FirestoreService(user.uid));
        } else {
            setFirestoreService(null);
        }
    }, [user]);

    // --- Data Loading and Syncing ---
    useEffect(() => {
        if (isAuthLoading) return; // Wait for auth to settle

        const loadData = async () => {
            setIsDataLoading(true);
            let finalData: AppData;

            if (firestoreService) { // User is logged in, use Firestore
                try {
                    let firestoreData = await firestoreService.loadData();
                    if (firestoreData) {
                        finalData = hydrateAppData(firestoreData);
                    } else {
                        // No data in Firestore for this user.
                        // This is a new user, so generate dummy data and save it.
                        // The user can import their own data via the UI if they have it.
                        finalData = generateDummyData();
                        await firestoreService.saveData(finalData);
                    }
                } catch (error) {
                    console.error("Критична помилка синхронізації з Firestore. Використовуються локальні дані як аварійний варіант.", error);
                    const localDataString = localStorage.getItem('my-budget-app-data');
                    finalData = hydrateAppData(localDataString ? JSON.parse(localDataString) : generateDummyData());
                }
            } else { // Guest user, use Local Storage
                const localDataString = localStorage.getItem('my-budget-app-data');
                finalData = hydrateAppData(localDataString ? JSON.parse(localDataString) : generateDummyData());
            }

            finalData.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setAppData(finalData);
            setIsDataLoading(false);
        };

        loadData();
    }, [firestoreService, isAuthLoading]);

    // Effect for saving data to local storage for GUEST users
    useEffect(() => {
        // Only save to localStorage if it's a guest user (no firestoreService)
        if (!firestoreService && !isAuthLoading && !isDataLoading && appData) {
            localStorage.setItem('my-budget-app-data', JSON.stringify(appData));
        }
    }, [appData, firestoreService, isAuthLoading, isDataLoading]);

    // --- Gamification Logic ---
    const processedDataForAchievements = useMemo(() => {
        if (!appData) return null;
        return processDataForAchievements(appData.transactions, appData.monthlyGoals, appData.incomeSources);
    }, [appData?.transactions, appData?.monthlyGoals, appData?.incomeSources]);

    useEffect(() => {
        if (!processedDataForAchievements || !appData) return;
        
        const newUnlocks: UnlockedAchievements = {};
        const newAchievements: Achievement[] = [];
        let changed = false;
        const currentUnlocked = appData.unlockedAchievements;

        ALL_ACHIEVEMENTS.forEach(ach => {
            if (!currentUnlocked[ach.id]) {
                const { achieved } = ach.checker(processedDataForAchievements);
                if (achieved) {
                    newUnlocks[ach.id] = new Date().toISOString();
                    newAchievements.push(ach);
                    changed = true;
                }
            }
        });

        if (changed) {
            setAppData(prev => prev ? ({ ...prev, unlockedAchievements: { ...prev.unlockedAchievements, ...newUnlocks } }) : null);
            setNewlyUnlocked(prev => [...prev, ...newAchievements]);
            setHasUnsavedChanges(true);
        }
    }, [processedDataForAchievements, appData?.unlockedAchievements]);

    const achievementsWithStatus = useMemo((): AchievementWithStatus[] => {
        if (!processedDataForAchievements || !appData) return [];
        return ALL_ACHIEVEMENTS.map((ach): AchievementWithStatus => {
            const unlockedDate = appData.unlockedAchievements[ach.id];
            const { progress, count } = ach.checker(processedDataForAchievements);
            if (unlockedDate) {
                return { ...ach, status: 'completed', progress: 1, unlockedDate, count };
            }
            return { ...ach, status: progress > 0 ? 'in-progress' : 'locked', progress, unlockedDate: undefined, count };
        }).sort((a, b) => {
             const statusOrder: Record<'completed' | 'in-progress' | 'locked', number> = { completed: 0, 'in-progress': 1, locked: 2 };
            return statusOrder[a.status] - statusOrder[b.status];
        });
    }, [processedDataForAchievements, appData?.unlockedAchievements]);

    // --- Data Handlers ---
    const handleSaveChanges = useCallback(async () => {
        if (!firestoreService || !appDataRef.current) return;
        setIsSaving(true);
        try {
            await firestoreService.saveData(appDataRef.current);
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error("Failed to save changes to Firestore:", error);
            alert("Не вдалося зберегти зміни. Перевірте з'єднання з Інтернетом.");
        } finally {
            setIsSaving(false);
        }
    }, [firestoreService]);

    const handleAddOrUpdateState = useCallback((updater: (prev: AppData) => Partial<AppData>) => {
        setAppData(prev => prev ? ({ ...prev, ...updater(prev) }) : null);
        setHasUnsavedChanges(true);
    }, []);

    const handleAppNameChange = useCallback((newName: string) => handleAddOrUpdateState(() => ({ appName: newName })), [handleAddOrUpdateState]);

    const handleAddTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
        const newTransaction = { ...transaction, id: uuidv4() };
        
        handleAddOrUpdateState(prev => {
            const newTransactions = [...prev.transactions, newTransaction].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const newAccounts = prev.accounts.map(acc => {
                if (newTransaction.type === 'transfer') {
                    if (acc.id === newTransaction.accountId) return { ...acc, balance: acc.balance - newTransaction.amount };
                    if (acc.id === newTransaction.transferToAccountId) return { ...acc, balance: acc.balance + newTransaction.amount };
                } else if (newTransaction.type === 'income') {
                    if (acc.id === newTransaction.accountId) return { ...acc, balance: acc.balance + newTransaction.amount };
                } else if (newTransaction.type === 'expense') {
                    if (acc.id === newTransaction.accountId) return { ...acc, balance: acc.balance - newTransaction.amount };
                }
                return acc;
            });
            return { transactions: newTransactions, accounts: newAccounts };
        });
    }, [handleAddOrUpdateState]);

    const handleUpdateTransaction = useCallback((updatedTransaction: Transaction) => {
        handleAddOrUpdateState(prev => {
            const originalTransaction = prev.transactions.find(t => t.id === updatedTransaction.id);
            if (!originalTransaction) return {};

            const newTransactions = prev.transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            let newAccounts = [...prev.accounts];
            // Revert original transaction
            const fromOriginal = newAccounts.find(a => a.id === originalTransaction.accountId);
            const toOriginal = originalTransaction.transferToAccountId ? newAccounts.find(a => a.id === originalTransaction.transferToAccountId) : null;
            if (originalTransaction.type === 'income' && fromOriginal) fromOriginal.balance -= originalTransaction.amount;
            else if (originalTransaction.type === 'expense' && fromOriginal) fromOriginal.balance += originalTransaction.amount;
            else if (originalTransaction.type === 'transfer') {
                if (fromOriginal) fromOriginal.balance += originalTransaction.amount;
                if (toOriginal) toOriginal.balance -= originalTransaction.amount;
            }
            // Apply updated transaction
            const fromUpdated = newAccounts.find(a => a.id === updatedTransaction.accountId);
            const toUpdated = updatedTransaction.transferToAccountId ? newAccounts.find(a => a.id === updatedTransaction.transferToAccountId) : null;
            if (updatedTransaction.type === 'income' && fromUpdated) fromUpdated.balance += updatedTransaction.amount;
            else if (updatedTransaction.type === 'expense' && fromUpdated) fromUpdated.balance -= updatedTransaction.amount;
            else if (updatedTransaction.type === 'transfer') {
                if (fromUpdated) fromUpdated.balance -= updatedTransaction.amount;
                if (toUpdated) toUpdated.balance += updatedTransaction.amount;
            }
            
            return { transactions: newTransactions, accounts: newAccounts };
        });
    }, [handleAddOrUpdateState]);

    const handleRemoveTransaction = useCallback((transactionId: string) => {
        handleAddOrUpdateState(prev => {
            const transactionToRemove = prev.transactions.find(t => t.id === transactionId);
            if (!transactionToRemove) return {};

            const newTransactions = prev.transactions.filter(t => t.id !== transactionId);
            const newAccounts = prev.accounts.map(acc => {
                if (transactionToRemove.type === 'transfer') {
                    if (acc.id === transactionToRemove.accountId) return { ...acc, balance: acc.balance + transactionToRemove.amount };
                    if (acc.id === transactionToRemove.transferToAccountId) return { ...acc, balance: acc.balance - transactionToRemove.amount };
                } else if (transactionToRemove.type === 'income') {
                    if (acc.id === transactionToRemove.accountId) return { ...acc, balance: acc.balance - transactionToRemove.amount };
                } else if (transactionToRemove.type === 'expense') {
                    if (acc.id === transactionToRemove.accountId) return { ...acc, balance: acc.balance + transactionToRemove.amount };
                }
                return acc;
            });
            return { transactions: newTransactions, accounts: newAccounts };
        });
    }, [handleAddOrUpdateState]);

    const handleRemoveMultipleTransactions = useCallback((transactionIds: string[]) => {
        handleAddOrUpdateState(prev => {
            const transactionsToRemove = new Set(transactionIds);
            const removedTransactionsDetails = prev.transactions.filter(t => transactionsToRemove.has(t.id));
            if (removedTransactionsDetails.length === 0) return {};

            const newTransactions = prev.transactions.filter(t => !transactionsToRemove.has(t.id));
            
            const accountsMap = new Map<string, Account>(prev.accounts.map(acc => [acc.id, { ...acc }]));

            removedTransactionsDetails.forEach(transaction => {
                if (transaction.type === 'transfer') {
                    if (accountsMap.has(transaction.accountId)) {
                        accountsMap.get(transaction.accountId)!.balance += transaction.amount;
                    }
                    if (transaction.transferToAccountId && accountsMap.has(transaction.transferToAccountId)) {
                        accountsMap.get(transaction.transferToAccountId)!.balance -= transaction.amount;
                    }
                } else if (transaction.type === 'income') {
                    if (accountsMap.has(transaction.accountId)) {
                        accountsMap.get(transaction.accountId)!.balance -= transaction.amount;
                    }
                } else if (transaction.type === 'expense') {
                    if (accountsMap.has(transaction.accountId)) {
                        accountsMap.get(transaction.accountId)!.balance += transaction.amount;
                    }
                }
            });

            const newAccounts = Array.from(accountsMap.values());
            return { transactions: newTransactions, accounts: newAccounts };
        });
    }, [handleAddOrUpdateState]);
    
    const handleBulkUpdateTransactions = useCallback((transactionIds: string[], updates: { newAccountId?: string, newCategoryId?: string }) => {
        handleAddOrUpdateState(prev => {
            const idsToUpdate = new Set(transactionIds);
            const transactionsToUpdate = prev.transactions.filter(t => idsToUpdate.has(t.id));
            if (transactionsToUpdate.length === 0) return {};

            const accountsMap = new Map<string, Account>(prev.accounts.map(acc => [acc.id, { ...acc }]));

            const updatedTransactions = prev.transactions.map(t => {
                if (!idsToUpdate.has(t.id)) {
                    return t;
                }

                // Handle account change and balance recalculation
                if (updates.newAccountId && updates.newAccountId !== t.accountId) {
                    const originalAccount = accountsMap.get(t.accountId);
                    const newAccount = accountsMap.get(updates.newAccountId);

                    if (originalAccount) {
                        if (t.type === 'income') originalAccount.balance -= t.amount;
                        else if (t.type === 'expense') originalAccount.balance += t.amount;
                        // Transfers are not bulk-editable, so no need to handle that case here
                    }
                    if (newAccount) {
                        if (t.type === 'income') newAccount.balance += t.amount;
                        else if (t.type === 'expense') newAccount.balance -= t.amount;
                    }
                }
                
                // Apply updates to the transaction
                return {
                    ...t,
                    accountId: updates.newAccountId || t.accountId,
                    // Only update category if the transaction is an expense and a new category is provided
                    categoryId: (t.type === 'expense' && updates.newCategoryId) ? updates.newCategoryId : t.categoryId,
                };
            });

            const newAccounts = Array.from(accountsMap.values());
            return {
                transactions: updatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                accounts: newAccounts
            };
        });
    }, [handleAddOrUpdateState]);

    const handleAddOrUpdateAccount = useCallback((data: { id?: string, name: string; type: Account['type']; initialBalance?: number }) => {
        if (data.id) { // Update
            handleAddOrUpdateState(prev => ({
                accounts: prev.accounts.map(acc => acc.id === data.id ? { ...acc, name: data.name, type: data.type } : acc)
            }));
        } else { // Add
            const newAccount: Account = { id: uuidv4(), name: data.name, type: data.type, balance: data.initialBalance || 0, isArchived: false };
            const openingTx: Omit<Transaction, 'id'> | null = (data.initialBalance && data.initialBalance !== 0) ? {
                date: toYYYYMMDD(new Date()),
                payee: "Початковий баланс",
                categoryId: null,
                amount: Math.abs(data.initialBalance),
                type: data.initialBalance > 0 ? 'income' : 'expense',
                accountId: newAccount.id,
                originalCurrency: 'UAH',
                originalAmount: Math.abs(data.initialBalance),
                exchangeRate: 1,
                rateSource: 'manual',
            } : null;
            
            handleAddOrUpdateState(prev => {
                const newTransactions = openingTx ? [...prev.transactions, { ...openingTx, id: uuidv4() }].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : prev.transactions;
                return {
                    accounts: [...prev.accounts, newAccount],
                    transactions: newTransactions
                };
            });
        }
    }, [handleAddOrUpdateState]);
    
    const handleAddOrUpdateIncomeSource = useCallback((sourceData: { id?: string; name: string; category: IncomeCategory; expectedAmount: number, description?: string, isRecurring?: boolean, paymentDay?: number }) => {
        if (sourceData.id) { // This is an update
            handleAddOrUpdateState(prev => ({
                incomeSources: prev.incomeSources.map(s => s.id === sourceData.id ? { ...s, ...sourceData } : s)
            }));
        } else { // This is a new source
            console.log('--- Creating New Income Source ---');
            console.log('Received raw source data:', sourceData);

            const generatedId = uuidv4();
            console.log('Generated new ID:', generatedId);
            
            // Explicitly build the new object to avoid overwriting the generated ID with an undefined one from sourceData
            const newIncomeSource: IncomeSource = {
                id: generatedId,
                name: sourceData.name,
                category: sourceData.category,
                expectedAmount: sourceData.expectedAmount,
                description: sourceData.description,
                isRecurring: sourceData.isRecurring ?? false,
                paymentDay: sourceData.paymentDay,
            };
            
            console.log('Final new income source object being saved:', newIncomeSource);

            if (!newIncomeSource.id) {
                console.error('CRITICAL: Cannot create income source without a valid ID. Aborting save.');
                return;
            }

            handleAddOrUpdateState(prev => {
                console.log('State before adding new source:', prev.incomeSources.map(s => ({ name: s.name, id: s.id })));
                const updatedSources = [...prev.incomeSources, newIncomeSource];
                console.log('State after adding new source:', updatedSources.map(s => ({ name: s.name, id: s.id })));
                return {
                    incomeSources: updatedSources
                };
            });
        }
    }, [handleAddOrUpdateState]);
    
    const handleRemoveIncomeSource = useCallback((sourceId: string) => {
        handleAddOrUpdateState(prev => ({
            transactions: prev.transactions.map(t => t.incomeSourceId === sourceId ? { ...t, incomeSourceId: undefined } : t),
            incomeSources: prev.incomeSources.filter(s => s.id !== sourceId)
        }));
    }, [handleAddOrUpdateState]);

    const handleAddOrUpdateMonthlyGoal = useCallback((monthKey: string, goalData: MonthlyGoal) => handleAddOrUpdateState(prev => ({ monthlyGoals: { ...prev.monthlyGoals, [monthKey]: goalData } })), [handleAddOrUpdateState]);
    const handleAddCategoryGroup = useCallback((groupName: string) => handleAddOrUpdateState(prev => ({ categoryGroups: [...prev.categoryGroups, { id: uuidv4(), name: groupName, categories: [] }] })), [handleAddOrUpdateState]);
    const handleAddCategory = useCallback((groupId: string, categoryName: string) => handleAddOrUpdateState(prev => ({ categoryGroups: prev.categoryGroups.map(g => g.id === groupId ? { ...g, categories: [...g.categories, { id: uuidv4(), name: categoryName }] } : g) })), [handleAddOrUpdateState]);
    const handleUpdateCategory = useCallback((categoryId: string, newName: string) => handleAddOrUpdateState(prev => ({ categoryGroups: prev.categoryGroups.map(g => ({ ...g, categories: g.categories.map(c => c.id === categoryId ? { ...c, name: newName } : c) })) })), [handleAddOrUpdateState]);
    const handleUpdateCategoryDetails = useCallback((categoryId: string, details: Partial<Omit<Category, 'id'>>) => handleAddOrUpdateState(prev => ({ categoryGroups: prev.categoryGroups.map(g => ({ ...g, categories: g.categories.map(c => c.id === categoryId ? { ...c, ...details } : c) })) })), [handleAddOrUpdateState]);

    const handleRemoveCategory = useCallback((categoryId: string) => {
        handleAddOrUpdateState(prev => ({
            categoryGroups: prev.categoryGroups.map(g => ({ ...g, categories: g.categories.filter(c => c.id !== categoryId) })),
            transactions: prev.transactions.map(t => t.categoryId === categoryId ? { ...t, categoryId: null } : t)
        }));
    }, [handleAddOrUpdateState]);

    const handleRemoveCategoryGroup = useCallback((groupId: string) => {
        handleAddOrUpdateState(prev => {
            const groupToRemove = prev.categoryGroups.find(g => g.id === groupId);
            if (!groupToRemove) return {};
            const categoryIdsToRemove = new Set(groupToRemove.categories.map(c => c.id));
            return {
                categoryGroups: prev.categoryGroups.filter(g => g.id !== groupId),
                transactions: prev.transactions.map(t => t.categoryId && categoryIdsToRemove.has(t.categoryId) ? { ...t, categoryId: null } : t)
            };
        });
    }, [handleAddOrUpdateState]);
    
    const handleAddOrUpdateInvestment = useCallback((data: { id?: string; name: string; target: number }) => {
        handleAddOrUpdateState(prev => {
            const newGroups = JSON.parse(JSON.stringify(prev.categoryGroups));
            let investmentGroup = newGroups.find((g: CategoryGroup) => g.name === "Інвестиції");
            if (!investmentGroup) {
                investmentGroup = { id: uuidv4(), name: "Інвестиції", categories: [] };
                newGroups.push(investmentGroup);
            }
            if (data.id) {
                investmentGroup.categories = investmentGroup.categories.map((cat: Category) => cat.id === data.id ? { ...cat, name: data.name, goalTarget: data.target } : cat);
            } else {
                investmentGroup.categories.push({ id: uuidv4(), name: data.name, goalTarget: data.target });
            }
            return { categoryGroups: newGroups };
        });
    }, [handleAddOrUpdateState]);
    
    const handleRemoveInvestment = useCallback((goalId: string) => {
        handleAddOrUpdateState(prev => ({
            transactions: prev.transactions.map(t => t.categoryId === goalId ? { ...t, categoryId: null } : t),
            categoryGroups: prev.categoryGroups.map(g => g.name === "Інвестиції" ? { ...g, categories: g.categories.filter(c => c.id !== goalId) } : g)
        }));
    }, [handleAddOrUpdateState]);

    const handleAddOrUpdatePlatform = useCallback((platformData: Omit<InvestmentPlatform, 'id'> | InvestmentPlatform) => {
        handleAddOrUpdateState(prev => ({
            investmentPlatforms: 'id' in platformData
                ? prev.investmentPlatforms.map(p => p.id === platformData.id ? { ...p, ...platformData } : p)
                : [...prev.investmentPlatforms, { id: uuidv4(), ...platformData }]
        }));
    }, [handleAddOrUpdateState]);

    const handleRemovePlatform = useCallback((platformId: string) => {
        handleAddOrUpdateState(prev => ({
            transactions: prev.transactions.map(t => t.platformId === platformId ? { ...t, platformId: undefined } : t),
            investmentPlatforms: prev.investmentPlatforms.filter(p => p.id !== platformId)
        }));
    }, [handleAddOrUpdateState]);

    const handleSetMonthlyInvestmentTarget = useCallback((target: number) => handleAddOrUpdateState(() => ({ monthlyInvestmentTarget: target })), [handleAddOrUpdateState]);
    const handleUpdateCurrencySettings = useCallback((settings: CurrencySettings) => handleAddOrUpdateState(() => ({ currencySettings: settings })), [handleAddOrUpdateState]);

    const handleImportData = useCallback((data: AppData) => {
        const hydratedData = hydrateAppData(data);
        hydratedData.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAppData(hydratedData);
        setHasUnsavedChanges(true);
    }, []);

    const handleExportAllData = useCallback(() => {
        if (!appDataRef.current) return;
        const jsonString = JSON.stringify(appDataRef.current, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `my-budget-export-${new Date().toISOString().split('T')[0]}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    const openAddAccountModal = useCallback(() => { setEditingAccount(null); setIsAccountModalOpen(true); }, []);
    const openEditAccountModal = useCallback((account: Account) => { setEditingAccount(account); setIsAccountModalOpen(true); }, []);

    if (isAuthLoading || isDataLoading || !appData) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <div className="text-center"><p className="text-lg font-semibold text-slate-700">Завантаження даних...</p></div>
            </div>
        );
    }
    
    const { appName, categoryGroups, transactions, accounts, incomeSources, monthlyGoals, investmentPlatforms, monthlyInvestmentTarget, currencySettings } = appData;

    return (
        <>
            <HashRouter>
                <CurrencyProvider settings={currencySettings} onSettingsUpdate={handleUpdateCurrencySettings}>
                    <div className="min-h-screen bg-slate-50 text-slate-800">
                        <Header appName={appName} onAppNameChange={handleAppNameChange} onOpenImportModal={() => setIsImportModalOpen(true)} onExportAllData={handleExportAllData} hasUnsavedChanges={hasUnsavedChanges} isSaving={isSaving} onSaveChanges={handleSaveChanges} />
                        <main className="p-4 sm:p-6 lg:p-8">
                            <Routes>
                                <Route path="/transactions" element={<TransactionsPage categoryGroups={categoryGroups} transactions={transactions} accounts={accounts} incomeSources={incomeSources} investmentPlatforms={investmentPlatforms || []} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onRemoveTransaction={handleRemoveTransaction} onRemoveMultipleTransactions={handleRemoveMultipleTransactions} onBulkUpdateTransactions={handleBulkUpdateTransactions} onAddCategoryGroup={handleAddCategoryGroup} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onRemoveCategory={handleRemoveCategory} onRemoveCategoryGroup={handleRemoveCategoryGroup} onAddOrUpdateIncomeSource={handleAddOrUpdateIncomeSource} onRemoveIncomeSource={handleRemoveIncomeSource} />} />
                                <Route path="/income" element={<IncomePage incomeSources={incomeSources} transactions={transactions} monthlyGoals={monthlyGoals} achievements={achievementsWithStatus} accounts={accounts} onAddOrUpdateIncomeSource={handleAddOrUpdateIncomeSource} onRemoveIncomeSource={handleRemoveIncomeSource} onAddOrUpdateMonthlyGoal={handleAddOrUpdateMonthlyGoal} />} />
                                <Route path="/accounts" element={<AccountsPage accounts={accounts} transactions={transactions} onAddAccount={openAddAccountModal} onEditAccount={openEditAccountModal} />} />
                                <Route path="/investment" element={<InvestmentPage categoryGroups={categoryGroups} transactions={transactions} accounts={accounts} platforms={investmentPlatforms || []} monthlyInvestmentTarget={monthlyInvestmentTarget || 0} onAddOrUpdateInvestment={handleAddOrUpdateInvestment} onRemoveInvestment={handleRemoveInvestment} onUpdateCategoryDetails={handleUpdateCategoryDetails} onAddOrUpdatePlatform={handleAddOrUpdatePlatform} onRemovePlatform={handleRemovePlatform} onSetMonthlyInvestmentTarget={handleSetMonthlyInvestmentTarget} />} />
                                <Route path="/settings" element={<SettingsPage currencySettings={currencySettings} onUpdateCurrencySettings={handleUpdateCurrencySettings} />} />
                                <Route path="/" element={<ReportsPage transactions={transactions} categoryGroups={categoryGroups} accounts={accounts} />} />
                                <Route path="/budget" element={<Navigate to="/transactions" />} />
                                <Route path="/goals" element={<Navigate to="/transactions" />} />
                            </Routes>
                        </main>
                        <AchievementToast queue={newlyUnlocked} onDismiss={(id) => setNewlyUnlocked(prev => prev.filter(ach => ach.id !== id))} />
                        <ImportDataModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportData} />
                        <AddAccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onSave={handleAddOrUpdateAccount} accountToEdit={editingAccount} />
                    </div>
                </CurrencyProvider>
            </HashRouter>
        </>
    );
};

const App: React.FC = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;