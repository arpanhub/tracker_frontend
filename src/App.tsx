import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Plus, 
  TrendingUp, 
  Target, 
  Settings, 
  PieChart, 
  Award,
  Download,
  Upload,
  AlertTriangle,
  DollarSign,
  Zap,
  Activity,
  Gift,
  Coffee,
  Car,
  ShoppingBag,
  Smartphone,
  Dumbbell,
  Users,
  Heart,
  MoreHorizontal,
  Menu,
  X,
  Edit,
  Trash2,
  House,
  Save,
  User
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Pie, Cell } from 'recharts';
import { mongoService } from './services/mongoService';
import type { UserProfile } from './types';

// Type definitions
interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  note: string;
}

interface Investment {
  id: number;
  name: string;
  type: string;
  amount: number;
  date: string;
  returns: number;
}

interface Budget {
  planned: number;
  actual: number;
}

interface Budgets {
  [key: string]: Budget;
}

interface EmergencyFund {
  target: number;
  current: number;
  monthlyContribution: number;
}

interface Goals {
  monthlySavingsTarget: number;
  totalSavingsGoal: number;
  currentStreak: number;
}

interface PrivacySettings {
  hideIncome: boolean;
  hideSavings: boolean;
  hideExpenses: boolean;
  hideInvestments: boolean;
}

interface AIInsight {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
  action: string;
}

interface AIInsights {
  insights: AIInsight[];
  investmentTips: string[];
  timestamp?: number; // Add timestamp for caching
}

interface AISettings {
  geminiApiKey: string;
  enableAI: boolean;
  aiInsights: AIInsights;
}

interface NewExpense {
  category: string;
  amount: string;
  note: string;
}

interface NewInvestment {
  name: string;
  type: string;
  amount: string;
}

const App = () => {

  // --- All useState hooks must be declared before any useEffect or code that uses them ---
  // --- Custom Goals State ---
  const [customGoals, setCustomGoals] = useState<{
    id: number;
    name: string;
    target: number;
    current: number;
  }[]>([]);
  const [newCustomGoalName, setNewCustomGoalName] = useState('');
  const [newCustomGoalTarget, setNewCustomGoalTarget] = useState('');
  const [editingCustomGoal, setEditingCustomGoal] = useState<number | null>(null);
  const [editCustomGoalName, setEditCustomGoalName] = useState('');
  const [editCustomGoalTarget, setEditCustomGoalTarget] = useState('');
  const [editCustomGoalCurrent, setEditCustomGoalCurrent] = useState('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budgets, setBudgets] = useState<Budgets>({});
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund>({
    target: 0,
    current: 0,
    monthlyContribution: 0
  });
  const [goals, setGoals] = useState<Goals>({
    monthlySavingsTarget: 0,
    totalSavingsGoal: 0,
    currentStreak: 0
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    hideIncome: false,
    hideSavings: false,
    hideExpenses: false,
    hideInvestments: false
  });
  const [aiSettings, setAISettings] = useState<AISettings>({
    geminiApiKey: 'AIzaSyArd2SCVcROFHFtPguHDYj2igAxXg6ORc0',
    enableAI: true,
    aiInsights: {
      insights: [],
      investmentTips: []
    }
  });
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [marketData, setMarketData] = useState<{
    nifty50: { value: number; change: number; changePercent: number };
    sensex: { value: number; change: number; changePercent: number };
    bitcoin: { value: number; change: number; changePercent: number };
    gold: { value: number; change: number; changePercent: number };
  }>({
    nifty50: { value: 24435.50, change: 125.30, changePercent: 0.52 },
    sensex: { value: 80378.13, change: 378.18, changePercent: 0.47 },
    bitcoin: { value: 2750000, change: 85000, changePercent: 3.19 },
    gold: { value: 6850, change: -45, changePercent: -0.65 }
  });
  const [sipRecommendations, setSipRecommendations] = useState<{
    fundName: string;
    category: string;
    returns: string;
    risk: string;
    minSip: number;
  }[]>([]);
  const [realTimeInsights, setRealTimeInsights] = useState<string[]>([]);
  
  // Backup and State Management
  const [lastBackupDate, setLastBackupDate] = useState<string>('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(true);
  const [backupHistory, setBackupHistory] = useState<string[]>([]);
  const [apiStatus, setApiStatus] = useState<'active' | 'limited' | 'error'>('active');
  
  // MongoDB Sync State
  const [mongoSyncEnabled, setMongoSyncEnabled] = useState<boolean>(true);
  const [mongoSyncStatus, setMongoSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastMongoSync, setLastMongoSync] = useState<string>('');
  const [isLoadingFromCloud, setIsLoadingFromCloud] = useState<boolean>(true);
  
  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    monthlyIncome: 35000,
    familySupport: 5000,
    brotherSupport: 2000,
    lastUpdated: new Date().toISOString()
  });
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);
  
  const [newExpense, setNewExpense] = useState<NewExpense>({
    category: '',
    amount: '',
    note: ''
  });
  const [newInvestment, setNewInvestment] = useState<NewInvestment>({
    name: '',
    type: 'SIP',
    amount: ''
  });
  // New states for editable budget and goals
  const [newBudgetCategory, setNewBudgetCategory] = useState<string>('');
  const [newBudgetAmount, setNewBudgetAmount] = useState<string>('');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  // --- Initialize by loading data from MongoDB Cloud ---
