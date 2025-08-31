import { Currency, CurrencySettings, ExchangeRates } from './types';

export const formatCurrency = (value: number, currency: string = 'UAH', fractionDigits: number = 2): string => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  };

  // The 'currency' option in NumberFormat is not just for display, it can affect formatting rules.
  // We use 'uk-UA' for number formatting (separators) but the symbol comes from `currency`.
  return new Intl.NumberFormat('uk-UA', options).format(value);
};

export const convertAmount = (amountInUah: number, targetCurrency: Currency, rates: ExchangeRates | null): number => {
    if (!rates || !targetCurrency) return amountInUah;
    const uahToTargetRate = targetCurrency === 'UAH' ? 1 : rates[targetCurrency];
    if (typeof uahToTargetRate !== 'number') {
        return amountInUah;
    }
    return amountInUah * uahToTargetRate;
};

export const formatChartAxis = (value: number, currency: Currency, rates: ExchangeRates | null): string => {
    const convertedValue = convertAmount(value, currency, rates);
    const options: Intl.NumberFormatOptions = {
        notation: 'compact',
        maximumFractionDigits: 1,
    };
    // Format without currency symbol for cleaner axes
    return new Intl.NumberFormat('uk-UA', options).format(convertedValue);
};


export const formatDisplayAmount = ({
  amountInUah,
  targetCurrency,
  rates,
  settings,
  originalAmount,
  originalCurrency,
  simple = false,
}: {
  amountInUah: number;
  targetCurrency: Currency;
  rates: ExchangeRates | null;
  settings: CurrencySettings;
  originalAmount?: number;
  originalCurrency?: Currency | string;
  simple?: boolean;
}): string => {
  if (!rates || !settings) {
    // Fallback if context is not ready
    return formatCurrency(amountInUah, 'UAH');
  }

  // 1. Convert UAH to target currency
  const convertedAmount = convertAmount(amountInUah, targetCurrency, rates);
  
  // 2. Format the converted amount
  const fractionDigits = settings.roundToWholeNumbers ? 0 : 2;
  const formattedConverted = formatCurrency(
    convertedAmount, 
    targetCurrency, 
    fractionDigits
  );
  
  if (simple) {
      return formattedConverted;
  }

  // 3. Append original currency info if needed
  if (
    settings.showOriginalCurrency &&
    originalCurrency &&
    originalAmount !== undefined &&
    originalCurrency !== targetCurrency
  ) {
    const formattedOriginal = formatCurrency(
      originalAmount, 
      originalCurrency,
      originalCurrency === 'UAH' ? (settings.roundToWholeNumbers ? 0 : 2) : 2 // Keep decimals for foreign currencies
    );
    return `${formattedConverted} (was ${formattedOriginal})`;
  }

  return formattedConverted;
};


export const getCurrencyClass = (value: number): string => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-slate-500';
};

export const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const getStartOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

export const getEndOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
};

export const formatMonth = (date: Date): string => {
  const month = new Intl.DateTimeFormat('uk-UA', { month: 'long' }).format(date);
  // Capitalize the first letter for proper display
  return month.charAt(0).toUpperCase() + month.slice(1) + ' ' + date.getFullYear();
};

export const getMonthKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
};

export const toYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const isColorLight = (color: string | CanvasGradient | CanvasPattern | undefined): boolean => {
    if (!color || typeof color !== 'string') return true; // Default to assuming light background for safety

    let r, g, b;
    if (color.startsWith('#')) {
        const hex = color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    } else if (color.startsWith('rgb')) {
        const parts = color.match(/(\d+)/g);
        if (!parts || parts.length < 3) return true;
        [r, g, b] = parts.map(Number);
    } else {
        return true; // Unknown format, assume light
    }

    // Using the W3C luminance algorithm
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
};


export const getGoalStatus = (
    currentAmount: number,
    goalAmount: number,
    monthDate: Date
): { status: string; color: string; projection: number } => {
    if (goalAmount <= 0) {
        return { status: 'Ціль не встановлено', color: 'slate', projection: currentAmount };
    }

    const now = new Date();
    const today = now.getDate();
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    
    // Check if the month is in the past, future, or is the current month
    const isCurrentMonth = now.getFullYear() === monthDate.getFullYear() && now.getMonth() === monthDate.getMonth();
    const isPastMonth = monthDate < new Date(now.getFullYear(), now.getMonth(), 1);

    const progressPercentage = (currentAmount / goalAmount) * 100;
    
    // Final status for past months or completed goals
    if (progressPercentage >= 100) {
        return { status: 'Перевищено', color: 'green', projection: currentAmount };
    }
    if (isPastMonth) {
         return { status: 'Не досягнуто', color: 'red', projection: currentAmount };
    }
    
    // Projections and status for the current month
    const projection = isCurrentMonth && today > 0 ? (currentAmount / today) * daysInMonth : currentAmount;

    if (isCurrentMonth) {
        const timeElapsedPercentage = (today / daysInMonth) * 100;
        if (progressPercentage >= timeElapsedPercentage) {
            return { status: 'За графіком', color: 'green', projection };
        } else if (progressPercentage >= timeElapsedPercentage * 0.8) { // within 80% of target pace
            return { status: 'Відставання', color: 'yellow', projection };
        } else {
            return { status: 'Значне відставання', color: 'red', projection };
        }
    }

    // For future months where goal is set but no income yet
    return { status: 'Очікування', color: 'slate', projection: 0 };
};

export const getMonthKeysInRange = (startDate: Date, endDate: Date): string[] => {
    const keys: string[] = [];
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (currentDate <= finalDate) {
        keys.push(getMonthKey(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return keys;
};

const formatCSVField = (field: any): string => {
    const str = String(field ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const exportToCSV = (headers: string[], data: (string | number | undefined | null)[][], filename: string) => {
    const csvRows = [
        headers.map(formatCSVField).join(','),
        ...data.map(row => row.map(formatCSVField).join(','))
    ];
    const csvContent = csvRows.join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};