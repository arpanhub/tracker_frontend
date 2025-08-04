// Type definitions for the financial tracker
export interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  note: string;
}

export interface Investment {
  id: number;
  name: string;
  type: string;
  amount: number;
  date: string;
  returns: number;
}

export interface Budget {
  planned: number;
  actual: number;
}

export interface EmergencyFund {
  target: number;
  current: number;
  monthlyContribution: number;
}

export interface Goals {
  monthlySavingsTarget: number;
  totalSavingsGoal: number;
  currentStreak: number;
}

export interface UserProfile {
  monthlyIncome: number;
  familySupport: number;
  brotherSupport: number;
  lastUpdated: string;
}

export interface PrivacySettings {
  hideIncome: boolean;
  hideSavings: boolean;
  hideExpenses: boolean;
  hideInvestments: boolean;
}

export interface AIInsight {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  action: string;
}

export interface AIInsights {
  insights: AIInsight[];
  investmentTips: string[];
  timestamp?: number;
}

export interface AISettings {
  geminiApiKey: string;
  enableAI: boolean;
  aiInsights: AIInsights;
}

export interface NewExpense {
  category: string;
  amount: string;
  note: string;
}

export interface NewInvestment {
  name: string;
  type: string;
  amount: string;
}

export interface CustomGoal {
  id: number;
  name: string;
  target: number;
  current: number;
}
