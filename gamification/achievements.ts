import { Achievement, Transaction, MonthlyGoals, IncomeSource, ProcessedData } from '../types';
import { getMonthKey } from '../helpers';
import { AwardIcon, BanknotesIcon, FireIcon, SparklesIcon, StarIcon, TrendingUpIcon } from '../components/icons';

// --- Data Processing ---

export const processDataForAchievements = (transactions: Transaction[], monthlyGoals: MonthlyGoals, incomeSources: IncomeSource[]): ProcessedData => {
    const monthlyIncome = new Map<string, number>();
    const monthlyGoalsMet = new Set<string>();
    let allTimeTotalIncome = 0;
    const activeSourcesPerMonth = new Map<string, number>();

    const incomeTransactions = transactions.filter(t => t.type === 'income' && t.payee !== "Початковий баланс");

    incomeTransactions.forEach(t => {
        allTimeTotalIncome += t.amount;
        const monthKey = getMonthKey(new Date(t.date));
        monthlyIncome.set(monthKey, (monthlyIncome.get(monthKey) || 0) + t.amount);
    });
    
    // Sort month keys chronologically
    const sortedMonthKeys = Array.from(monthlyIncome.keys()).sort();

    // Calculate goals met
    sortedMonthKeys.forEach(monthKey => {
        const goal = monthlyGoals[monthKey]?.totalGoal || 0;
        const income = monthlyIncome.get(monthKey) || 0;
        if (goal > 0 && income >= goal * 0.9) { // 90% threshold for "meeting" a goal
            monthlyGoalsMet.add(monthKey);
        }
    });

    // Calculate active income sources per month
    const sourcesPerMonth = new Map<string, Set<string>>();
    incomeTransactions.forEach(t => {
        if (t.incomeSourceId) {
            const monthKey = getMonthKey(new Date(t.date));
            if (!sourcesPerMonth.has(monthKey)) {
                sourcesPerMonth.set(monthKey, new Set());
            }
            sourcesPerMonth.get(monthKey)!.add(t.incomeSourceId);
        }
    });
    sourcesPerMonth.forEach((sources, monthKey) => {
        activeSourcesPerMonth.set(monthKey, sources.size);
    });

    // Calculate month-over-month growth
    const monthlyIncomeGrowth = new Map<string, number>();
    for (let i = 1; i < sortedMonthKeys.length; i++) {
        const currentMonthKey = sortedMonthKeys[i];
        const prevMonthKey = sortedMonthKeys[i - 1];
        const currentIncome = monthlyIncome.get(currentMonthKey) || 0;
        const prevIncome = monthlyIncome.get(prevMonthKey) || 0;
        if (prevIncome > 0) {
            const growth = ((currentIncome - prevIncome) / prevIncome) * 100;
            monthlyIncomeGrowth.set(currentMonthKey, growth);
        }
    }

    return { monthlyIncome, monthlyGoalsMet, allTimeTotalIncome, activeSourcesPerMonth, monthlyIncomeGrowth, monthlyGoals };
};


// --- Achievement Definitions ---

