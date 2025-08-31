import { v4 as uuidv4 } from 'uuid';
import { Transaction, Account, IncomeSource, MonthlyGoals, InvestmentPlatform, Category, CurrencySettings, AppData } from './types';
import { toYYYYMMDD, getMonthKey } from './helpers';
import { INITIAL_CATEGORY_GROUPS } from './constants';

const generateDummyAccounts = (): Account[] => {
    return [
        { id: uuidv4(), name: 'ПриватБанк Картка', type: 'checking', balance: 25430.55 },
        { id: uuidv4(), name: 'monobank Банка', type: 'savings', balance: 75000.00 },
        { id: uuidv4(), name: 'Готівка', type: 'cash', balance: 3250.00 },
        { id: uuidv4(), name: 'Кредитка Visa', type: 'credit', balance: -4500.20 },
        { id: uuidv4(), name: 'Interactive Brokers', type: 'investment', balance: 150000.00 },
    ];
};

const generateDummyIncomeSources = (): IncomeSource[] => {
    return [
        { id: uuidv4(), name: 'Зарплата', category: 'salary', expectedAmount: 40000, description: 'Основна робота в IT-компанії' },
        { id: uuidv4(), name: 'Фріланс-проект', category: 'freelance', expectedAmount: 7500, description: 'Розробка сайту для клієнта' },
        { id: uuidv4(), name: 'Продаж фото на стоках', category: 'side-hustle', expectedAmount: 1200, description: 'Пасивний дохід' },
    ];
};

export const generateDummyData = (): AppData => {
    const accounts = generateDummyAccounts();
    const incomeSources = generateDummyIncomeSources();
    const transactions: Transaction[] = [];
    const monthlyGoals: MonthlyGoals = {};
    const categoryGroups = [...INITIAL_CATEGORY_GROUPS];
    
    // Create investment platforms
    const investmentPlatforms: InvestmentPlatform[] = [
        { id: uuidv4(), name: 'Interactive Brokers', category: 'brokerage', currentValue: 150000.00 },
        { id: uuidv4(), name: 'Binance', category: 'crypto', currentValue: 25000.00 }
    ];

    // Add some initial transactions
    const today = new Date();
    const privatbank = accounts.find(a => a.name === 'ПриватБанк Картка')!;
    const freelanceSource = incomeSources.find(is => is.category === 'freelance')!;
    const salarySource = incomeSources.find(is => is.category === 'salary')!;
    const foodCategory = categoryGroups.find(g => g.name === 'Щоденні витрати')?.categories.find(c => c.name === 'Продукти')!;
    
    // Recent Income
    if (privatbank && salarySource) {
        transactions.push({
            id: uuidv4(),
            date: toYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), 5)),
            payee: 'IT Company',
            categoryId: null,
            incomeSourceId: salarySource.id,
            amount: 40000,
            originalAmount: 40000,
            originalCurrency: 'UAH',
            type: 'income',
            accountId: privatbank.id,
        });
    }

    // Recent Expenses
    if (privatbank && foodCategory) {
        transactions.push({
            id: uuidv4(),
            date: toYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), 7)),
            payee: 'Супермаркет Сільпо',
            categoryId: foodCategory.id,
            amount: 1250.75,
            originalAmount: 1250.75,
            originalCurrency: 'UAH',
            type: 'expense',
            accountId: privatbank.id,
        });
    }

    const defaultCurrencySettings: CurrencySettings = {
      default: 'UAH',
      reports: 'UAH',
      investments: 'USD',
      roundToWholeNumbers: true,
      showOriginalCurrency: true,
    };
    
    return {
        appName: 'Мій Поточний Бюджет',
        categoryGroups,
        transactions,
        accounts,
        incomeSources,
        monthlyGoals,
        unlockedAchievements: {},
        investmentPlatforms,
        monthlyInvestmentTarget: 10000,
        currencySettings: defaultCurrencySettings,
    };
};