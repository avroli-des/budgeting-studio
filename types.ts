

import React from 'react';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'credit' | 'investment';
  balance: number;
  isArchived?: boolean;
}

export type IncomeCategory = 'salary' | 'freelance' | 'side-hustle' | 'investments' | 'other';

export interface IncomeSource {
  id: string;
  name: string;
  category: IncomeCategory;
  expectedAmount: number;
  description?: string;
  paymentDay?: number;
  isRecurring?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // ISO 8601 format
  payee: string;
  categoryId: string | null; // null for transfers or income
  incomeSourceId?: string; // Used for income transactions
  amount: number; // always positive, UAH equivalent for multi-currency transactions
  memo?: string;
  type: 'income' | 'expense' | 'transfer';
  accountId: string;
  transferToAccountId?: string; // Only for transfers
  platformId?: string; // Used for investment transactions

  // Multi-currency fields
  originalCurrency?: string; // 'UAH', 'PLN', 'USD'
  originalAmount?: number;
  exchangeRate?: number;
  rateSource?: 'api' | 'manual';
}

export interface Category {
  id:string;
  name: string;
  goalTarget?: number;
}

export interface CategoryGroup {
  id: string;
  name: string;
  categories: Category[];
}

export interface MonthlyGoal {
  totalGoal: number;
  sourceGoals: { [sourceId: string]: number };
  motivation?: string;
}

export interface MonthlyGoals {
  [monthKey: string]: MonthlyGoal; // e.g., "2024-07"
}

// Gamification Types
export type AchievementRarity = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'milestone' | 'consistency' | 'growth' | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  checker: (data: ProcessedData) => { achieved: boolean, progress: number, count?: number };
  repeatable?: boolean;
}

export type UnlockedAchievements = {
  // Key is achievementId, value is ISO date string of unlock
  [achievementId: string]: string; 
};

export interface ProcessedData {
    monthlyIncome: Map<string, number>; // key: YYYY-MM
    monthlyGoalsMet: Set<string>; // key: YYYY-MM
    allTimeTotalIncome: number;
    activeSourcesPerMonth: Map<string, number>; // key: YYYY-MM
    monthlyIncomeGrowth: Map<string, number>; // key: YYYY-MM, value: percentage growth
    monthlyGoals: MonthlyGoals;
}

export type AchievementWithStatus = Achievement & {
  status: 'completed' | 'in-progress' | 'locked';
  progress: number;
  unlockedDate?: string;
  count?: number;
};

// Investment Tracking Types
export type InvestmentPlatformCategory = 'brokerage' | 'crypto' | 'robo-advisor' | '401k';

export interface InvestmentPlatform {
    id: string;
    name: string;
    category: InvestmentPlatformCategory;
    currentValue?: number;
}

// Exchange Rate Types
export interface ExchangeRates {
    [key: string]: number;
}

export interface CachedRates {
    rates: ExchangeRates;
    lastUpdated: string; // ISO string
}

// --- NEW ---
export type Currency = 'UAH' | 'USD' | 'EUR' | 'PLN';

export interface CurrencySettings {
  default: Currency;
  reports: Currency;
  investments: Currency;
  roundToWholeNumbers: boolean;
  showOriginalCurrency: boolean;
}

export interface AppData {
  appName: string;
  categoryGroups: CategoryGroup[];
  transactions: Transaction[];
  accounts: Account[];
  incomeSources: IncomeSource[];
  monthlyGoals: MonthlyGoals;
  unlockedAchievements: UnlockedAchievements;
  investmentPlatforms: InvestmentPlatform[];
  monthlyInvestmentTarget: number;
  currencySettings: CurrencySettings;
}