export const ALL_ACHIEVEMENTS: Achievement[] = [
    // --- MILESTONE ACHIEVEMENTS ---
    {
        id: 'milestone-1k',
        name: 'Новачок у доходах',
        description: 'Заробіть свої перші 1000 UAH загального доходу.',
        category: 'milestone',
        rarity: 'bronze',
        icon: BanknotesIcon,
        checker: (data) => {
            const target = 1000;
            return {
                achieved: data.allTimeTotalIncome >= target,
                progress: Math.min(data.allTimeTotalIncome / target, 1),
            };
        },
    },
    {
        id: 'milestone-10k',
        name: 'Вражаючий заробіток',
        description: 'Досягніть 10,000 UAH загального доходу.',
        category: 'milestone',
        rarity: 'silver',
        icon: BanknotesIcon,
        checker: (data) => {
            const target = 10000;
            return {
                achieved: data.allTimeTotalIncome >= target,
                progress: Math.min(data.allTimeTotalIncome / target, 1),
            };
        },
    },
     {
        id: 'milestone-50k',
        name: 'Майстер доходів',
        description: 'Досягніть 50,000 UAH загального доходу.',
        category: 'milestone',
        rarity: 'gold',
        icon: BanknotesIcon,
        checker: (data) => {
            const target = 50000;
            return {
                achieved: data.allTimeTotalIncome >= target,
                progress: Math.min(data.allTimeTotalIncome / target, 1),
            };
        },
    },

    // --- CONSISTENCY ACHIEVEMENTS ---
    {
        id: 'consistency-goal-met-once',
        name: 'Перша ціль досягнута!',
        description: 'Встановіть та досягніть свою першу місячну ціль по доходу.',
        category: 'consistency',
        rarity: 'bronze',
        icon: StarIcon,
        checker: (data) => {
            const achieved = data.monthlyGoalsMet.size > 0;
            return { achieved, progress: achieved ? 1 : 0 };
        },
    },
    {
        id: 'consistency-goal-hunter',
        name: 'Мисливець за цілями',
        description: 'Досягайте своєї місячної цілі по доходу.',
        category: 'consistency',
        rarity: 'silver',
        icon: StarIcon,
        repeatable: true,
        checker: (data) => {
            const count = data.monthlyGoalsMet.size;
            return {
                achieved: count > 0,
                progress: count > 0 ? 1 : 0,
                count: count
            };
        },
    },
    {
        id: 'consistency-2-months',
        name: 'Стабільний заробіток',
        description: 'Досягайте своєї цілі по доходу 2 місяці поспіль.',
        category: 'consistency',
        rarity: 'silver',
        icon: FireIcon,
        checker: (data) => {
            const target = 2;
            const streaks = getConsecutiveStreaks(data.monthlyGoalsMet);
            const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
            return {
                achieved: maxStreak >= target,
                progress: Math.min(maxStreak / target, 1),
            };
        },
    },
    {
        id: 'consistency-4-months',
        name: 'Майстер стабільності',
        description: 'Досягайте своєї цілі по доходу 4 місяці поспіль.',
        category: 'consistency',
        rarity: 'gold',
        icon: FireIcon,
        checker: (data) => {
            const target = 4;
            const streaks = getConsecutiveStreaks(data.monthlyGoalsMet);
            const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
            return {
                achieved: maxStreak >= target,
                progress: Math.min(maxStreak / target, 1),
            };
        },
    },

    // --- GROWTH ACHIEVEMENTS ---
     {
        id: 'growth-diversifier',
        name: 'Диверсифікатор',
        description: 'Отримайте дохід з 3+ джерел за один місяць.',
        category: 'growth',
        rarity: 'silver',
        icon: AwardIcon,
        repeatable: true,
        checker: (data) => {
            const target = 3;
            let count = 0;
            for (const numSources of data.activeSourcesPerMonth.values()) {
                if (numSources >= target) {
                    count++;
                }
            }
            const maxSources = data.activeSourcesPerMonth.size > 0 ? Math.max(...data.activeSourcesPerMonth.values()) : 0;
            return {
                achieved: maxSources >= target,
                progress: Math.min(maxSources / target, 1),
                count,
            };
        },
    },
    {
        id: 'growth-20-percent',
        name: 'Зірка, що сходить',
        description: 'Збільште свій місячний дохід на 20% порівняно з попереднім місяцем.',
        category: 'growth',
        rarity: 'gold',
        icon: TrendingUpIcon,
        repeatable: true,
        checker: (data) => {
            const target = 20;
            let count = 0;
            for (const growth of data.monthlyIncomeGrowth.values()) {
                if (growth >= target) {
                    count++;
                }
            }
            const maxGrowth = data.monthlyIncomeGrowth.size > 0 ? Math.max(...data.monthlyIncomeGrowth.values()) : 0;
            return {
                achieved: maxGrowth >= target,
                progress: Math.min(maxGrowth / target, 1),
                count,
            };
        },
    },
    
    // --- SPECIAL ACHIEVEMENTS ---
    {
        id: 'special-overachiever',
        name: 'Наддосягнення',
        description: 'Перевищте свою місячну ціль по доходу на 150%.',
        category: 'special',
        rarity: 'gold',
        icon: SparklesIcon,
        repeatable: true,
        checker: (data) => {
            let count = 0;
            for (const [monthKey, income] of data.monthlyIncome.entries()) {
                const goal = (data.monthlyGoals as any)[monthKey]?.totalGoal || 0;
                if (goal > 0 && income >= goal * 1.5) {
                    count++;
                }
            }
            return {
                achieved: count > 0,
                progress: count > 0 ? 1 : 0,
                count,
            };
        },
    },
];

// --- Helper Functions for Checkers ---
function getConsecutiveStreaks(dates: Set<string>): number[] {
    if (dates.size === 0) return [];

    const sortedDates = Array.from(dates).sort();
    const streaks: number[] = [];
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1] + '-01');
        const current = new Date(sortedDates[i] + '-01');

        const expectedNextMonth = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);

        if (current.getTime() === expectedNextMonth.getTime()) {
            currentStreak++;
        } else {
            streaks.push(currentStreak);
            currentStreak = 1;
        }
    }
    streaks.push(currentStreak);
    return streaks;
}