useEffect(() => {
  const initializeData = async () => {
    try {
      setIsLoadingFromCloud(true);
      setMongoSyncStatus('syncing');
      
      console.log('🚀 Initializing app - loading data from MongoDB cloud...');
      
      // First check if server is healthy
      const isServerHealthy = await mongoService.checkServerHealth();
      if (!isServerHealthy) {
        throw new Error('Backend server not available');
      }

      // Load data from MongoDB cloud
      const cloudData = await mongoService.loadDataFromMongo();
      
      if (cloudData) {
        // Restore all data from cloud
        console.log('✅ Data loaded from cloud, restoring...');
        
        if (cloudData.expenses) setExpenses(cloudData.expenses);
        if (cloudData.investments) setInvestments(cloudData.investments);
        if (cloudData.budgets) setBudgets(cloudData.budgets);
        if (cloudData.emergencyFund) setEmergencyFund(cloudData.emergencyFund);
        if (cloudData.goals) setGoals(cloudData.goals);
        if (cloudData.customGoals) setCustomGoals(cloudData.customGoals);
        if (cloudData.privacySettings) setPrivacySettings(cloudData.privacySettings);
        if (cloudData.userProfile) setUserProfile(cloudData.userProfile);
        
        setMongoSyncStatus('success');
        setLastMongoSync(cloudData.lastUpdated);
        
        console.log('✅ All data restored from MongoDB cloud:', {
          expenses: cloudData.expenses?.length || 0,
          investments: cloudData.investments?.length || 0,
          budgets: Object.keys(cloudData.budgets || {}).length,
          userProfile: cloudData.userProfile
        });
      } else {
        // No data in cloud - initialize with defaults
        console.log('ℹ️ No data found in cloud. Initializing with defaults...');
        
        const defaultData = {
          expenses: [],
          investments: [],
          budgets: {},
          emergencyFund: {
            target: 200000,
            current: 45000,
            monthlyContribution: 5000
          },
          goals: {
            monthlySavingsTarget: 20000,
            totalSavingsGoal: 500000,
            currentStreak: 15
          },
          customGoals: [],
          privacySettings: {
            hideIncome: false,
            hideSavings: false,
            hideExpenses: false,
            hideInvestments: false
          },
          userProfile: {
            monthlyIncome: 35000,
            familySupport: 5000,
            brotherSupport: 2000,
            lastUpdated: new Date().toISOString()
          }
        };

        // Set default data in state
        setExpenses(defaultData.expenses);
        setInvestments(defaultData.investments);
        setBudgets(defaultData.budgets);
        setEmergencyFund(defaultData.emergencyFund);
        setGoals(defaultData.goals);
        setCustomGoals(defaultData.customGoals);
        setPrivacySettings(defaultData.privacySettings);
        setUserProfile(defaultData.userProfile);

        // Initialize cloud with default data
        await mongoService.initializeUserData(defaultData);
        setMongoSyncStatus('success');
        
        console.log('✅ Default data initialized and synced to cloud');
      }
    } catch (error) {
      console.error('❌ Failed to initialize data from cloud:', error);
      setMongoSyncStatus('error');
      
      // Fall back to default values if cloud fails
      setEmergencyFund({
        target: 200000,
        current: 45000,
        monthlyContribution: 5000
      });
      setGoals({
        monthlySavingsTarget: 20000,
        totalSavingsGoal: 500000,
        currentStreak: 15
      });
      setUserProfile({
        monthlyIncome: 35000,
        familySupport: 5000,
        brotherSupport: 2000,
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setIsLoadingFromCloud(false);
    }
  };

  initializeData();
}, []);

  // Cloud-first: Auto-sync to MongoDB when data changes (no localStorage)
  useEffect(() => {
    if (mongoSyncEnabled && expenses.length > 0 && !isLoadingFromCloud) {
      const timeoutId = setTimeout(() => {
        mongoService.autoSync({
          expenses,
          investments,
          budgets,
          emergencyFund,
          goals,
          customGoals,
          privacySettings,
          userProfile
        });
      }, 2000); // Debounce for 2 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [expenses, investments, budgets, emergencyFund, goals, customGoals, privacySettings, userProfile, mongoSyncEnabled, isLoadingFromCloud]);

  // Initialize AI features and market data on component mount
  useEffect(() => {
    // Check if we're in quota cooldown
    const quotaResetTime = localStorage.getItem('quotaResetTime');
    const now = Date.now();
    
    if (quotaResetTime && now < parseInt(quotaResetTime)) {
      console.log('⏰ API quota cooldown active. Skipping API calls.');
      setApiStatus('limited');
      return;
    }
    
    // Check API call frequency to prevent quota abuse
    const apiCallHistory = JSON.parse(localStorage.getItem('apiCallHistory') || '[]');
    const recentCalls = apiCallHistory.filter((timestamp: number) => now - timestamp < 3600000); // Last hour
    
    // If more than 10 calls in the last hour, wait
    if (recentCalls.length >= 10) {
      console.log('⚠️ Too many API calls in the last hour. Waiting to prevent quota abuse.');
      setApiStatus('limited');
      // Set a 30-minute cooldown
      localStorage.setItem('quotaResetTime', (now + 1800000).toString());
      return;
    }
    
    // Only run AI functions if we have API access and haven't exceeded quota
    const lastAPICall = localStorage.getItem('lastAPICall');
    const timeSinceLastCall = lastAPICall ? now - parseInt(lastAPICall) : Infinity;
    
    // Wait at least 30 seconds between API calls to avoid rate limits
    if (aiSettings.enableAI && aiSettings.geminiApiKey && timeSinceLastCall > 30000) {
      // Don't make API calls on every page load - only if we have no cached insights
      const hasRecentInsights = aiSettings.aiInsights && 
        aiSettings.aiInsights.timestamp && 
        (now - aiSettings.aiInsights.timestamp < 3600000); // Less than 1 hour old
      
      if (!hasRecentInsights) {
        console.log('🤖 Generating fresh AI insights...');
        // Delay initial API calls to avoid quota issues
        setTimeout(() => {
          generateRealTimeInsights();
        }, 3000);
        
        setTimeout(() => {
          getSIPRecommendations();
        }, 8000);
        
        localStorage.setItem('lastAPICall', now.toString());
        
        // Track this API call
        const updatedHistory = [...recentCalls, now];
        localStorage.setItem('apiCallHistory', JSON.stringify(updatedHistory));
      } else {
        console.log('📋 Using cached AI insights to preserve quota.');
      }
    }
    
    // Update market data every 5 minutes (reduced frequency)
    const marketInterval = setInterval(updateMarketData, 300000);
    
    // Generate insights every 2 hours (greatly reduced frequency)
    const insightsInterval = setInterval(() => {
      const currentTime = Date.now();
      const quotaCooldown = localStorage.getItem('quotaResetTime');
      
      if (quotaCooldown && currentTime < parseInt(quotaCooldown)) {
        console.log('⏰ Skipping scheduled insights due to quota cooldown.');
        return;
      }
      
      const lastCall = localStorage.getItem('lastAPICall');
      const timeDiff = lastCall ? currentTime - parseInt(lastCall) : Infinity;
      
      if (aiSettings.enableAI && aiSettings.geminiApiKey && timeDiff > 120000) {
        generateRealTimeInsights();
        localStorage.setItem('lastAPICall', currentTime.toString());
      }
    }, 7200000); // 2 hours
    
    // Check quota reset status every minute
    const quotaCheckInterval = setInterval(() => {
      const quotaResetTime = localStorage.getItem('quotaResetTime');
      const now = Date.now();
      
      if (quotaResetTime && now >= parseInt(quotaResetTime)) {
        console.log('✅ API quota cooldown expired. Resetting to active status.');
        localStorage.removeItem('quotaResetTime');
        setApiStatus('active');
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(marketInterval);
      clearInterval(insightsInterval);
      clearInterval(quotaCheckInterval);
    };
  }, []);

  // Enhanced Backup and Data Management System
  useEffect(() => {
    // Check if we need to create daily backup (data is already loaded at this point)
    checkAndCreateDailyBackup();

    // Set up daily backup check (runs every hour)
    const backupInterval = setInterval(checkAndCreateDailyBackup, 3600000);

    return () => clearInterval(backupInterval);
  }, [expenses, investments, budgets]); // Depend on data being loaded

  // Save backup settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lastBackupDate', lastBackupDate);
      localStorage.setItem('autoBackupEnabled', autoBackupEnabled.toString());
      localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
    } catch (error) {
      console.error('Failed to save backup settings:', error);
    }
  }, [lastBackupDate, autoBackupEnabled, backupHistory]);

  // Comprehensive data backup function
  const createBackup = (isAutomatic = false) => {
    try {
      // Calculate current month expenses for statistics
      const currentDate = new Date();
      const currentMonthExpenses = expenses.filter(exp => {
        const expenseDate = new Date(exp.date);
        return expenseDate.getMonth() === currentDate.getMonth() && 
               expenseDate.getFullYear() === currentDate.getFullYear();
      });
      const totalCurrentMonthExpenses = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      const allData = {
        timestamp: new Date().toISOString(),
        version: '2.0',
        isAutomatic,
        data: {
          expenses,
          investments,
          budgets,
          emergencyFund,
          goals,
          customGoals,
          privacySettings,
          aiSettings: {
            ...aiSettings,
            geminiApiKey: '***HIDDEN***' // Don't backup sensitive API key
          },
          marketData,
          sipRecommendations,
          realTimeInsights,
          lastBackupDate,
          monthlyIncome: 35000,
          familySupport: 5000,
          brotherSupport: 2000
        },
        statistics: {
          totalExpenses: expenses.length,
          totalInvestments: investments.length,
          totalBudgetCategories: Object.keys(budgets).length,
          totalCustomGoals: customGoals.length,
          portfolioValue: totalInvestments + totalReturns,
          currentMonthExpenses: totalCurrentMonthExpenses,
          savingsRate: Math.round(((35000 - totalCurrentMonthExpenses) / 35000) * 100)
        }
      };

      const backupBlob = new Blob([JSON.stringify(allData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(backupBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date();
      const formattedDate = date.toISOString().split('T')[0];
      const formattedTime = date.toTimeString().split(' ')[0].replace(/:/g, '-');
      
      link.download = `arpan-tracker-backup-${formattedDate}-${formattedTime}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update backup history
      const backupEntry = `${formattedDate} ${formattedTime} ${isAutomatic ? '(Auto)' : '(Manual)'}`;
      setBackupHistory(prev => [backupEntry, ...prev.slice(0, 9)]); // Keep last 10 backups
      setLastBackupDate(formattedDate);

      console.log('✅ Backup created successfully:', backupEntry);
      return true;
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      return false;
    }
  };

  // Check if daily backup is needed
  const checkAndCreateDailyBackup = () => {
    if (!autoBackupEnabled) return;

    const today = new Date().toISOString().split('T')[0];
    const lastBackup = lastBackupDate;

    // Create backup if:
    // 1. No backup has been created yet
    // 2. Last backup was on a different day
    // 3. There's significant data (at least 1 expense or investment)
    if (
      (lastBackup !== today) &&
      (expenses.length > 0 || investments.length > 0) &&
      (!lastBackup || new Date(lastBackup) < new Date(today))
    ) {
      console.log('🔄 Creating automatic daily backup...');
      createBackup(true);
    }
  };

  // Restore data from backup file
  const restoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        if (backupData.data) {
          // Restore all data with validation and proper fallbacks
          if (backupData.data.expenses && Array.isArray(backupData.data.expenses)) {
            setExpenses(backupData.data.expenses);
            console.log('✅ Restored expenses:', backupData.data.expenses.length);
          }
          
          if (backupData.data.investments && Array.isArray(backupData.data.investments)) {
            setInvestments(backupData.data.investments);
            console.log('✅ Restored investments:', backupData.data.investments.length);
          }
          
          if (backupData.data.budgets && typeof backupData.data.budgets === 'object') {
            setBudgets(backupData.data.budgets);
            console.log('✅ Restored budgets:', Object.keys(backupData.data.budgets).length);
          }
          
          if (backupData.data.emergencyFund && typeof backupData.data.emergencyFund === 'object') {
            setEmergencyFund(backupData.data.emergencyFund);
            console.log('✅ Restored emergency fund:', backupData.data.emergencyFund);
          }
          
          if (backupData.data.goals && typeof backupData.data.goals === 'object') {
            setGoals(backupData.data.goals);
            console.log('✅ Restored goals:', backupData.data.goals);
          }
          
          if (backupData.data.customGoals && Array.isArray(backupData.data.customGoals)) {
            setCustomGoals(backupData.data.customGoals);
            console.log('✅ Restored custom goals:', backupData.data.customGoals.length);
          }
          
          if (backupData.data.privacySettings && typeof backupData.data.privacySettings === 'object') {
            setPrivacySettings(backupData.data.privacySettings);
            console.log('✅ Restored privacy settings');
          }
          
          if (backupData.data.marketData && typeof backupData.data.marketData === 'object') {
            setMarketData(backupData.data.marketData);
            console.log('✅ Restored market data');
          }
          
          if (backupData.data.sipRecommendations && Array.isArray(backupData.data.sipRecommendations)) {
            setSipRecommendations(backupData.data.sipRecommendations);
            console.log('✅ Restored SIP recommendations');
          }
          
          if (backupData.data.realTimeInsights && Array.isArray(backupData.data.realTimeInsights)) {
            setRealTimeInsights(backupData.data.realTimeInsights);
            console.log('✅ Restored real-time insights');
          }

          // Force save to localStorage immediately after restore
          setTimeout(() => {
            window.location.reload(); // Refresh to see the restored data
          }, 1000);

          console.log('✅ Data restored successfully from backup');
          alert('✅ Backup restored successfully! Page will refresh to show the data.');
        } else {
          throw new Error('Invalid backup file format - missing data section');
        }
      } catch (error) {
        console.error('❌ Backup restoration failed:', error);
        alert(`❌ Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the file format.`);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  // MongoDB Sync Functions (Updated for cloud-first approach)
  const syncDataToMongoDB = async () => {
    if (!mongoSyncEnabled) return;

    try {
      setMongoSyncStatus('syncing');
      console.log('🔄 Starting MongoDB cloud sync...');
      
      const dataToSync = {
        expenses,
        investments,
        budgets,
        emergencyFund,
        goals,
        customGoals,
        privacySettings,
        userProfile
      };

      await mongoService.syncDataToMongo(dataToSync);
      setMongoSyncStatus('success');
      setLastMongoSync(new Date().toISOString());
      console.log('✅ MongoDB cloud sync completed successfully');
    } catch (error) {
      setMongoSyncStatus('error');
      console.error('❌ MongoDB cloud sync error:', error);
      alert(`❌ Failed to sync to cloud: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadDataFromMongoDB = async () => {
    try {
      setMongoSyncStatus('syncing');
      console.log('📥 Loading data from MongoDB cloud...');
      
      const mongoData = await mongoService.loadDataFromMongo();
      
      if (mongoData) {
        // Restore data from MongoDB cloud
        if (mongoData.expenses) setExpenses(mongoData.expenses);
        if (mongoData.investments) setInvestments(mongoData.investments);
        if (mongoData.budgets) setBudgets(mongoData.budgets);
        if (mongoData.emergencyFund) setEmergencyFund(mongoData.emergencyFund);
        if (mongoData.goals) setGoals(mongoData.goals);
        if (mongoData.customGoals) setCustomGoals(mongoData.customGoals);
        if (mongoData.privacySettings) setPrivacySettings(mongoData.privacySettings);
        if (mongoData.userProfile) setUserProfile(mongoData.userProfile);
        
        setMongoSyncStatus('success');
        console.log('✅ Data loaded from MongoDB cloud successfully');
        alert('✅ Data loaded from MongoDB cloud successfully!');
      } else {
        setMongoSyncStatus('idle');
        console.log('ℹ️ No data found in MongoDB cloud');
        alert('ℹ️ No data found in MongoDB cloud. This might be your first sync.');
      }
    } catch (error) {
      setMongoSyncStatus('error');
      console.error('❌ MongoDB cloud load error:', error);
      alert(`❌ Failed to load data from cloud: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearMongoData = async () => {
    if (confirm('⚠️ This will permanently delete all your data from MongoDB cloud. Are you sure?')) {
      try {
        setMongoSyncStatus('syncing');
        await mongoService.deleteUserData();
        
        setMongoSyncStatus('idle');
        setLastMongoSync('');
        console.log('✅ MongoDB cloud data cleared successfully');
        alert('✅ All data cleared from MongoDB cloud successfully!');
      } catch (error) {
        setMongoSyncStatus('error');
        console.error('❌ MongoDB cloud clear error:', error);
        alert(`❌ Error clearing cloud data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Auto-sync to MongoDB when data changes
  useEffect(() => {
    if (mongoSyncEnabled && expenses.length > 0) {
      const timeoutId = setTimeout(() => {
        mongoService.autoSync({
          expenses,
          investments,
          budgets,
          emergencyFund,
          goals,
          customGoals,
          privacySettings,
          userProfile
        });
      }, 2000); // Debounce for 2 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [expenses, investments, budgets, emergencyFund, goals, customGoals, privacySettings, userProfile, mongoSyncEnabled]);

  // Load MongoDB sync status on component mount
  useEffect(() => {
    const syncStatus = mongoService.getSyncStatus();
    if (syncStatus.lastSync) {
      setLastMongoSync(syncStatus.lastSync);
    }
    
    // Load MongoDB sync enabled setting
    const mongoSyncSetting = localStorage.getItem('mongoSyncEnabled');
    if (mongoSyncSetting !== null) {
      setMongoSyncEnabled(mongoSyncSetting === 'true');
    }
  }, []);

  // Save MongoDB sync settings
  useEffect(() => {
    localStorage.setItem('mongoSyncEnabled', mongoSyncEnabled.toString());
  }, [mongoSyncEnabled]);

  const monthlyIncome = userProfile.monthlyIncome;
  const familySupport = userProfile.familySupport;
  const brotherSupport = userProfile.brotherSupport;

  // Update budget actuals for current month only
  useEffect(() => {
    const updatedBudgets = { ...budgets };
    Object.keys(updatedBudgets).forEach(category => {
      const categoryExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          const currentDate = new Date();
          return expense.category === category &&
                 expenseDate.getMonth() === currentDate.getMonth() && 
                 expenseDate.getFullYear() === currentDate.getFullYear();
        })
        .reduce((total, expense) => total + expense.amount, 0);
      updatedBudgets[category].actual = categoryExpenses;
    });
    setBudgets(updatedBudgets);
  }, [expenses]);

  // Calculate current month expenses only
  const now = new Date();
  const currentMonthExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalPlannedBudget = Object.values(budgets).reduce((sum, budget) => sum + budget.planned, 0);
  const totalActualExpenses = thisMonthSpent;
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReturns = investments.reduce((sum, inv) => sum + inv.returns, 0);
  const currentSavings = monthlyIncome - thisMonthSpent - familySupport - brotherSupport;
  const savingsRate = ((currentSavings / monthlyIncome) * 100).toFixed(1);

  const categoryIcons: Record<string, React.ComponentType<any>> = {
    Food: Coffee,
    Transport: Car,
    Rent: House,
    Entertainment: Gift,
    Shopping: ShoppingBag,
    Gym: Dumbbell,
    Phone: Smartphone,
    Family: Users,
    Others: MoreHorizontal
  };

  const addExpense = () => {
    if (newExpense.amount && newExpense.category) {
      const expense = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        note: newExpense.note
      };
      setExpenses([...expenses, expense]);
      setNewExpense({ category: '', amount: '', note: '' });
    }
  };

  const addInvestment = () => {
    if (newInvestment.name && newInvestment.amount) {
      const investment = {
        id: Date.now(),
        name: newInvestment.name,
        type: newInvestment.type,
        amount: parseFloat(newInvestment.amount),
        date: new Date().toISOString().split('T')[0],
        returns: 0
      };
      setInvestments([...investments, investment]);
      setNewInvestment({ name: '', type: 'SIP', amount: '' });
    }
  };

  // Budget management functions
  const addBudgetCategory = () => {
    if (newBudgetCategory.trim() && newBudgetAmount && !budgets[newBudgetCategory]) {
      setBudgets(prev => ({
        ...prev,
        [newBudgetCategory]: {
          planned: parseFloat(newBudgetAmount),
          actual: 0
        }
      }));
      setNewBudgetCategory('');
      setNewBudgetAmount('');
    }
  };

  const updateBudgetAmount = (category: string, newAmount: string) => {
    if (newAmount && parseFloat(newAmount) >= 0) {
      setBudgets(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          planned: parseFloat(newAmount)
        }
      }));
      setEditingBudget(null);
    }
  };

  const deleteBudgetCategory = (category: string) => {
    const updatedBudgets = { ...budgets };
    delete updatedBudgets[category];
    setBudgets(updatedBudgets);
  };

  const updateGoalValue = (field: keyof Goals, newValue: string) => {
    if (newValue && parseFloat(newValue) >= 0) {
      setGoals(prev => ({
        ...prev,
        [field]: parseFloat(newValue)
      }));
      setEditingGoal(null);
    }
  };

  const updateEmergencyFundValue = (field: keyof EmergencyFund, newValue: string) => {
    if (newValue && parseFloat(newValue) >= 0) {
      setEmergencyFund(prev => ({
        ...prev,
        [field]: parseFloat(newValue)
      }));
      setEditingGoal(null);
    }
  };

  const exportData = () => {
    const data = {
      expenses,
      investments,
      budgets,
      emergencyFund,
      goals,
      privacySettings,
      aiSettings: { ...aiSettings, geminiApiKey: '' }, // Don't export API key
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arpan-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          // Handle both old format and new backup format
          let importedData = data;
          if (data.data) {
            // New backup format
            importedData = data.data;
          }
          
          // Import with proper validation and logging
          if (importedData.expenses && Array.isArray(importedData.expenses)) {
            setExpenses(importedData.expenses);
            console.log('✅ Imported expenses:', importedData.expenses.length);
          }
          
          if (importedData.investments && Array.isArray(importedData.investments)) {
            setInvestments(importedData.investments);
            console.log('✅ Imported investments:', importedData.investments.length);
          }
          
          if (importedData.budgets && typeof importedData.budgets === 'object') {
            setBudgets(importedData.budgets);
            console.log('✅ Imported budgets:', Object.keys(importedData.budgets).length);
          }
          
          if (importedData.emergencyFund && typeof importedData.emergencyFund === 'object') {
            setEmergencyFund(importedData.emergencyFund);
            console.log('✅ Imported emergency fund');
          }
          
          if (importedData.goals && typeof importedData.goals === 'object') {
            setGoals(importedData.goals);
            console.log('✅ Imported goals');
          }
          
          if (importedData.customGoals && Array.isArray(importedData.customGoals)) {
            setCustomGoals(importedData.customGoals);
            console.log('✅ Imported custom goals:', importedData.customGoals.length);
          }
          
          if (importedData.privacySettings && typeof importedData.privacySettings === 'object') {
            setPrivacySettings(importedData.privacySettings);
            console.log('✅ Imported privacy settings');
          }
          
          if (importedData.aiSettings && typeof importedData.aiSettings === 'object') {
            setAISettings(prev => ({
              ...prev,
              ...importedData.aiSettings,
              geminiApiKey: prev.geminiApiKey // Keep current API key for security
            }));
            console.log('✅ Imported AI settings (kept existing API key)');
          }

          // Force page refresh to ensure all data is properly loaded
          setTimeout(() => {
            window.location.reload();
          }, 1000);

          alert('✅ Data imported successfully! Page will refresh to show the imported data.');
        } catch (error) {
          console.error('❌ Import failed:', error);
          alert(`❌ Error importing data: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the file format.`);
        }
      };
      reader.readAsText(file);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const spendingTrend = expenses.slice(-7).map((expense, index) => ({
    day: `Day ${index + 1}`,
    amount: expense.amount
  }));

  // Pie chart data for expense breakdown
  const pieChartData = Object.entries(budgets)
    .filter(([_, budget]) => budget.actual > 0)
    .map(([category, budget]) => ({
      name: category,
      value: budget.actual,
      percentage: totalActualExpenses > 0 ? ((budget.actual / totalActualExpenses) * 100).toFixed(1) : 0
    }));

  // Colors for pie chart
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const getBudgetStatus = (planned: number, actual: number) => {
    const percentage = (actual / planned) * 100;
    if (percentage <= 80) return 'text-green-600 bg-green-100';
    if (percentage <= 100) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSmartTip = () => {
    const tips = [
      "You're on track! Keep maintaining your ₹7.5k monthly savings target.",
      "Consider automating your SIPs to avoid missing investment opportunities.",
      "Emergency fund tip: Aim for 6 months of expenses (₹50k target is perfect).",
      "Food expenses seem high. Try meal prepping to save ₹2k/month.",
      "Great discipline! Your savings rate is above industry average for interns."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const togglePrivacy = (field: keyof PrivacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const formatSecureAmount = (amount: number, isHidden: boolean) => {
    return isHidden ? '₹****' : `₹${amount.toLocaleString()}`;
  };

  // User Profile Management Functions
  const saveUserProfile = async () => {
    try {
      setUserProfile({
        ...tempProfile,
        lastUpdated: new Date().toISOString()
      });
      setEditingProfile(false);
      
      // Sync to cloud immediately
      if (mongoSyncEnabled) {
        await syncDataToMongoDB();
      }
      
      console.log('✅ User profile updated and synced to cloud');
    } catch (error) {
      console.error('❌ Failed to save user profile:', error);
      alert('❌ Failed to save profile. Please try again.');
    }
  };

  const cancelProfileEdit = () => {
    setTempProfile(userProfile);
    setEditingProfile(false);
  };

  // AI Integration Functions
  const generateAIInsights = async () => {
    if (!aiSettings.geminiApiKey || !aiSettings.enableAI) {
      alert('Please enter your Gemini API key in settings first!');
      return;
    }

    // Check if we're in quota cooldown
    const quotaResetTime = localStorage.getItem('quotaResetTime');
    const now = Date.now();
    
    if (quotaResetTime && now < parseInt(quotaResetTime)) {
      alert('⏰ API quota limit reached. Please wait before generating new insights.');
      setApiStatus('limited');
      return;
    }

    setIsLoadingAI(true);
    try {
      const prompt = `
      Analyze this financial data and provide actionable insights:
      
      Monthly Income: ₹${monthlyIncome}
      Current Savings: ₹${currentSavings}
      Savings Rate: ${savingsRate}%
      Total Monthly Expenses: ₹${thisMonthSpent}
      Total Investments: ₹${totalInvestments}
      Total Returns: ₹${totalReturns}
      Emergency Fund: ₹${emergencyFund.current} / ₹${emergencyFund.target}
      
      Budget Categories:
      ${Object.entries(budgets).map(([cat, budget]) => 
        `${cat}: Planned ₹${budget.planned}, Actual ₹${budget.actual}`
      ).join('\n')}
      
      Recent Expenses:
      ${expenses.slice(-5).map(exp => `${exp.category}: ₹${exp.amount} (${exp.note})`).join('\n')}
      
      Current Market Data:
      NIFTY 50: ${marketData.nifty50.value} (${marketData.nifty50.changePercent > 0 ? '+' : ''}${marketData.nifty50.changePercent}%)
      SENSEX: ${marketData.sensex.value} (${marketData.sensex.changePercent > 0 ? '+' : ''}${marketData.sensex.changePercent}%)
      Bitcoin: ₹${marketData.bitcoin.value} (${marketData.bitcoin.changePercent > 0 ? '+' : ''}${marketData.bitcoin.changePercent}%)
      
      Please provide:
      1. 4 specific insights with actionable advice
      2. 5 investment tips considering current market conditions
      3. Format as JSON with insights array and investmentTips array
      4. Each insight should have title, message, type (success/warning/info), and action
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiSettings.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️ API quota exceeded for insights. Using fallback.');
          setApiStatus('limited');
          // Set a 30-minute cooldown
          localStorage.setItem('quotaResetTime', (now + 1800000).toString());
          throw new Error('QUOTA_EXCEEDED');
        }
        setApiStatus('error');
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      // API call successful
      setApiStatus('active');
      
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text;
      
      // Track this API call in history
      const apiCallHistory = JSON.parse(localStorage.getItem('apiCallHistory') || '[]');
      const updatedHistory = [...apiCallHistory.filter((timestamp: number) => now - timestamp < 3600000), now];
      localStorage.setItem('apiCallHistory', JSON.stringify(updatedHistory));

      console.log('AI Response from generateAIInsights:', aiResponse); // Debug log

      if (aiResponse) {
        // Try to parse JSON response, fallback to creating structured response
        let parsedResponse;
        try {
          // Extract JSON from the response if it's wrapped in markdown
          const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            // Ensure investmentTips are always strings
            if (parsedResponse.investmentTips && Array.isArray(parsedResponse.investmentTips)) {
              parsedResponse.investmentTips = parsedResponse.investmentTips.map((tip: any) => 
                typeof tip === 'string' ? tip : typeof tip === 'object' ? JSON.stringify(tip) : String(tip)
              );
            }
          } else {
            throw new Error('No JSON found');
          }
        } catch (e) {
          // Fallback: create structured response from AI text
          parsedResponse = {
            insights: [
              {
                title: "AI Financial Analysis 🤖",
                message: aiResponse.substring(0, 200) + "...",
                type: "info" as const,
                action: "Review the detailed analysis and adjust your financial strategy accordingly."
              }
            ],
            investmentTips: [
              "Based on current market conditions, consider reviewing your portfolio allocation",
              "Market volatility presents both opportunities and risks - maintain your SIP discipline",
              "Emergency fund should be your priority before aggressive investments"
            ]
          };
        }

        setAISettings(prev => ({
          ...prev,
          aiInsights: {
            ...parsedResponse,
            timestamp: Date.now()
          }
        }));
      }
    } catch (error) {
      console.error('AI Insights Error:', error);
      
      // Set appropriate API status
      if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
        setApiStatus('limited');
      } else {
        setApiStatus('error');
      }
      
      // Fallback insights based on actual data
      const fallbackResponse: AIInsights = {
        insights: [
          {
            title: "Savings Performance �",
            message: `Your ${savingsRate}% savings rate is ${parseFloat(savingsRate) > 20 ? 'excellent' : parseFloat(savingsRate) > 15 ? 'good' : 'needs improvement'}.`,
            type: parseFloat(savingsRate) > 20 ? "success" as const : parseFloat(savingsRate) > 15 ? "info" as const : "warning" as const,
            action: parseFloat(savingsRate) > 20 ? "Consider increasing investments" : "Try to reduce expenses in non-essential categories"
          },
          {
            title: "Emergency Fund Status 🛡️",
            message: `You have ₹${emergencyFund.current.toLocaleString()} in emergency fund (${((emergencyFund.current / emergencyFund.target) * 100).toFixed(0)}% of target).`,
            type: emergencyFund.current >= emergencyFund.target * 0.5 ? "success" as const : "warning" as const,
            action: emergencyFund.current >= emergencyFund.target * 0.5 ? "Great progress! Keep contributing regularly." : "Prioritize building emergency fund to 6 months of expenses."
          },
          {
            title: "Investment Growth 📈",
            message: `Total investments: ₹${totalInvestments.toLocaleString()} with returns of ₹${totalReturns.toLocaleString()}.`,
            type: "info" as const,
            action: totalInvestments > 10000 ? "Consider diversifying across asset classes" : "Start systematic investing with small amounts"
          },
          {
            title: "Market Opportunity 🎯",
            message: `NIFTY 50 is ${marketData.nifty50.changePercent > 0 ? 'up' : 'down'} ${Math.abs(marketData.nifty50.changePercent)}% today.`,
            type: "info" as const,
            action: "Market movements are short-term. Focus on long-term SIP investments for better returns."
          }
        ],
        investmentTips: [
          `💎 NIFTY 50 Index funds are ${marketData.nifty50.changePercent > 0 ? 'performing well' : 'available at lower prices'} - good for SIP`,
          `🚀 With Bitcoin ${marketData.bitcoin.changePercent > 0 ? 'rallying' : 'correcting'} ${Math.abs(marketData.bitcoin.changePercent)}%, consider crypto allocation (max 5% of portfolio)`,
          `🛡️ Gold is ${marketData.gold.changePercent > 0 ? 'up' : 'down'} ${Math.abs(marketData.gold.changePercent)}% - maintain 10% allocation for stability`,
          `📱 Start SIP in large-cap funds with ₹2000/month for stable 10-12% returns`,
          `⏰ Market timing doesn't work - stick to your investment plan and increase SIP annually by 10%`
        ]
      };

      setAISettings(prev => ({
        ...prev,
        aiInsights: {
          ...fallbackResponse,
          timestamp: Date.now()
        }
      }));
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Function to get real-time SIP recommendations
  const getSIPRecommendations = async () => {
    try {
      // Check if we're in quota cooldown
      const quotaResetTime = localStorage.getItem('quotaResetTime');
      const now = Date.now();
      
      if (quotaResetTime && now < parseInt(quotaResetTime)) {
        console.log('⏰ API quota cooldown active. Using fallback SIP recommendations.');
        setApiStatus('limited');
        throw new Error('QUOTA_EXCEEDED');
      }
      
      // Check rate limiting
      const lastSIPCall = localStorage.getItem('lastSIPCall');
      if (lastSIPCall && (now - parseInt(lastSIPCall)) < 60000) {
        console.log('⏰ Rate limit: Too soon since last SIP API call');
        return;
      }

      const prompt = `
      Based on current market conditions and this user profile:
      - Monthly Income: ₹${monthlyIncome}
      - Current Savings: ₹${currentSavings}
      - Risk Profile: Moderate (young investor)
      - Investment Amount: ₹${totalInvestments}
      
      Recommend 5 mutual funds/SIPs with current market considerations:
      1. Fund name, category, expected returns, risk level, minimum SIP amount
      2. Consider current NIFTY 50 at ${marketData.nifty50.value} (${marketData.nifty50.changePercent > 0 ? '+' : ''}${marketData.nifty50.changePercent}%)
      3. Diversify across large-cap, mid-cap, and sectoral funds
      
      Format as JSON array with fundName, category, returns, risk, minSip fields.
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiSettings.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️ API quota exceeded for SIP recommendations. Using fallback.');
          setApiStatus('limited');
          // Set a 30-minute cooldown
          localStorage.setItem('quotaResetTime', (now + 1800000).toString());
          throw new Error('QUOTA_EXCEEDED');
        }
        setApiStatus('error');
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      // API call successful
      setApiStatus('active');
      
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text;
      localStorage.setItem('lastSIPCall', now.toString());
      
      // Track this API call in history
      const apiCallHistory = JSON.parse(localStorage.getItem('apiCallHistory') || '[]');
      const updatedHistory = [...apiCallHistory.filter((timestamp: number) => now - timestamp < 3600000), now];
      localStorage.setItem('apiCallHistory', JSON.stringify(updatedHistory));

      // Parse and set recommendations
      let recommendations = [];
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/) || aiResponse.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        }
      } catch (e) {
        throw new Error('PARSING_ERROR');
      }
      
      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new Error('NO_RECOMMENDATIONS');
      }
      
      setSipRecommendations(recommendations);
    } catch (error) {
      console.error('SIP Recommendations Error:', error);
      
      // Set appropriate API status
      if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
        setApiStatus('limited');
      } else {
        setApiStatus('error');
      }
      
      // Enhanced fallback recommendations based on market conditions
      const fallbackRecommendations = [
        { 
          fundName: "SBI Bluechip Fund", 
          category: "Large Cap", 
          returns: marketData.nifty50.changePercent > 0 ? "11-13%" : "10-12%", 
          risk: "Low", 
          minSip: 1000 
        },
        { 
          fundName: "Axis Midcap Fund", 
          category: "Mid Cap", 
          returns: "12-15%", 
          risk: "Medium", 
          minSip: 1000 
        },
        { 
          fundName: "ICICI Nifty 50 Index", 
          category: "Index", 
          returns: "10-11%", 
          risk: "Low", 
          minSip: 500 
        },
        { 
          fundName: "Mirae Asset Digital India", 
          category: "Thematic", 
          returns: "15-18%", 
          risk: "High", 
          minSip: 1000 
        },
        { 
          fundName: "HDFC Hybrid Equity", 
          category: "Hybrid", 
          returns: "8-10%", 
          risk: "Low", 
          minSip: 1000 
        },
        {
          fundName: "Parag Parikh Flexi Cap",
          category: "Flexi Cap",
          returns: "12-14%",
          risk: "Medium",
          minSip: 1000
        }
      ];
      
      setSipRecommendations(fallbackRecommendations);
    }
  };

  // Function to update market data periodically
  const updateMarketData = () => {
    // Simulate real-time market updates
    setMarketData(prev => ({
      nifty50: {
        value: prev.nifty50.value + (Math.random() - 0.5) * 20,
        change: prev.nifty50.change + (Math.random() - 0.5) * 10,
        changePercent: prev.nifty50.changePercent + (Math.random() - 0.5) * 0.2
      },
      sensex: {
        value: prev.sensex.value + (Math.random() - 0.5) * 100,
        change: prev.sensex.change + (Math.random() - 0.5) * 50,
        changePercent: prev.sensex.changePercent + (Math.random() - 0.5) * 0.2
      },
      bitcoin: {
        value: prev.bitcoin.value + (Math.random() - 0.5) * 50000,
        change: prev.bitcoin.change + (Math.random() - 0.5) * 20000,
        changePercent: prev.bitcoin.changePercent + (Math.random() - 0.5) * 1
      },
      gold: {
        value: prev.gold.value + (Math.random() - 0.5) * 20,
        change: prev.gold.change + (Math.random() - 0.5) * 10,
        changePercent: prev.gold.changePercent + (Math.random() - 0.5) * 0.3
      }
    }));
  };

  // Function to generate real-time insights for dashboard
  const generateRealTimeInsights = async () => {
    try {
      // Check if we're in quota cooldown
      const quotaResetTime = localStorage.getItem('quotaResetTime');
      const now = Date.now();
      
      if (quotaResetTime && now < parseInt(quotaResetTime)) {
        console.log('⏰ API quota cooldown active. Using fallback insights.');
        setApiStatus('limited');
        throw new Error('QUOTA_EXCEEDED');
      }
      
      // Check rate limiting
      const lastAPICall = localStorage.getItem('lastInsightsCall');
      if (lastAPICall && (now - parseInt(lastAPICall)) < 30000) {
        console.log('⏰ Rate limit: Too soon since last API call');
        return;
      }

      const prompt = `
      Generate exactly 3 short, actionable financial insights for today based on:
      - Current savings: ₹${currentSavings}
      - Monthly expenses: ₹${thisMonthSpent} 
      - NIFTY 50: ${marketData.nifty50.changePercent > 0 ? 'up' : 'down'} ${Math.abs(marketData.nifty50.changePercent)}%
      - Emergency fund: ${((emergencyFund.current / emergencyFund.target) * 100).toFixed(0)}% complete
      
      Each insight should be one sentence, actionable, and under 50 words.
      Return ONLY as a simple text list, one insight per line, without any JSON formatting.
      Example format:
      Your savings rate is excellent - keep it up!
      Market volatility creates SIP opportunities.
      Emergency fund needs attention - add ₹2000 this month.
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiSettings.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⚠️ API quota exceeded. Using fallback insights.');
          setApiStatus('limited');
          // Set a 30-minute cooldown
          localStorage.setItem('quotaResetTime', (now + 1800000).toString());
          throw new Error('QUOTA_EXCEEDED');
        }
        setApiStatus('error');
        throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
      }
      
      // API call successful
      setApiStatus('active');
      
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text;
      localStorage.setItem('lastInsightsCall', now.toString());
      
      // Track this API call in history
      const apiCallHistory = JSON.parse(localStorage.getItem('apiCallHistory') || '[]');
      const updatedHistory = [...apiCallHistory.filter((timestamp: number) => now - timestamp < 3600000), now];
      localStorage.setItem('apiCallHistory', JSON.stringify(updatedHistory));

      console.log('AI Response from generateRealTimeInsights:', aiResponse);

      // Parse insights
      let insights = [];
      try {
        // First try to parse as JSON
        const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/) || aiResponse.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const parsedArray = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          if (Array.isArray(parsedArray)) {
            insights = parsedArray.map((item: any) => typeof item === 'string' ? item : String(item)).slice(0, 3);
          } else {
            throw new Error('Not an array');
          }
        } else {
          // Fallback: parse as text lines
          const lines = aiResponse.split('\n').filter((line: string) => line.trim());
          insights = lines
            .slice(0, 3)
            .map((line: string) => line.replace(/^\d+\.?\s*/, '').replace(/^[-*]\s*/, '').replace(/^["']\s*/, '').replace(/\s*["']$/, '').trim())
            .filter((line: string) => line.length > 0);
        }
      } catch (e) {
        throw new Error('PARSING_ERROR');
      }
      
      // Ensure we always have exactly 3 valid insights
      if (!Array.isArray(insights) || insights.length === 0) {
        throw new Error('NO_INSIGHTS');
      }
      
      // Ensure all insights are strings and filter out empty ones
      insights = insights
        .filter((insight: any) => insight && typeof insight === 'string' && insight.trim().length > 0)
        .slice(0, 3);
      
      // If we still don't have 3 insights, pad with defaults
      while (insights.length < 3) {
        const defaultInsights = [
          "Keep tracking your expenses to maintain your excellent savings discipline.",
          "Consider starting a SIP if you haven't already - even ₹1000/month helps.",
          "Review your budget monthly to identify optimization opportunities."
        ];
        insights.push(defaultInsights[insights.length]);
      }
      
      setRealTimeInsights(insights);
    } catch (error) {
      console.error('Real-time insights error:', error);
      
      // Set appropriate API status
      if (error instanceof Error) {
        if (error.message === 'QUOTA_EXCEEDED') {
          setApiStatus('limited');
        } else {
          setApiStatus('error');
        }
      }
      
      // Enhanced fallback insights based on actual data
      const fallbackInsights = [
        currentSavings > 15000 ? 
          `Excellent! Your ₹${currentSavings.toLocaleString()} monthly savings puts you ahead of most people.` :
          currentSavings > 5000 ?
          `Good progress with ₹${currentSavings.toLocaleString()} monthly savings. Try to increase gradually.` :
          "Focus on reducing expenses to boost your monthly savings rate.",
        
        marketData.nifty50.changePercent > 0 ? 
          "Market is up today - perfect time to continue your SIP investments." :
          "Market dip creates buying opportunities for long-term SIP investors.",
          
        emergencyFund.current < emergencyFund.target * 0.5 ?
          `Emergency fund at ${((emergencyFund.current / emergencyFund.target) * 100).toFixed(0)}% - prioritize building it to ₹${emergencyFund.target.toLocaleString()}.` :
          "Emergency fund is progressing well - maintain regular contributions."
      ];
      
      setRealTimeInsights(fallbackInsights);
    }
  };

  // Export data as CSV
  const exportDataAsCSV = () => {
    const csvData = {
      expenses: expenses.map(exp => [exp.date, exp.category, exp.amount, exp.note]),
      investments: investments.map(inv => [inv.date, inv.name, inv.type, inv.amount, inv.returns]),
      budgets: Object.entries(budgets).map(([category, budget]) => [category, budget.planned, budget.actual]),
      summary: [
        ['Metric', 'Value'],
        ['Monthly Income', monthlyIncome],
        ['Current Savings', currentSavings],
        ['Savings Rate', savingsRate + '%'],
        ['Total Expenses', totalActualExpenses],
        ['Total Investments', totalInvestments],
        ['Emergency Fund', emergencyFund.current]
      ]
    };

    let csvContent = '';
    
    // Add summary
    csvContent += 'FINANCIAL SUMMARY\n';
    csvData.summary.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    csvContent += '\nEXPENSES\n';
    csvContent += 'Date,Category,Amount,Note\n';
    csvData.expenses.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    csvContent += '\nINVESTMENTS\n';
    csvContent += 'Date,Name,Type,Amount,Returns\n';
    csvData.investments.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    csvContent += '\nBUDGET\n';
    csvContent += 'Category,Planned,Actual\n';
    csvData.budgets.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arpan-tracker-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Show loading state when loading from cloud */}
      {isLoadingFromCloud && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <div>
              <h3 className="text-lg font-semibold">Loading Your Data from Cloud</h3>
              <p className="text-blue-100">Fetching your financial data from MongoDB Atlas...</p>
            </div>
          </div>
        </div>
      )}
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-blue-100">Monthly Income</p>
              <p className="text-2xl font-bold">{formatSecureAmount(monthlyIncome, privacySettings.hideIncome)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => togglePrivacy('hideIncome')}
                className="p-1 hover:bg-blue-400 rounded"
                title={privacySettings.hideIncome ? "Show amount" : "Hide amount"}
              >
                {privacySettings.hideIncome ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-green-100">Current Savings</p>
              <p className="text-2xl font-bold">{formatSecureAmount(currentSavings, privacySettings.hideSavings)}</p>
              <p className="text-sm text-green-100">{privacySettings.hideSavings ? '**%' : `${savingsRate}%`} savings rate</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => togglePrivacy('hideSavings')}
                className="p-1 hover:bg-green-400 rounded"
                title={privacySettings.hideSavings ? "Show amount" : "Hide amount"}
              >
                {privacySettings.hideSavings ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-purple-100">Invested</p>
              <p className="text-2xl font-bold">{formatSecureAmount(totalInvestments, privacySettings.hideInvestments)}</p>
              <p className="text-sm text-purple-100">{privacySettings.hideInvestments ? '+₹***' : `+₹${totalReturns}`} returns</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => togglePrivacy('hideInvestments')}
                className="p-1 hover:bg-purple-400 rounded"
                title={privacySettings.hideInvestments ? "Show amount" : "Hide amount"}
              >
                {privacySettings.hideInvestments ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
              <Activity className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-orange-100">This Month Spent</p>
              <p className="text-2xl font-bold">{formatSecureAmount(thisMonthSpent, privacySettings.hideExpenses)}</p>
              <p className="text-sm text-orange-100">Budget: {privacySettings.hideExpenses ? '₹****' : `₹${totalPlannedBudget.toLocaleString()}`}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => togglePrivacy('hideExpenses')}
                className="p-1 hover:bg-orange-400 rounded"
                title={privacySettings.hideExpenses ? "Show amount" : "Hide amount"}
              >
                {privacySettings.hideExpenses ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )}
              </button>
              <PieChart className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-500" />
            Monthly Savings Goal
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>₹{currentSavings.toLocaleString()} / ₹{goals.monthlySavingsTarget.toLocaleString()}</span>
              <span className="font-medium">{goals.monthlySavingsTarget > 0 ? Math.min(100, (currentSavings / goals.monthlySavingsTarget * 100)).toFixed(1) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (currentSavings / goals.monthlySavingsTarget) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Emergency Fund
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>₹{emergencyFund.current.toLocaleString()} / ₹{emergencyFund.target.toLocaleString()}</span>
              <span className="font-medium">{(emergencyFund.current / emergencyFund.target * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(emergencyFund.current / emergencyFund.target) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-gray-500">
              <PieChart className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-center">No expenses yet!</p>
              <p className="text-sm text-center mt-2">Add some expenses to see the breakdown</p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Recent Spending Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={spendingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Smart Tip */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl text-white">
        <div className="flex items-start space-x-3">
          <Zap className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-1">💡 Smart Tip of the Day</h3>
            <p className="text-indigo-100">{getSmartTip()}</p>
          </div>
        </div>
      </div>

      {/* Real-time AI Insights */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-500" />
            Real-time AI Insights
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => createBackup(false)}
              className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center space-x-1"
              title="Create backup"
            >
              <Save className="w-4 h-4" />
              <span>Backup</span>
            </button>
            <button
              onClick={() => {
                const lastRefresh = localStorage.getItem('lastManualRefresh');
                const now = Date.now();
                if (!lastRefresh || (now - parseInt(lastRefresh)) > 15000) {
                  generateRealTimeInsights();
                  localStorage.setItem('lastManualRefresh', now.toString());
                } else {
                  const remaining = Math.ceil((15000 - (now - parseInt(lastRefresh))) / 1000);
                  alert(`⏰ Please wait ${remaining} seconds before refreshing again to avoid rate limits.`);
                }
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {realTimeInsights
            .filter(insight => insight && typeof insight === 'string' && insight.trim().length > 0)
            .map((insight, index) => (
            <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-gray-700">{String(insight).replace(/^["'\[\]]+|["'\[\]]+$/g, '').trim()}</p>
            </div>
          ))}
        </div>
        
        {realTimeInsights.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Click refresh to get AI-powered insights</p>
          </div>
        )}
      </div>

      {/* Market Overview */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          Live Market Overview
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">NIFTY 50</div>
            <div className="text-lg font-bold text-blue-700">{marketData.nifty50.value.toFixed(2)}</div>
            <div className={`text-sm font-medium ${marketData.nifty50.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketData.nifty50.changePercent >= 0 ? '+' : ''}{marketData.nifty50.changePercent.toFixed(2)}%
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">SENSEX</div>
            <div className="text-lg font-bold text-purple-700">{marketData.sensex.value.toFixed(2)}</div>
            <div className={`text-sm font-medium ${marketData.sensex.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketData.sensex.changePercent >= 0 ? '+' : ''}{marketData.sensex.changePercent.toFixed(2)}%
            </div>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">Bitcoin</div>
            <div className="text-lg font-bold text-orange-700">₹{(marketData.bitcoin.value/1000).toFixed(0)}k</div>
            <div className={`text-sm font-medium ${marketData.bitcoin.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketData.bitcoin.changePercent >= 0 ? '+' : ''}{marketData.bitcoin.changePercent.toFixed(2)}%
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">Gold (per 10g)</div>
            <div className="text-lg font-bold text-yellow-700">₹{marketData.gold.value.toFixed(0)}</div>
            <div className={`text-sm font-medium ${marketData.gold.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketData.gold.changePercent >= 0 ? '+' : ''}{marketData.gold.changePercent.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-500" />
          Achievements & Streaks
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl mb-2">🔥</div>
            <div className="font-semibold">{goals.currentStreak} Days</div>
            <div className="text-sm text-gray-600">Savings Streak</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">💰</div>
            <div className="font-semibold">Budget Master</div>
            <div className="text-sm text-gray-600">Under budget</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">📈</div>
            <div className="font-semibold">Investor</div>
            <div className="text-sm text-gray-600">₹{totalInvestments}+ invested</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-semibold">Goal Setter</div>
            <div className="text-sm text-gray-600">Emergency fund active</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Arpan Tracker</h1>
                <p className="text-xs sm:text-sm text-gray-600">AI Personal Finance Manager</p>
              </div>
            </div>
            
            {/* Desktop Header Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={exportData}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
              </div>
              
              <div className="relative">
                <button
                  onClick={exportDataAsCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              
              <label className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm">Privacy</span>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Header Actions */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4 space-y-3">
              <button
                onClick={() => { exportData(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
              
              <button
                onClick={() => { exportDataAsCSV(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              
              <label className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => { importData(e); setIsMobileMenuOpen(false); }}
                  className="hidden"
                />
              </label>
              
              <div className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm">Privacy</span>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between sm:justify-start items-stretch gap-1 sm:gap-4 overflow-x-auto scrollbar-hide">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'expenses', label: 'Expenses', icon: Plus },
              { id: 'budget', label: 'Budget', icon: PieChart },
              { id: 'investments', label: 'Investments', icon: TrendingUp },
              { id: 'goals', label: 'Goals', icon: Target },
              { id: 'ai-insights', label: 'AI', icon: Zap },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center px-2 py-2 sm:flex-row sm:items-center sm:justify-start sm:px-3 sm:py-4 border-b-2 font-medium text-[13px] sm:text-sm transition-colors whitespace-nowrap min-w-[64px] ${
                    activeTab === tab.id 
                      ? 'border-blue-500 text-blue-600 bg-blue-50 sm:bg-transparent' 
                      : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50 sm:hover:bg-transparent'
                  }`}
                  style={{flex: '1 0 20%'}}
                >
                  <IconComponent className="w-5 h-5 mb-0.5 sm:mb-0 flex-shrink-0" />
                  <span className="block sm:hidden text-[11px] font-medium mt-0.5">{tab.label.split(' ')[0]}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center">
                <Plus className="w-5 sm:w-6 h-5 sm:h-6 mr-2 text-blue-500" />
                Add New Expense
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                >
                  <option value="">Select Category</option>
                  {[
                    'Food',
                    'Transport',
                    'Rent',
                    'Entertainment',
                    'Shopping',
                    'Gym',
                    'Phone',
                    'Family',
                    'Health',
                    'Education',
                    'Others'
                  ].map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  {/* Also show any custom budget categories not in the above list */}
                  {Object.keys(budgets)
                    .filter(category => ![
                      'Food',
                      'Transport',
                      'Rent',
                      'Entertainment',
                      'Shopping',
                      'Gym',
                      'Phone',
                      'Family',
                      'Health',
                      'Education',
                      'Others'
                    ].includes(category))
                    .map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={newExpense.note}
                  onChange={(e) => setNewExpense({...newExpense, note: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
                <button
                  onClick={addExpense}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors text-base min-h-12"
                >
                  Add Expense
                </button>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
              <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                {expenses.slice().reverse().map(expense => {
                  const IconComponent = categoryIcons[expense.category] || MoreHorizontal;
                  return (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{expense.category}</div>
                          <div className="text-sm text-gray-600">{expense.note}</div>
                          <div className="text-xs text-gray-500">{expense.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">₹{expense.amount}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'ai-insights' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 sm:p-6 rounded-xl text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                    <Zap className="w-6 sm:w-7 h-6 sm:h-7 mr-3 text-yellow-300" />
                    AI Financial Insights
                  </h2>
                  <p className="text-purple-100 mt-2 text-sm sm:text-base">Powered by Google Gemini AI</p>
                </div>
                <button
                  onClick={generateAIInsights}
                  disabled={isLoadingAI || !aiSettings.enableAI}
                  className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base min-h-12"
                >
                  {isLoadingAI ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      <span>Generate Insights</span>
                    </>
                  )}
                </button>
              </div>
              
              {!aiSettings.enableAI && (
                <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                  <p className="text-sm">⚠️ Please enable AI and add your Gemini API key in Settings to use this feature.</p>
                </div>
              )}
            </div>

            {aiSettings.aiInsights?.insights && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {aiSettings.aiInsights.insights.map((insight, index) => (
                  <div key={index} className={`p-4 sm:p-6 rounded-xl shadow-lg ${
                    insight.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                    'bg-blue-50 border-l-4 border-blue-500'
                  }`}>
                    <h3 className={`font-bold text-base sm:text-lg mb-2 ${
                      insight.type === 'success' ? 'text-green-700' :
                      insight.type === 'warning' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {insight.title}
                    </h3>
                    <p className="text-gray-700 mb-3 text-sm sm:text-base">{insight.message}</p>
                    <div className={`p-3 rounded-lg text-xs sm:text-sm font-medium ${
                      insight.type === 'success' ? 'bg-green-100 text-green-800' :
                      insight.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      <strong>Action:</strong> {insight.action}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aiSettings.aiInsights?.investmentTips && Array.isArray(aiSettings.aiInsights.investmentTips) && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
                  Latest Investment Tips
                </h3>
                <div className="space-y-3">
                  {aiSettings.aiInsights.investmentTips
                    .filter(tip => tip && typeof tip === 'string') // Additional safety filter
                    .map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-gray-500" />
                AI Configuration
              </h2>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border-l-4 ${
                  apiStatus === 'active' ? 'bg-green-50 border-green-500' :
                  apiStatus === 'limited' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className={`w-5 h-5 ${
                      apiStatus === 'active' ? 'text-green-600' :
                      apiStatus === 'limited' ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                    <span className={`font-medium ${
                      apiStatus === 'active' ? 'text-green-800' :
                      apiStatus === 'limited' ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      AI Features {
                        apiStatus === 'active' ? 'Active' :
                        apiStatus === 'limited' ? 'Rate Limited' :
                        'Error'
                      }
                    </span>
                  </div>
                  <p className={`text-sm ${
                    apiStatus === 'active' ? 'text-green-700' :
                    apiStatus === 'limited' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {apiStatus === 'active' ? 
                      'Gemini AI is working normally and providing real-time insights.' :
                      apiStatus === 'limited' ?
                      (() => {
                        const quotaResetTime = localStorage.getItem('quotaResetTime');
                        const now = Date.now();
                        if (quotaResetTime && now < parseInt(quotaResetTime)) {
                          const minutesLeft = Math.ceil((parseInt(quotaResetTime) - now) / (1000 * 60));
                          return `API quota reached. Features will resume in ${minutesLeft} minutes. Using intelligent fallbacks.`;
                        }
                        return 'API quota reached. Using intelligent fallbacks. Features will resume automatically.';
                      })() :
                      'API connection issues. Using cached insights and fallback recommendations.'
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">🤖 Available AI Features:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Real-time financial insights and recommendations</li>
                    <li>• Personalized SIP and mutual fund suggestions</li>
                    <li>• Market-based investment opportunities</li>
                    <li>• Expense optimization suggestions</li>
                    <li>• Goal-based investment planning</li>
                  </ul>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">Quick Actions:</span>
                    <span className="ml-2 text-gray-600 text-sm">Generate fresh insights or reset quota limits</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={generateAIInsights}
                      disabled={isLoadingAI || apiStatus === 'limited'}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors text-sm"
                    >
                      {isLoadingAI ? 'Generating...' : 'Generate Insights'}
                    </button>
                    {apiStatus === 'limited' && (
                      <button
                        onClick={() => {
                          localStorage.removeItem('quotaResetTime');
                          localStorage.removeItem('apiCallHistory');
                          setApiStatus('active');
                          console.log('🔄 Manually cleared API quota cooldown.');
                        }}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                      >
                        Clear Quota Cooldown
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* User Profile Settings */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-500" />
                User Profile
              </h3>
              
              {!editingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-1">Monthly Income</h4>
                      <p className="text-2xl font-bold text-blue-900">₹{userProfile.monthlyIncome.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-1">Family Support</h4>
                      <p className="text-2xl font-bold text-green-900">₹{userProfile.familySupport.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-1">Brother Support</h4>
                      <p className="text-2xl font-bold text-purple-900">₹{userProfile.brotherSupport.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <span className="ml-2 font-medium">{new Date(userProfile.lastUpdated).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => {
                        setTempProfile(userProfile);
                        setEditingProfile(true);
                      }}
                      className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income (₹)</label>
                      <input
                        type="number"
                        value={tempProfile.monthlyIncome}
                        onChange={(e) => setTempProfile(prev => ({
                          ...prev,
                          monthlyIncome: parseFloat(e.target.value) || 0
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="35000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Family Support (₹)</label>
                      <input
                        type="number"
                        value={tempProfile.familySupport}
                        onChange={(e) => setTempProfile(prev => ({
                          ...prev,
                          familySupport: parseFloat(e.target.value) || 0
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brother Support (₹)</label>
                      <input
                        type="number"
                        value={tempProfile.brotherSupport}
                        onChange={(e) => setTempProfile(prev => ({
                          ...prev,
                          brotherSupport: parseFloat(e.target.value) || 0
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="2000"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={cancelProfileEdit}
                      className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={saveUserProfile}
                      className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save & Sync</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {Object.entries(privacySettings).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => togglePrivacy(key as keyof PrivacySettings)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="capitalize">{key.replace('hide', 'Hide ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Save className="w-5 h-5 mr-2 text-blue-500" />
                Backup & Data Management
              </h3>
              
              {/* Auto Backup Settings */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-blue-800">Automatic Daily Backups</h4>
                    <p className="text-sm text-blue-600">
                      Downloads backup automatically every day when you have data
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Last Backup:</span>
                    <div className="text-blue-800">
                      {lastBackupDate || 'Never'}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Status:</span>
                    <div className={`font-medium ${autoBackupEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                      {autoBackupEnabled ? '✅ Active' : '⏸️ Disabled'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Backup Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => createBackup(false)}
                  className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Create Manual Backup</span>
                </button>
                
                <label className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>Restore from Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={restoreBackup}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    if (confirm('⚠️ This will clear ALL data! Are you sure? This action cannot be undone.')) {
                      // Clear all state
                      setExpenses([]);
                      setInvestments([]);
                      setBudgets({});
                      setEmergencyFund({ target: 200000, current: 45000, monthlyContribution: 5000 });
                      setGoals({ monthlySavingsTarget: 20000, totalSavingsGoal: 500000, currentStreak: 15 });
                      setCustomGoals([]);
                      setRealTimeInsights([]);
                      setSipRecommendations([]);
                      
                      // Clear localStorage
                      ['expenses', 'investments', 'budgets', 'emergencyFund', 'goals', 'customGoals'].forEach(key => {
                        localStorage.removeItem(key);
                      });
                      
                      alert('✅ All data cleared successfully!');
                    }
                  }}
                  className="flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Clear All Data</span>
                </button>
              </div>

              {/* Backup History */}
              {backupHistory.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Recent Backups</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {backupHistory.slice(0, 5).map((backup, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                        <span className="text-gray-700">{backup}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          backup.includes('(Auto)') ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {backup.includes('(Auto)') ? 'Auto' : 'Manual'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Statistics */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <h4 className="font-semibold text-purple-700 mb-3">📊 Data Overview</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{expenses.length}</div>
                    <div className="text-purple-600">Expenses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{investments.length}</div>
                    <div className="text-purple-600">Investments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{Object.keys(budgets).length}</div>
                    <div className="text-purple-600">Budgets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{customGoals.length}</div>
                    <div className="text-purple-600">Goals</div>
                  </div>
                </div>
                
                {/* Debug Section */}
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h5 className="font-medium text-gray-700 mb-2">🔧 Debug Info</h5>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>LocalStorage Keys: {Object.keys(localStorage).filter(key => 
                      ['expenses', 'investments', 'budgets', 'emergencyFund', 'goals', 'customGoals'].includes(key)
                    ).join(', ')}</div>
                    <div>Emergency Fund: {JSON.stringify(emergencyFund)}</div>
                    <div>Goals: {JSON.stringify(goals)}</div>
                    <div>Last Data Load: {new Date().toLocaleTimeString()}</div>
                  </div>
                  <button
                    onClick={() => {
                      console.log('=== DEBUG DATA DUMP ===');
                      console.log('Expenses:', expenses);
                      console.log('Investments:', investments);
                      console.log('Budgets:', budgets);
                      console.log('Emergency Fund:', emergencyFund);
                      console.log('Goals:', goals);
                      console.log('Custom Goals:', customGoals);
                      console.log('LocalStorage expenses:', localStorage.getItem('expenses'));
                      console.log('LocalStorage investments:', localStorage.getItem('investments'));
                      console.log('LocalStorage budgets:', localStorage.getItem('budgets'));
                      console.log('=== END DEBUG ===');
                      alert('Debug info logged to console. Press F12 to view.');
                    }}
                    className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                  >
                    Log Debug Info
                  </button>
                </div>
              </div>
            </div>

            {/* MongoDB Cloud Sync Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-500" />
                MongoDB Cloud Sync
              </h3>
              
              {/* Sync Status */}
              <div className={`mb-6 p-4 rounded-lg ${
                mongoSyncStatus === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
                mongoSyncStatus === 'syncing' ? 'bg-blue-50 border-l-4 border-blue-500' :
                mongoSyncStatus === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
                'bg-gray-50 border-l-4 border-gray-500'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className={`font-semibold ${
                      mongoSyncStatus === 'success' ? 'text-green-800' :
                      mongoSyncStatus === 'syncing' ? 'text-blue-800' :
                      mongoSyncStatus === 'error' ? 'text-red-800' :
                      'text-gray-800'
                    }`}>
                      🌩️ Cloud Database Sync
                    </h4>
                    <p className={`text-sm ${
                      mongoSyncStatus === 'success' ? 'text-green-600' :
                      mongoSyncStatus === 'syncing' ? 'text-blue-600' :
                      mongoSyncStatus === 'error' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {mongoSyncStatus === 'success' ? '✅ Data synced successfully' :
                       mongoSyncStatus === 'syncing' ? '🔄 Syncing data...' :
                       mongoSyncStatus === 'error' ? '❌ Sync failed - check connection' :
                       'Ready to sync with MongoDB Atlas'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mongoSyncEnabled}
                      onChange={(e) => setMongoSyncEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      mongoSyncEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mongoSyncEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Last Sync:</span>
                    <span className="ml-2 text-gray-600">
                      {lastMongoSync ? new Date(lastMongoSync).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* MongoDB Sync Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={syncDataToMongoDB}
                  disabled={!mongoSyncEnabled || mongoSyncStatus === 'syncing'}
                  className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>{mongoSyncStatus === 'syncing' ? 'Syncing...' : 'Sync to Cloud'}</span>
                </button>
                
                <button
                  onClick={loadDataFromMongoDB}
                  disabled={!mongoSyncEnabled || mongoSyncStatus === 'syncing'}
                  className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Load from Cloud</span>
                </button>

                <button
                  onClick={clearMongoData}
                  disabled={!mongoSyncEnabled || mongoSyncStatus === 'syncing'}
                  className="flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Clear Cloud Data</span>
                </button>
              </div>

              {/* MongoDB Info */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <h4 className="font-semibold text-green-700 mb-3">🌍 Cloud Database Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <ul className="space-y-1 text-green-700">
                      <li>✅ Real-time data synchronization</li>
                      <li>✅ Automatic backups to MongoDB Atlas</li>
                      <li>✅ Access your data from any device</li>
                    </ul>
                  </div>
                  <div>
                    <ul className="space-y-1 text-blue-700">
                      <li>🔄 Auto-sync every 5 minutes when enabled</li>
                      <li>🔒 Secure encrypted data storage</li>
                      <li>📱 Cross-device synchronization</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-white/50 rounded-lg">
                  <h5 className="font-medium text-gray-700 mb-2">📊 Sync Status</h5>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Database: tracker (MongoDB Atlas)</div>
                    <div>Collection: userdata</div>
                    <div>User ID: {localStorage.getItem('tracker_user_id') || 'Not generated yet'}</div>
                    <div>Auto-sync: {mongoSyncEnabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Deployment Instructions</h3>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📱 Mobile Web App (PWA)</h4>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Deploy to Vercel, Netlify, or GitHub Pages</li>
                    <li>Add to your phone's home screen</li>
                    <li>Works offline with cached data</li>
                  </ol>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🚀 Quick Deploy</h4>
                  <ol className="list-decimal list-inside space-y-1 text-green-700">
                    <li>Copy code to a React project</li>
                    <li>Install dependencies: recharts, lucide-react</li>
                    <li>Build and deploy to any hosting service</li>
                  </ol>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">💾 Data Storage</h4>
                  <p className="text-purple-700">Currently uses browser memory. For persistence, integrate with:</p>
                  <ul className="list-disc list-inside mt-1 text-purple-700">
                    <li>Firebase Firestore (free tier)</li>
                    <li>Supabase (PostgreSQL)</li>
                    <li>MongoDB Atlas (free tier)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <PieChart className="w-6 h-6 mr-2 text-green-500" />
                Monthly Budget Overview
              </h2>
              
              {/* Add New Budget Category */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Add New Budget Category</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Category Name (e.g., Food, Transport)"
                    value={newBudgetCategory}
                    onChange={(e) => setNewBudgetCategory(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Planned Amount (₹)"
                    value={newBudgetAmount}
                    onChange={(e) => setNewBudgetAmount(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={addBudgetCategory}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Add Category
                  </button>
                </div>
              </div>

              {/* Budget Categories List */}
              <div className="space-y-4">
                {Object.keys(budgets).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No budget categories yet. Add your first category above!</p>
                  </div>
                ) : (
                  Object.entries(budgets).map(([category, budget]) => {
                    const IconComponent = categoryIcons[category] || MoreHorizontal;
                    const percentage = budget.planned > 0 ? (budget.actual / budget.planned) * 100 : 0;
                    return (
                      <div key={category} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <IconComponent className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="font-medium">{category}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getBudgetStatus(budget.planned, budget.actual)}`}>
                              {percentage.toFixed(1)}%
                            </div>
                            <button
                              onClick={() => setEditingBudget(editingBudget === category ? null : category)}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit planned amount"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteBudgetCategory(category)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {editingBudget === category ? (
                          <div className="mb-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                defaultValue={budget.planned}
                                placeholder="New planned amount"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateBudgetAmount(category, (e.target as HTMLInputElement).value);
                                  }
                                }}
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={(e) => {
                                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                  updateBudgetAmount(category, input.value);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingBudget(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                        
                        <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                          <div>
                            <span className="text-gray-600">Planned:</span>
                            <div className="font-semibold">₹{budget.planned.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Actual:</span>
                            <div className="font-semibold">₹{budget.actual.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Remaining:</span>
                            <div className={`font-semibold ${budget.planned - budget.actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{(budget.planned - budget.actual).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              percentage <= 80 ? 'bg-green-500' : percentage <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Budget vs Actual</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={Object.entries(budgets).map(([category, budget]) => ({
                    category,
                    planned: budget.planned,
                    actual: budget.actual
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="planned" fill="#E5E7EB" name="Planned" />
                    <Bar dataKey="actual" fill="#3B82F6" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Fixed Commitments</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span>Family Support</span>
                    </div>
                    <span className="font-bold">₹{familySupport.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Heart className="w-5 h-5 text-green-600" />
                      <span>Brother Support</span>
                    </div>
                    <span className="font-bold">₹{brotherSupport.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Target className="w-5 h-5 text-purple-600" />
                      <span>Emergency Fund</span>
                    </div>
                    <span className="font-bold">₹{emergencyFund.monthlyContribution.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'investments' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
                Add New Investment
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <input
                  type="text"
                  placeholder="Investment Name"
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({...newInvestment, name: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                />
                <select
                  value={newInvestment.type}
                  onChange={(e) => setNewInvestment({...newInvestment, type: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                >
                  <option value="SIP">SIP</option>
                  <option value="Lumpsum">Lumpsum</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Stocks">Stocks</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newInvestment.amount}
                  onChange={(e) => setNewInvestment({...newInvestment, amount: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                />
                <button
                  onClick={addInvestment}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors text-base min-h-12"
                >
                  Add Investment
                </button>
              </div>
            </div>

            {/* AI-Powered SIP Recommendations */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-xl text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center">
                  <Zap className="w-6 h-6 mr-2 text-yellow-300" />
                  AI-Recommended SIPs
                </h3>
                <button
                  onClick={getSIPRecommendations}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Refresh Recommendations
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sipRecommendations.slice(0, 6).map((fund, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">{fund.fundName}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="font-medium">{fund.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Returns:</span>
                        <span className="font-medium text-green-200">{fund.returns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Level:</span>
                        <span className={`font-medium ${
                          fund.risk === 'Low' ? 'text-green-200' : 
                          fund.risk === 'Medium' ? 'text-yellow-200' : 'text-red-200'
                        }`}>{fund.risk}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min SIP:</span>
                        <span className="font-medium">₹{fund.minSip}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {sipRecommendations.length === 0 && (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-white/50" />
                  <p className="text-white/80">Click "Refresh Recommendations" to get AI-powered SIP suggestions</p>
                </div>
              )}
            </div>

            {/* Market-based Investment Insights */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-500" />
                Market-Based Investment Insights
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-700 mb-2">📈 Market Opportunity</h4>
                    <p className="text-sm text-blue-600">
                      NIFTY 50 is {marketData.nifty50.changePercent >= 0 ? 'up' : 'down'} {Math.abs(marketData.nifty50.changePercent).toFixed(2)}% today. 
                      {marketData.nifty50.changePercent < -1 ? ' Great buying opportunity for SIP!' : 
                       marketData.nifty50.changePercent > 2 ? ' Consider booking some profits.' :
                       ' Perfect for regular SIP investments.'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-700 mb-2">₿ Crypto Alert</h4>
                    <p className="text-sm text-orange-600">
                      Bitcoin is {marketData.bitcoin.changePercent >= 0 ? 'up' : 'down'} {Math.abs(marketData.bitcoin.changePercent).toFixed(2)}%. 
                      {Math.abs(marketData.bitcoin.changePercent) > 5 ? ' High volatility - invest only 5% of portfolio.' :
                       ' Stable movement - good for small allocations.'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-700 mb-2">🏅 Gold Strategy</h4>
                    <p className="text-sm text-yellow-600">
                      Gold is {marketData.gold.changePercent >= 0 ? 'up' : 'down'} {Math.abs(marketData.gold.changePercent).toFixed(2)}%. 
                      Maintain 10% allocation for portfolio stability.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-700 mb-2">💡 AI Recommendation</h4>
                    <p className="text-sm text-green-600">
                      Based on your ₹{currentSavings.toLocaleString()} monthly savings, 
                      start with ₹{Math.min(2000, Math.floor(currentSavings * 0.3))} SIP in large-cap funds 
                      and ₹{Math.min(1000, Math.floor(currentSavings * 0.15))} in mid-cap funds.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-700 mb-2">🎯 Goal-Based Investing</h4>
                    <p className="text-sm text-purple-600">
                      For your ₹{goals.totalSavingsGoal.toLocaleString()} goal, 
                      invest ₹{Math.floor(goals.totalSavingsGoal / 60)} monthly in equity funds 
                      to achieve it in 5 years with 12% returns.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-semibold text-indigo-700 mb-2">⚖️ Portfolio Balance</h4>
                    <p className="text-sm text-indigo-600">
                      Recommended allocation: 60% Large-cap, 25% Mid-cap, 10% Gold, 5% International funds.
                      Current portfolio value: ₹{(totalInvestments + totalReturns).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Investment Portfolio</h3>
                <div className="space-y-4">
                  {investments.map(investment => (
                    <div key={investment.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{investment.name}</div>
                          <div className="text-sm text-gray-600">{investment.type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">₹{investment.amount.toLocaleString()}</div>
                          <div className={`text-sm ${investment.returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {investment.returns >= 0 ? '+' : ''}₹{investment.returns}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{investment.date}</div>
                    </div>
                  ))}
                  
                  {investments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No investments yet. Start your wealth-building journey!</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Investment Summary</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600">Total Invested</div>
                    <div className="text-2xl font-bold text-green-700">₹{totalInvestments.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600">Total Returns</div>
                    <div className="text-2xl font-bold text-blue-700">₹{totalReturns.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600">ROI</div>
                    <div className="text-2xl font-bold text-purple-700">
                      {totalInvestments > 0 ? ((totalReturns / totalInvestments) * 100).toFixed(2) : 0}%
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-sm text-orange-600">Portfolio Value</div>
                    <div className="text-2xl font-bold text-orange-700">₹{(totalInvestments + totalReturns).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-blue-500" />
                Financial Goals & Emergency Fund
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Monthly Savings Target (default goal) */}
                <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-700">Monthly Savings Target</h3>
                    <button
                      onClick={() => setEditingGoal(editingGoal === 'monthlySavingsTarget' ? null : 'monthlySavingsTarget')}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit target"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  {editingGoal === 'monthlySavingsTarget' ? (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          defaultValue={goals.monthlySavingsTarget}
                          placeholder="Monthly savings target"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateGoalValue('monthlySavingsTarget', (e.target as HTMLInputElement).value);
                            }
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            updateGoalValue('monthlySavingsTarget', input.value);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingGoal(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Target:</span>
                      <span className="font-bold">₹{goals.monthlySavingsTarget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Current:</span>
                      <span className="font-bold text-green-600">₹{currentSavings.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-4">
                      <div 
                        className="bg-blue-600 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                        style={{ width: `${Math.min(100, (currentSavings / goals.monthlySavingsTarget) * 100)}%` }}
                      >
                        <span className="text-xs text-white font-semibold">
                          {goals.monthlySavingsTarget > 0 ? Math.min(100, (currentSavings / goals.monthlySavingsTarget * 100)).toFixed(0) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {goals.monthlySavingsTarget > 0 ? (
                        currentSavings >= goals.monthlySavingsTarget ? 
                          "🎉 Goal achieved! Keep it up!" : 
                          `₹${(goals.monthlySavingsTarget - currentSavings).toLocaleString()} more to reach your goal`
                      ) : (
                        "Set your monthly savings target above"
                      )}
                    </div>
                  </div>
                </div>

                {/* Emergency Fund (default goal) */}
                <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-red-700">Emergency Fund</h3>
                    <button
                      onClick={() => setEditingGoal(editingGoal === 'emergencyFund' ? null : 'emergencyFund')}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Edit emergency fund"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  {editingGoal === 'emergencyFund' ? (
                    <div className="mb-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium w-20">Target:</label>
                        <input
                          type="number"
                          defaultValue={emergencyFund.target}
                          placeholder="Target amount"
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          id="emergency-target"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium w-20">Current:</label>
                        <input
                          type="number"
                          defaultValue={emergencyFund.current}
                          placeholder="Current amount"
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          id="emergency-current"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium w-20">Monthly:</label>
                        <input
                          type="number"
                          defaultValue={emergencyFund.monthlyContribution}
                          placeholder="Monthly contribution"
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          id="emergency-monthly"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const targetInput = document.getElementById('emergency-target') as HTMLInputElement;
                            const currentInput = document.getElementById('emergency-current') as HTMLInputElement;
                            const monthlyInput = document.getElementById('emergency-monthly') as HTMLInputElement;
                            updateEmergencyFundValue('target', targetInput.value);
                            updateEmergencyFundValue('current', currentInput.value);
                            updateEmergencyFundValue('monthlyContribution', monthlyInput.value);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Save All
                        </button>
                        <button
                          onClick={() => setEditingGoal(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Target:</span>
                      <span className="font-bold">₹{emergencyFund.target.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current:</span>
                      <span className="font-bold text-green-600">₹{emergencyFund.current.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-4">
                      <div 
                        className="bg-red-600 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                        style={{ width: `${emergencyFund.target > 0 ? (emergencyFund.current / emergencyFund.target) * 100 : 0}%` }}
                      >
                        <span className="text-xs text-white font-semibold">
                          {emergencyFund.target > 0 ? ((emergencyFund.current / emergencyFund.target) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Monthly contribution: ₹{emergencyFund.monthlyContribution.toLocaleString()}
                    </div>
                    {emergencyFund.target > 0 && emergencyFund.monthlyContribution > 0 && (
                      <div className="text-sm text-gray-600">
                        At current rate: {Math.ceil((emergencyFund.target - emergencyFund.current) / emergencyFund.monthlyContribution)} months to complete
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Goals Section */}
                <div className="col-span-1 lg:col-span-2">
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-blue-500" />
                      Custom Goals
                    </h3>
                    <form
                      className="flex flex-col sm:flex-row gap-2 mb-4"
                      onSubmit={e => {
                        e.preventDefault();
                        if (!newCustomGoalName || !newCustomGoalTarget) return;
                        setCustomGoals([...customGoals, {
                          id: Date.now(),
                          name: newCustomGoalName,
                          target: Number(newCustomGoalTarget),
                          current: 0
                        }]);
                        setNewCustomGoalName('');
                        setNewCustomGoalTarget('');
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Goal name (e.g., Buy a laptop)"
                        value={newCustomGoalName}
                        onChange={e => setNewCustomGoalName(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Target amount (₹)"
                        value={newCustomGoalTarget}
                        onChange={e => setNewCustomGoalTarget(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Add Goal
                      </button>
                    </form>
                    <div className="space-y-4">
                      {customGoals.length === 0 ? (
                        <div className="text-gray-500 text-center py-4">No custom goals yet. Add one above!</div>
                      ) : (
                        customGoals.map(goal => (
                          <div key={goal.id} className="p-4 border border-gray-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-blue-700">{goal.name}</div>
                              <div className="flex gap-4 text-sm mt-1">
                                <span>Target: <span className="font-semibold">₹{goal.target.toLocaleString()}</span></span>
                                <span>Current: <span className="font-semibold text-green-600">₹{goal.current.toLocaleString()}</span></span>
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2 sm:mt-0">
                              <button
                                onClick={() => setEditingCustomGoal(goal.id)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit goal"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setCustomGoals(customGoals.filter(g => g.id !== goal.id))}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete goal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {editingCustomGoal === goal.id && (
                              <div className="w-full flex flex-col sm:flex-row gap-2 mt-2">
                                <input
                                  type="text"
                                  value={editCustomGoalName}
                                  onChange={e => setEditCustomGoalName(e.target.value)}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Goal name"
                                />
                                <input
                                  type="number"
                                  value={editCustomGoalTarget}
                                  onChange={e => setEditCustomGoalTarget(e.target.value)}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Target amount"
                                />
                                <input
                                  type="number"
                                  value={editCustomGoalCurrent}
                                  onChange={e => setEditCustomGoalCurrent(e.target.value)}
                                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Current amount"
                                />
                                <button
                                  onClick={() => {
                                    setCustomGoals(customGoals.map(g => g.id === goal.id ? {
                                      ...g,
                                      name: editCustomGoalName,
                                      target: Number(editCustomGoalTarget),
                                      current: Number(editCustomGoalCurrent)
                                    } : g));
                                    setEditingCustomGoal(null);
                                  }}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCustomGoal(null)}
                                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                Achievement Center
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center p-4 sm:p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🔥</div>
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">{goals.currentStreak}</div>
                  <div className="text-xs sm:text-sm text-orange-600 font-medium">Day Streak</div>
                  <div className="text-xs text-gray-600 mt-1 sm:mt-2">Consistent savings</div>
                </div>
                
                <div className="text-center p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💰</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{savingsRate}%</div>
                  <div className="text-xs sm:text-sm text-green-600 font-medium">Savings Rate</div>
                  <div className="text-xs text-gray-600 mt-1 sm:mt-2">Above 20% is excellent!</div>
                </div>
                
                <div className="text-center p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
                  <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🎯</div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">₹{totalInvestments.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-purple-600 font-medium">Invested</div>
                  <div className="text-xs text-gray-600 mt-1 sm:mt-2">Building wealth</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-300" />
                Smart AI Recommendations
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                  <div className="font-medium mb-2">💡 Optimization Tip</div>
                  <div className="text-sm text-indigo-100">
                    {budgets.Food ? (
                      <>
                        Your food expenses are {((budgets.Food.actual / budgets.Food.planned) * 100).toFixed(0)}% of budget. 
                        {budgets.Food.actual > budgets.Food.planned * 0.8 ? 
                          " Consider meal prepping to save ₹1000-2000/month." : 
                          " Great control on food expenses!"}
                      </>
                    ) : (
                      "Add a 'Food' budget category to get personalized tips about your food expenses."
                    )}
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                  <div className="font-medium mb-2">🎯 Goal Progress</div>
                  <div className="text-sm text-indigo-100">
                    {currentSavings >= goals.monthlySavingsTarget ? 
                      "Excellent! You're exceeding your savings target. Consider increasing investments." :
                      `You need ₹${(goals.monthlySavingsTarget - currentSavings).toLocaleString()} more to hit your monthly target.`
                    }
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                  <div className="font-medium mb-2">🚨 Emergency Fund</div>
                  <div className="text-sm text-indigo-100">
                    {emergencyFund.current >= emergencyFund.target * 0.5 ? 
                      "Good progress on emergency fund! Keep contributing regularly." :
                      "Prioritize building your emergency fund. Aim for ₹2000-3000 monthly contributions."}
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur p-4 rounded-lg">
                  <div className="font-medium mb-2">📊 Investment Advice</div>
                  <div className="text-sm text-indigo-100">
                    {totalInvestments >= 5000 ? 
                      "Great investment habit! Consider diversifying across different fund categories." :
                      "Start your SIP journey with small amounts. Even ₹1000/month compounds significantly."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;