import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, TrendingUp, Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface StockSymbol {
  id: string;
  symbol: string;
  name: string;
  market: string;
  sector: string | null;
  is_active: boolean;
  created_at: string;
}

interface StockOrder {
  id: string;
  user_id: string;
  symbol: string;
  side: string;
  order_type: string;
  quantity: number;
  price: number | null;
  status: string;
  filled_quantity: number | null;
  avg_fill_price: number | null;
  created_at: string;
}

interface StockPosition {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_cost: number;
  market_value: number | null;
  unrealized_pnl: number | null;
  realized_pnl: number | null;
}

export const AdminStockManager = () => {
  const [symbols, setSymbols] = useState<StockSymbol[]>([]);
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddSymbol, setShowAddSymbol] = useState(false);
  const [newSymbol, setNewSymbol] = useState({ symbol: "", name: "", market: "US", sector: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [symbolsRes, ordersRes, positionsRes] = await Promise.all([
        adminApi.select<StockSymbol[]>('stock_symbols', { order: { column: 'symbol', ascending: true } }),
        adminApi.select<StockOrder[]>('stock_orders', { order: { column: 'created_at', ascending: false }, limit: 100 }),
        adminApi.select<StockPosition[]>('stock_positions', { order: { column: 'symbol', ascending: true } }),
      ]);

      if (symbolsRes.error) throw new Error(symbolsRes.error);
      if (ordersRes.error) throw new Error(ordersRes.error);
      if (positionsRes.error) throw new Error(positionsRes.error);

      setSymbols(symbolsRes.data || []);
      setOrders(ordersRes.data || []);
      setPositions(positionsRes.data || []);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('获取股票数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSymbol = async () => {
    try {
      const { error } = await adminApi.insert('stock_symbols', {
        symbol: newSymbol.symbol.toUpperCase(),
        name: newSymbol.name,
        market: newSymbol.market,
        sector: newSymbol.sector || null,
      });

      if (error) throw new Error(error);
      toast.success('股票代码添加成功');
      setShowAddSymbol(false);
      setNewSymbol({ symbol: "", name: "", market: "US", sector: "" });
      fetchData();
    } catch (error) {
      console.error('Error adding symbol:', error);
      toast.error('添加股票代码失败');
    }
  };

  const handleToggleSymbol = async (id: string, isActive: boolean) => {
    try {
      const { error } = await adminApi.update('stock_symbols', { is_active: !isActive }, { id });

      if (error) throw new Error(error);
      toast.success(isActive ? '已禁用' : '已启用');
      fetchData();
    } catch (error) {
      console.error('Error toggling symbol:', error);
      toast.error('操作失败');
    }
  };

  const handleDeleteSymbol = async (id: string) => {
    if (!confirm('确定要删除这个股票代码吗？')) return;
    try {
      const { error } = await adminApi.delete('stock_symbols', { id });
      if (error) throw new Error(error);
      toast.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Error deleting symbol:', error);
      toast.error('删除失败');
    }
  };

  const handleUpdateOrder = async (id: string, status: string) => {
    try {
      const { error } = await adminApi.update('stock_orders', { status }, { id });

      if (error) throw new Error(error);
      toast.success('订单状态已更新');
      fetchData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('更新失败');
    }
  };

  const filteredSymbols = symbols.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500",
      filled: "bg-green-500/10 text-green-500",
      cancelled: "bg-gray-500/10 text-gray-500",
      rejected: "bg-red-500/10 text-red-500",
    };
    return <Badge className={styles[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="symbols">
        <TabsList>
          <TabsTrigger value="symbols">股票代码</TabsTrigger>
          <TabsTrigger value="orders">交易订单</TabsTrigger>
          <TabsTrigger value="positions">持仓管理</TabsTrigger>
        </TabsList>

        <TabsContent value="symbols" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    股票代码管理
                  </CardTitle>
                  <CardDescription>管理可交易的股票代码</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="搜索股票..." 
                      className="pl-9 w-48"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={showAddSymbol} onOpenChange={setShowAddSymbol}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" />添加</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加股票代码</DialogTitle>
                        <DialogDescription>添加新的可交易股票</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input 
                          placeholder="股票代码 (如 AAPL)" 
                          value={newSymbol.symbol}
                          onChange={(e) => setNewSymbol({...newSymbol, symbol: e.target.value})}
                        />
                        <Input 
                          placeholder="公司名称" 
                          value={newSymbol.name}
                          onChange={(e) => setNewSymbol({...newSymbol, name: e.target.value})}
                        />
                        <Input 
                          placeholder="市场 (如 US, HK)" 
                          value={newSymbol.market}
                          onChange={(e) => setNewSymbol({...newSymbol, market: e.target.value})}
                        />
                        <Input 
                          placeholder="行业板块 (可选)" 
                          value={newSymbol.sector}
                          onChange={(e) => setNewSymbol({...newSymbol, sector: e.target.value})}
                        />
                        <Button onClick={handleAddSymbol} className="w-full">添加</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>代码</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>市场</TableHead>
                    <TableHead>板块</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSymbols.map((symbol) => (
                    <TableRow key={symbol.id}>
                      <TableCell className="font-mono font-bold">{symbol.symbol}</TableCell>
                      <TableCell>{symbol.name}</TableCell>
                      <TableCell>{symbol.market}</TableCell>
                      <TableCell>{symbol.sector || '-'}</TableCell>
                      <TableCell>
                        <Badge className={symbol.is_active ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}>
                          {symbol.is_active ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleToggleSymbol(symbol.id, symbol.is_active)}
                          >
                            {symbol.is_active ? '禁用' : '启用'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteSymbol(symbol.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>股票订单管理</CardTitle>
                  <CardDescription>管理所有股票交易订单</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户ID</TableHead>
                    <TableHead>股票</TableHead>
                    <TableHead>方向</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.user_id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-bold">{order.symbol}</TableCell>
                      <TableCell>
                        <Badge className={order.side === 'buy' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                          {order.side === 'buy' ? '买入' : '卖出'}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.order_type}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>${order.price?.toFixed(2) || '-'}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-xs">{format(new Date(order.created_at), 'MM-dd HH:mm')}</TableCell>
                      <TableCell>
                        {order.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleUpdateOrder(order.id, 'filled')}>
                              成交
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateOrder(order.id, 'cancelled')}>
                              取消
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>持仓管理</CardTitle>
                  <CardDescription>查看所有用户的股票持仓</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户ID</TableHead>
                    <TableHead>股票</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>均价</TableHead>
                    <TableHead>市值</TableHead>
                    <TableHead>未实现盈亏</TableHead>
                    <TableHead>已实现盈亏</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell className="font-mono text-xs">{pos.user_id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-bold">{pos.symbol}</TableCell>
                      <TableCell>{pos.quantity}</TableCell>
                      <TableCell>${pos.avg_cost.toFixed(2)}</TableCell>
                      <TableCell>${pos.market_value?.toFixed(2) || '-'}</TableCell>
                      <TableCell className={pos.unrealized_pnl && pos.unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"}>
                        ${pos.unrealized_pnl?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className={pos.realized_pnl && pos.realized_pnl >= 0 ? "text-green-500" : "text-red-500"}>
                        ${pos.realized_pnl?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
