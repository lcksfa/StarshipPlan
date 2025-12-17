'use client';

import React, { useState } from 'react';
import { useSync } from '../hooks/useSync';
import { ConflictItem } from '../lib/storage/syncManager';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';
import {
  Wifi,
  WifiOff,
  Sync,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  Database,
} from 'lucide-react';

interface SyncStatusProps {
  className?: string;
  showDetailedStats?: boolean;
}

export function SyncStatus({ className, showDetailedStats = false }: SyncStatusProps) {
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingSyncCount,
    conflicts,
    syncProgress,
    error,
    forceSync,
    resolveConflict,
    clearConflicts,
    getOfflineStats,
  } = useSync({
    autoSync: true,
    syncInterval: 30000,
    enableOffline: true,
  });

  const [offlineStats, setOfflineStats] = useState<any>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [conflictResolution, setConflictResolution] = useState<'local' | 'remote' | 'merge'>('local');
  const [mergeData, setMergeData] = useState('');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  // 加载离线统计
  const loadOfflineStats = async () => {
    try {
      const stats = await getOfflineStats();
      setOfflineStats(stats);
    } catch (error) {
      console.error('获取离线统计失败:', error);
    }
  };

  // 处理强制同步
  const handleForceSync = async () => {
    try {
      setLoading(true);
      const result = await forceSync();

      toast({
        title: '同步完成',
        description: `成功同步 ${result.synced} 项，失败 ${result.failed} 项`,
      });

      if (result.conflicts.length > 0) {
        toast({
          title: '发现冲突',
          description: `${result.conflicts.length} 个数据冲突需要解决`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '同步失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理解决冲突
  const handleResolveConflict = async () => {
    if (!selectedConflict) return;

    try {
      setLoading(true);
      const resolvedData = conflictResolution === 'merge' ? JSON.parse(mergeData) : undefined;

      await resolveConflict(selectedConflict.id, conflictResolution, resolvedData);

      toast({
        title: '冲突已解决',
        description: '数据冲突已成功解决',
      });

      setConflictDialogOpen(false);
      setSelectedConflict(null);
      setMergeData('');
      setConflictResolution('local');
    } catch (error) {
      toast({
        title: '解决冲突失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理清除所有冲突
  const handleClearConflicts = async () => {
    try {
      setLoading(true);
      await clearConflicts();

      toast({
        title: '冲突已清除',
        description: '所有数据冲突已使用本地数据解决',
      });
    } catch (error) {
      toast({
        title: '清除冲突失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return '从未同步';

    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} 小时前`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} 天前`;
  };

  const formatCacheSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={className}>
      {/* 基础同步状态 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <CardTitle className="text-sm">数据同步</CardTitle>
            </div>

            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? '在线' : '离线'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 同步进度 */}
          <div className="flex items-center space-x-2">
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">正在同步...</span>
                <Progress
                  value={syncProgress.percentage}
                  className="flex-1 h-2"
                />
                <span className="text-xs text-muted-foreground">
                  {syncProgress.completed}/{syncProgress.total}
                </span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">同步完成</span>
                <div className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {formatLastSyncTime()}
                </span>
              </>
            )}
          </div>

          {/* 状态指示器 */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <Database className="h-3 w-3" />
              <span>待同步: {pendingSyncCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3" />
              <span>冲突: {conflicts.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>缓存: {offlineStats ? formatCacheSize(offlineStats.cacheSize) : '--'}</span>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceSync}
              disabled={loading || isSyncing || !isOnline}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              立即同步
            </Button>

            {conflicts.length > 0 && (
              <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    解决冲突 ({conflicts.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>解决数据冲突</DialogTitle>
                    <DialogDescription>
                      发现 {conflicts.length} 个数据冲突，需要手动解决
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* 冲突列表 */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {conflicts.map((conflict) => (
                        <Card
                          key={conflict.id}
                          className={`cursor-pointer transition-colors ${
                            selectedConflict?.id === conflict.id ? 'border-primary' : ''
                          }`}
                          onClick={() => setSelectedConflict(conflict)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{conflict.type}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(conflict.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <Badge variant="outline">未解决</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* 冲突解决选项 */}
                    {selectedConflict && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* 本地数据 */}
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">本地数据</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(selectedConflict.localData, null, 2)}
                              </pre>
                            </CardContent>
                          </Card>

                          {/* 远程数据 */}
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">远程数据</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(selectedConflict.remoteData, null, 2)}
                              </pre>
                            </CardContent>
                          </Card>
                        </div>

                        {/* 解决方案选择 */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">解决方案</label>
                          <Select
                            value={conflictResolution}
                            onValueChange={(value: 'local' | 'remote' | 'merge') => {
                              setConflictResolution(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="local">使用本地数据</SelectItem>
                              <SelectItem value="remote">使用远程数据</SelectItem>
                              <SelectItem value="merge">合并数据</SelectItem>
                            </SelectContent>
                          </Select>

                          {conflictResolution === 'merge' && (
                            <Textarea
                              placeholder="输入合并后的 JSON 数据"
                              value={mergeData}
                              onChange={(e) => setMergeData(e.target.value)}
                              rows={4}
                            />
                          )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleResolveConflict}
                            disabled={loading}
                            className="flex-1"
                          >
                            {loading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : null}
                            解决此冲突
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedConflict(null)}
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 批量操作 */}
                    {conflicts.length > 1 && !selectedConflict && (
                      <div className="flex space-x-2">
                        <Button
                          variant="destructive"
                          onClick={handleClearConflicts}
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : null}
                          全部使用本地数据
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {showDetailedStats && (
              <Button
                size="sm"
                variant="outline"
                onClick={loadOfflineStats}
              >
                详细统计
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 详细统计 */}
      {showDetailedStats && offlineStats && (
        <Card className="mt-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">离线统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">待同步请求</p>
                <p className="font-medium">{offlineStats.pendingRequests}</p>
              </div>
              <div>
                <p className="text-muted-foreground">缓存大小</p>
                <p className="font-medium">{formatCacheSize(offlineStats.cacheSize)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">缓存项目</p>
                <p className="font-medium">{offlineStats.cachedItems}</p>
              </div>
              <div>
                <p className="text-muted-foreground">网络状态</p>
                <p className="font-medium">{isOnline ? '在线' : '离线'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}