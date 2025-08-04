// MongoDB service for syncing financial tracker data
import type { Expense, Investment, Budget, EmergencyFund, Goals, PrivacySettings, CustomGoal, UserProfile } from '../types';

interface MongoData {
  expenses: Expense[];
  investments: Investment[];
  budgets: Record<string, Budget>;
  emergencyFund: EmergencyFund;
  goals: Goals;
  customGoals: CustomGoal[];
  privacySettings: PrivacySettings;
  userProfile: UserProfile;
  lastUpdated: string;
  userId: string;
}

class MongoService {
  // Auto-detect API URL based on environment
  private readonly API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api'  // Development
    : 'https://tracker-backend-fe9v.onrender.com'; // Production - UPDATE THIS after Railway deployment
  
  private readonly HEALTH_ENDPOINT = `${this.API_BASE_URL}/health`;
  private readonly MONGO_ENDPOINT = `${this.API_BASE_URL}/mongo`;

  private getUserId(): string {
    // Generate a unique user ID based on browser fingerprint or use a stored one
    let userId = localStorage.getItem('tracker_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tracker_user_id', userId);
    }
    return userId;
  }

  // Check if backend server is running
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.HEALTH_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend server is healthy:', data.message);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Backend server health check failed:', error);
      return false;
    }
  }

  // Make request to your backend server
  private async makeMongoRequest(action: string, filter: any, data?: any) {
    try {
      const response = await fetch(this.MONGO_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          filter,
          data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend request failed: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Backend request failed:', error);
      throw error;
    }
  }

  async syncDataToMongo(data: Partial<MongoData>): Promise<boolean> {
    try {
      // Check if server is available
      const isServerHealthy = await this.checkServerHealth();
      if (!isServerHealthy) {
        console.error('❌ Backend server not available - cannot sync to cloud');
        throw new Error('Backend server not available');
      }

      const userId = this.getUserId();
      const syncData: MongoData = {
        ...data,
        lastUpdated: new Date().toISOString(),
        userId
      } as MongoData;

      console.log('🔄 Syncing data to MongoDB cloud...', {
        userId,
        dataKeys: Object.keys(data),
        timestamp: syncData.lastUpdated
      });

      // Sync to MongoDB via backend (primary storage)
      const result = await this.makeMongoRequest('upsert', { userId }, syncData);
      
      if (result.success) {
        console.log('✅ Data synced to MongoDB cloud successfully');
        localStorage.setItem('last_mongo_sync', new Date().toISOString());
        // Only store minimal sync status, not the actual data
        localStorage.setItem('sync_status', JSON.stringify({
          lastSync: new Date().toISOString(),
          status: 'success'
        }));
        return true;
      } else {
        throw new Error('Cloud sync operation failed');
      }
    } catch (error) {
      console.error('❌ MongoDB cloud sync failed:', error);
      localStorage.setItem('sync_status', JSON.stringify({
        lastSync: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }

  async loadDataFromMongo(): Promise<MongoData | null> {
    try {
      const userId = this.getUserId();
      console.log('📥 Loading data from MongoDB cloud...');

      // Check if server is available
      const isServerHealthy = await this.checkServerHealth();
      if (!isServerHealthy) {
        console.error('❌ Backend server not available - cannot load from cloud');
        throw new Error('Backend server not available');
      }

      // Load from MongoDB via backend (primary source)
      const result = await this.makeMongoRequest('findOne', { userId });
      
      if (result.success && result.data) {
        console.log('✅ Data loaded from MongoDB cloud successfully');
        localStorage.setItem('last_mongo_load', new Date().toISOString());
        localStorage.setItem('sync_status', JSON.stringify({
          lastLoad: new Date().toISOString(),
          status: 'success'
        }));
        return result.data as MongoData;
      } else {
        console.log('ℹ️ No data found in MongoDB cloud for user:', userId);
        return null;
      }
    } catch (error) {
      console.error('❌ Data load from cloud failed:', error);
      localStorage.setItem('sync_status', JSON.stringify({
        lastLoad: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw error;
    }
  }

  async deleteUserData(): Promise<boolean> {
    try {
      const userId = this.getUserId();
      console.log('🗑️ Deleting user data from cloud...');

      // Check if server is available
      const isServerHealthy = await this.checkServerHealth();
      if (!isServerHealthy) {
        console.error('❌ Backend server not available - cannot delete from cloud');
        throw new Error('Backend server not available');
      }

      // Delete from MongoDB via backend
      const result = await this.makeMongoRequest('deleteOne', { userId });
      
      if (result.success) {
        console.log('✅ User data deleted from MongoDB cloud successfully');
        // Clear sync status
        localStorage.removeItem('last_mongo_sync');
        localStorage.removeItem('last_mongo_load');
        localStorage.removeItem('sync_status');
        return true;
      } else {
        throw new Error('Failed to delete data from cloud');
      }
    } catch (error) {
      console.error('❌ Data deletion from cloud failed:', error);
      throw error;
    }
  }

  // Check if MongoDB sync is available
  async isMongoAvailable(): Promise<boolean> {
    try {
      return await this.checkServerHealth();
    } catch (error) {
      return false;
    }
  }

  // Get sync status
  getSyncStatus(): {
    lastSync: string | null;
    lastLoad: string | null;
    isAvailable: boolean;
    hasCloudData: boolean;
  } {
    const syncStatus = localStorage.getItem('sync_status');
    let parsedStatus = null;
    
    try {
      parsedStatus = syncStatus ? JSON.parse(syncStatus) : null;
    } catch (error) {
      console.error('Error parsing sync status:', error);
    }

    return {
      lastSync: localStorage.getItem('last_mongo_sync'),
      lastLoad: localStorage.getItem('last_mongo_load'),
      isAvailable: true, // Will check async in component
      hasCloudData: parsedStatus?.status === 'success'
    };
  }

  // Auto-sync function for regular data backup
  async autoSync(data: Partial<MongoData>): Promise<void> {
    const lastSync = localStorage.getItem('last_mongo_sync');
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Auto-sync every 5 minutes or when data changes significantly
    if (!lastSync || (now - new Date(lastSync).getTime()) > fiveMinutes) {
      console.log('🔄 Auto-sync to cloud triggered');
      try {
        await this.syncDataToMongo(data);
      } catch (error) {
        console.error('❌ Auto-sync failed:', error);
      }
    }
  }

  // Initialize user data in cloud (for first-time users)
  async initializeUserData(userData: Partial<MongoData>): Promise<boolean> {
    try {
      const userId = this.getUserId();
      
      // Set default values
      const defaultData: MongoData = {
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
        },
        ...userData,
        lastUpdated: new Date().toISOString(),
        userId
      };

      console.log('🚀 Initializing user data in cloud...');
      return await this.syncDataToMongo(defaultData);
    } catch (error) {
      console.error('❌ Failed to initialize user data:', error);
      return false;
    }
  }
}

export const mongoService = new MongoService();
