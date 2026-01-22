import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminApi } from "@/hooks/useAdminData";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAdminAuditLog, AdminAuditActions, AdminResourceTypes } from "@/services/adminAuditLog";

interface SecondContractOrder {
  id: string;
  user_id: string;
  symbol: string;
  duration: number;
  amount: number;
  entry_price: number;
  direction: string;
  status: string;
  result: string | null;
  admin_result: string | null;
  final_price: number | null;
  profit: number;
  yield_rate: number;
  created_at: string;
  settlement_time: string;
  settled_at: string | null;
  profiles?: { username: string; email: string };
}

export const AdminSecondContractControl = () => {
  const { admin } = useAdminAuth();
  const [orders, setOrders] = useState<SecondContractOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resultSettings, setResultSettings] = useState<Record<string, string>>({});
  const [globalControl, setGlobalControl] = useState<string>("none");
  const [isUpdatingGlobal, setIsUpdatingGlobal] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchGlobalControl();
    
    // 设置自动刷新 - 每5秒刷新一次待结算订单
    const refreshInterval = setInterval(() => {
      if (statusFilter === 'pending' || statusFilter === 'all') {
        fetchOrders();
      }
    }, 5000); // 5秒
    
    // 设置实时订单监听
    const channel = supabase
      .channel('second_contract_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'second_contract_orders',
        },
        (payload) => {
          console.log('Order change detected:', payload);
          fetchOrders(); // 有任何变化就刷新订单列表
        }
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const fetchOrders = async () => {
    const filters: Record<string, unknown> = {};
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }

    const { data: ordersData, error } = await adminApi.select<SecondContractOrder[]>('second_contract_orders', {
      filters,
      order: { column: 'created_at', ascending: false },
      limit: 500
    });

    if (error) {
      toast.error("加载订单数据失败");
      console.error(error);
      return;
    }

    // 获取用户资料
    const userIds = [...new Set(ordersData?.map(o => o.user_id) || [])];
    if (userIds.length > 0) {
      const { data: profilesData } = await adminApi.select<Array<{ id: string; username: string; email: string }>>('profiles', {
        select: 'id, username, email',
        filters: { id: { in: userIds } }
      });

      const mergedData = ordersData?.map(order => ({
        ...order,
        profiles: profilesData?.find(p => p.id === order.user_id) || { username: 'Unknown', email: '' }
      })) || [];

      setOrders(mergedData);
    } else {
      setOrders(ordersData || []);
    }
  };

  const fetchGlobalControl = async () => {
    const { data, error } = await adminApi.select<Array<{ config_value: { mode?: string } }>>('system_configs', {
      select: 'config_value',
      filters: { config_key: 'second_contract_global_control' },
      limit: 1
    });

    if (!error && data && data.length > 0 && data[0].config_value) {
      setGlobalControl(data[0].config_value.mode || 'none');
    }
  };

  const handleUpdateGlobalControl = async () => {
    setIsUpdatingGlobal(true);
    try {
      const { error } = await adminApi.upsert('system_configs', {
        config_key: 'second_contract_global_control',
        config_value: { mode: globalControl },
        description: '时间合约全局输赢控制'
      });

      if (error) throw error;

      if (admin) {
        await createAdminAuditLog({
          adminId: admin.id,
          adminUsername: admin.username,
          action: AdminAuditActions.CONFIG_UPDATE,
          resourceType: AdminResourceTypes.SYSTEM_CONFIG,
          resourceId: 'second_contract_global_control',
          details: {
            mode: globalControl,
            description: globalControl === 'none' ? '不控制，按真实市场结果' :
                        globalControl === 'win' ? '全局设为赢（所有用户盈利）' :
                        '全局设为输（所有用户亏损）'
          }
        });
      }

      toast.success("全局控制已更新", {
        description: globalControl === 'none' ? '已恢复按真实市场结果结算' :
                    globalControl === 'win' ? '已设置为全局赢' :
                    '已设置为全局输'
      });
    } catch (error) {
      console.error(error);
      toast.error("更新失败");
    } finally {
      setIsUpdatingGlobal(false);
    }
  };

  const handleSetResult = async (orderId: string, adminResult: 'win' | 'lose' | 'real') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // 管理员只是"预设"结果，不立即结算
    // 计算预期的最终价格和盈亏（用于显示）
    let estimatedFinalPrice = order.entry_price;
    let estimatedProfit = 0;

    if (adminResult === 'real') {
      // 真实结果将在结算时根据市场价格计算
      estimatedFinalPrice = order.entry_price;
      estimatedProfit = 0; // 无法预估
    } else {
      // 管理员预设结果
      if (adminResult === 'win') {
        estimatedProfit = Number(order.amount) * order.yield_rate;
        estimatedFinalPrice = order.direction === 'up' ? order.entry_price + 50 : order.entry_price - 50;
      } else {
        estimatedProfit = -Number(order.amount);
        estimatedFinalPrice = order.direction === 'up' ? order.entry_price - 50 : order.entry_price + 50;
      }
    }

    // 只保存管理员的结果设置，不改变订单状态为 settled
    const { error: orderError } = await adminApi.update('second_contract_orders', {
      admin_result: adminResult,
      // 保存预估值供显示用
      final_price: adminResult === 'real' ? null : estimatedFinalPrice,
      profit: adminResult === 'real' ? 0 : estimatedProfit
    }, { id: orderId });

    if (orderError) {
      toast.error("设置结果失败");
      console.error(orderError);
      return;
    }

    // 记录管理员审计日志
    if (admin) {
      await createAdminAuditLog({
        adminId: admin.id,
        adminUsername: admin.username,
        action: AdminAuditActions.CONTRACT_RESULT_SET,
        resourceType: AdminResourceTypes.SECOND_CONTRACT_ORDER,
        resourceId: orderId,
        details: {
          user_id: order.user_id,
          username: order.profiles?.username,
          symbol: order.symbol,
          admin_result: adminResult,
          settlement_time: order.settlement_time,
          amount: order.amount,
          direction: order.direction
        }
      });
    }

    const settlementTime = new Date(order.settlement_time);
    const now = new Date();
    const timeRemaining = Math.max(0, Math.floor((settlementTime.getTime() - now.getTime()) / 1000));
    
    toast.success("结果已预设", {
      description: `将在 ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')} 后自动结算`
    });

    setResultSettings(prev => ({ ...prev, [orderId]: "" }));
    fetchOrders();
  };

  const filteredOrders = orders.filter(order => {
    const search = searchTerm.toLowerCase();
    return (
      order.symbol.toLowerCase().includes(search) ||
      order.profiles?.username.toLowerCase().includes(search)
    );
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const settledOrders = orders.filter(o => o.status === 'settled').length;
  const upOrders = orders.filter(o => o.direction === 'up').length;
  const downOrders = orders.filter(o => o.direction === 'down').length;
  const totalAmount = orders.reduce((sum, o) => sum + Number(o.amount), 0);

  const getTimeRemaining = (settlementTime: string) => {
    const now = new Date();
    const settlement = new Date(settlementTime);
    const diff = Math.floor((settlement.getTime() - now.getTime()) / 1000);
    if (diff <= 0) return "已到期";
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* 全局控制卡片 */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">全局输赢控制</CardTitle>
          <p className="text-sm text-muted-foreground">
            设定后将对所有未单独设置的时间合约订单生效。单个订单的手动设置优先级更高。
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={globalControl} onValueChange={setGlobalControl}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不控制（按真实市场结果）</SelectItem>
                <SelectItem value="win">全局赢（所有用户盈利）</SelectItem>
                <SelectItem value="lose">全局输（所有用户亏损）</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleUpdateGlobalControl}
              disabled={isUpdatingGlobal}
              className="min-w-24"
            >
              {isUpdatingGlobal ? "更新中..." : "应用设置"}
            </Button>
          </div>
          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
            <div className="font-medium mb-1">当前状态：</div>
            <div className={
              globalControl === 'win' ? 'text-green-600' :
              globalControl === 'lose' ? 'text-red-600' :
              'text-blue-600'
            }>
              {globalControl === 'none' && '✓ 不控制，按真实市场价格结算'}
              {globalControl === 'win' && '⚠️ 全局赢 - 未单独设置的订单都将盈利'}
              {globalControl === 'lose' && '⚠️ 全局输 - 未单独设置的订单都将亏损'}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              注意：单个订单的手动设置优先级更高，可以覆盖全局设置
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>订单统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">总订单数</div>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">待结算</div>
              <div className="text-2xl font-bold text-orange-600">{pendingOrders}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">已结算</div>
              <div className="text-2xl font-bold text-blue-600">{settledOrders}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">看涨/看跌</div>
              <div className="text-2xl font-bold">
                <span className="text-green-600">{upOrders}</span>/
                <span className="text-red-600">{downOrders}</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">订单总额</div>
              <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索交易对或用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">全部订单</TabsTrigger>
              <TabsTrigger value="pending">进行中</TabsTrigger>
              <TabsTrigger value="settled">已完成</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {filteredOrders.map((order) => (
              <div key={order.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {order.direction === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">{order.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.profiles?.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.direction === 'up' ? 'default' : 'secondary'}>
                      {order.direction === 'up' ? '看涨' : '看跌'}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {getTimeRemaining(order.settlement_time)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">开仓价</div>
                    <div className="font-medium">${Number(order.entry_price).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">投注金额</div>
                    <div className="font-medium">${Number(order.amount).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">收益率</div>
                    <div className="font-medium text-green-600">{(order.yield_rate * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">预期盈利</div>
                    <div className="font-medium">${(Number(order.amount) * order.yield_rate).toFixed(2)}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === 'pending' ? (
                    <>
                      <Select
                        value={resultSettings[order.id] || ""}
                        onValueChange={(value) => setResultSettings(prev => ({ ...prev, [order.id]: value }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="选择结果..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="win">赢（用户盈利）</SelectItem>
                          <SelectItem value="lose">输（用户亏损）</SelectItem>
                          <SelectItem value="real">真实结果（根据市场）</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          const result = resultSettings[order.id] as 'win' | 'lose' | 'real';
                          if (!result) {
                            toast.error("请选择结果");
                            return;
                          }
                          handleSetResult(order.id, result);
                        }}
                        disabled={!resultSettings[order.id]}
                      >
                        确定结果
                      </Button>
                    </>
                  ) : (
                    <div className="flex-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant={order.result === 'win' ? 'default' : 'secondary'}>
                            {order.result === 'win' ? '✓ 赢' : '✗ 输'}
                          </Badge>
                          {order.admin_result && (
                            <Badge variant="outline" className="ml-2">
                              {order.admin_result === 'real' ? '真实结果' : 
                               order.admin_result === 'win' ? '管理员设为赢' : '管理员设为输'}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">最终盈亏</div>
                          <div className={`font-bold ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {order.profit >= 0 ? '+' : ''}{Number(order.profit).toFixed(2)} USDT
                          </div>
                        </div>
                      </div>
                      {order.final_price && (
                        <div className="text-xs text-muted-foreground mt-2">
                          结算价: ${Number(order.final_price).toFixed(2)} | 
                          结算时间: {new Date(order.settled_at || '').toLocaleString('zh-CN')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground border-t pt-2">
                  创建时间: {new Date(order.created_at).toLocaleString('zh-CN')} | 
                  结算时间: {new Date(order.settlement_time).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}

                {filteredOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无订单
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-3 mt-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {order.direction === 'up' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">{order.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.profiles?.username}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={order.direction === 'up' ? 'default' : 'secondary'}>
                          {order.direction === 'up' ? '看涨' : '看跌'}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeRemaining(order.settlement_time)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">开仓价</div>
                        <div className="font-medium">${Number(order.entry_price).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">投注金额</div>
                        <div className="font-medium">${Number(order.amount).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">收益率</div>
                        <div className="font-medium text-green-600">{(order.yield_rate * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">预期盈利</div>
                        <div className="font-medium">${(Number(order.amount) * order.yield_rate).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'pending' ? (
                        <>
                          <select
                            value={resultSettings[order.id] || ""}
                            onChange={(e) => setResultSettings(prev => ({ ...prev, [order.id]: e.target.value }))}
                            className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">选择结果...</option>
                            <option value="win">赢（用户盈利）</option>
                            <option value="lose">输（用户亏损）</option>
                            <option value="real">真实结果（根据市场）</option>
                          </select>
                          <Button
                            onClick={() => {
                              const result = resultSettings[order.id] as 'win' | 'lose' | 'real';
                              if (!result) {
                                toast.error("请选择结果");
                                return;
                              }
                              handleSetResult(order.id, result);
                            }}
                            disabled={!resultSettings[order.id]}
                          >
                            确定结果
                          </Button>
                        </>
                      ) : null}
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      创建时间: {new Date(order.created_at).toLocaleString('zh-CN')} | 
                      结算时间: {new Date(order.settlement_time).toLocaleString('zh-CN')}
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无进行中订单
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settled" className="space-y-3 mt-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {order.direction === 'up' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <div className="font-medium">{order.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.profiles?.username}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={order.direction === 'up' ? 'default' : 'secondary'}>
                          {order.direction === 'up' ? '看涨' : '看跌'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">开仓价</div>
                        <div className="font-medium">${Number(order.entry_price).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">投注金额</div>
                        <div className="font-medium">${Number(order.amount).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">收益率</div>
                        <div className="font-medium text-green-600">{(order.yield_rate * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">预期盈利</div>
                        <div className="font-medium">${(Number(order.amount) * order.yield_rate).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex-1 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant={order.result === 'win' ? 'default' : 'secondary'}>
                            {order.result === 'win' ? '✓ 赢' : '✗ 输'}
                          </Badge>
                          {order.admin_result && (
                            <Badge variant="outline" className="ml-2">
                              {order.admin_result === 'real' ? '真实结果' : 
                               order.admin_result === 'win' ? '管理员设为赢' : '管理员设为输'}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">最终盈亏</div>
                          <div className={`font-bold ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {order.profit >= 0 ? '+' : ''}{Number(order.profit).toFixed(2)} USDT
                          </div>
                        </div>
                      </div>
                      {order.final_price && (
                        <div className="text-xs text-muted-foreground mt-2">
                          结算价: ${Number(order.final_price).toFixed(2)} | 
                          结算时间: {new Date(order.settled_at || '').toLocaleString('zh-CN')}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      创建时间: {new Date(order.created_at).toLocaleString('zh-CN')} | 
                      结算时间: {new Date(order.settlement_time).toLocaleString('zh-CN')}
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无已完成订单
                  </div>
                )}
              </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};