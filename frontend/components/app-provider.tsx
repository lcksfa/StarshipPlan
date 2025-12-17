'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUserStore } from '../store';
import { useTaskStore } from '../store/taskStore';
import { usePointsStore } from '../store/pointsStore';
import { storeManager, useAppInitialization } from '../store';
import { syncService } from '../lib/services/sync';
import { SyncEvent } from '../types/api';

interface AppContextType {
  isAppReady: boolean;
  syncEvents: SyncEvent[];
  lastSyncTime: Date | null;
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const { isAuthenticated, currentUser } = useUserStore();
  const { initializeApp, cleanupApp, isInitializing, initError } = useAppInitialization();

  const [isAppReady, setIsAppReady] = useState(false);
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初始状态检查
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 应用初始化
  useEffect(() => {
    const initialize = async () => {
      try {
        const userId = currentUser?.id;
        await initializeApp(userId);

        if (isAuthenticated && userId) {
          // 建立实时同步连接
          syncService.connectWebSocket(userId, (event: SyncEvent) => {
            console.log('收到实时同步事件:', event);
            setSyncEvents(prev => [event, ...prev.slice(0, 99)]); // 保留最近100个事件
            setLastSyncTime(new Date());

            // 处理不同类型的同步事件
            handleSyncEvent(event);
          });
        }

        setIsAppReady(true);
      } catch (error) {
        console.error('应用初始化失败:', error);
      }
    };

    if (!isInitializing && !initError) {
      initialize();
    }

    return () => {
      // 清理资源
      cleanupApp();
    };
  }, [isAuthenticated, currentUser, initializeApp, cleanupApp, isInitializing, initError]);

  // 处理实时同步事件
  const handleSyncEvent = (event: SyncEvent) => {
    const { fetchTasks, fetchTodayTasks, fetchWeeklyTasks } = useTaskStore.getState();
    const { fetchUserPoints, fetchLevelStats } = usePointsStore.getState();

    const userId = currentUser?.id;
    if (!userId) return;

    switch (event.type) {
      case 'TASK_CREATED':
      case 'TASK_UPDATED':
        fetchTasks();
        break;

      case 'TASK_COMPLETED':
        fetchTasks();
        fetchTodayTasks();
        fetchWeeklyTasks();
        fetchUserPoints(userId);
        break;

      case 'POINTS_CHANGED':
        fetchUserPoints(userId);
        break;

      case 'LEVEL_UP':
        fetchUserPoints(userId);
        fetchLevelStats(userId);
        break;

      default:
        console.log('未处理的同步事件类型:', event.type);
    }
  };

  const contextValue: AppContextType = {
    isAppReady,
    syncEvents,
    lastSyncTime,
    isOnline
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-white text-lg">正在初始化星舰计划...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">初始化失败</h2>
          <p className="text-gray-300 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook 用于访问 App Context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// 网络状态提示组件
export function NetworkStatus() {
  const { isOnline } = useApp();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
      <p className="text-sm">
        ⚠️ 网络连接已断开，部分功能可能无法正常使用
      </p>
    </div>
  );
}

// 同步状态组件
export function SyncStatus() {
  const { syncEvents, lastSyncTime } = useApp();

  const latestEvent = syncEvents[0];

  return (
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg max-w-xs">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${latestEvent ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <span className="text-sm font-medium">
          {latestEvent ? '同步中' : '已同步'}
        </span>
      </div>

      {lastSyncTime && (
        <p className="text-xs text-gray-600">
          最后同步: {lastSyncTime.toLocaleTimeString()}
        </p>
      )}

      {latestEvent && (
        <p className="text-xs text-gray-700 mt-1">
          {getEventDescription(latestEvent.type)}
        </p>
      )}
    </div>
  );
}

function getEventDescription(type: string): string {
  switch (type) {
    case 'TASK_CREATED':
      return '新任务已创建';
    case 'TASK_UPDATED':
      return '任务已更新';
    case 'TASK_COMPLETED':
      return '任务已完成';
    case 'POINTS_CHANGED':
      return '积分已更新';
    case 'LEVEL_UP':
      return '恭喜升级！';
    default:
      return '数据已同步';
  }
}