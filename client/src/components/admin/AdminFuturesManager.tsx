import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Zap, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface FuturesContract {
  id: string;
  symbol: string;
  name: string;
  underlying: string;
  contract_size: number;
  tick_size: number;
  max_leverage: number;
  maintenance_margin: number;
  is_perpetual: boolean;
  is_active: boolean;
  expiry_date: string | null;
  created_at: string;
}

interface FuturesOrder {
  id: string;
  user_id: string;
  symbol: string;
  side: string;
  position_side: string;
  order_type: string;
  quantity: number;
  price: number | null;
  leverage: number;
  status: string;
  filled_quantity: number | null;
  created_at: string;
}

interface FuturesPosition {
  id: string;
  user_id: string;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  mark_price: number | null;
  leverage: number;
  margin: number;
  liquidation_price: number | null;
  unrealized_pnl: number | null;
  realized_pnl: number | null;
  status: string;
}

export const AdminFuturesManager = () => {
  const [contracts, setContracts] = useState<FuturesContract[]>([]);
  const [orders, setOrders] = useState<FuturesOrder[]>([]);
  const [positions, setPositions] = useState<FuturesPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddContract, setShowAddContract] = useState(false);
  const [newContract, setNewContract] = useState({
    symbol: "",
    name: "",
    underlying: "",
    contract_size: 1,
    tick_size: 0.01,
    max_leverage: 100,
    maintenance_margin: 0.5,
    is_perpetual: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsRes, ordersRes, positionsRes] = await Promise.all([
        adminApi.select<FuturesContract[]>('futures_contracts', { order: { column: 'symbol', ascending: true } }),
        adminApi.select<FuturesOrder[]>('futures_orders', { order: { column: 'created_at', ascending: false }, limit: 100 }),
        adminApi.select<FuturesPosition[]>('futures_positions', { order: { column: 'created_at', ascending: false } }),
      ]);

      if (contractsRes.error) throw new Error(contractsRes.error);
      if (ordersRes.error) throw new Error(ordersRes.error);
      if (positionsRes.error) throw new Error(positionsRes.error);

      setContracts(contractsRes.data || []);
      setOrders(ordersRes.data || []);
      setPositions(positionsRes.data || []);
    } catch (error) {
      console.error('Error fetching futures data:', error);
      toast.error('获取期货数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddContract = async () => {
    try {
      const { error } = await adminApi.insert('futures_contracts', {
        symbol: newContract.symbol.toUpperCase(),
        name: newContract.name,
        underlying: newContract.underlying,
        contract_size: newContract.contract_size,
        tick_size: newContract.tick_size,
        max_leverage: newContract.max_leverage,
        maintenance_margin: newContract.maintenance_margin,
        is_perpetual: newContract.is_perpetual,
      });

      if (error) throw new Error(error);
      toast.success('合约添加成功');
      setShowAddContract(false);
      setNewContract({
        symbol: "", name: "", underlying: "",
        contract_size: 1, tick_size: 0.01, max_leverage: 100,
        maintenance_margin: 0.5, is_perpetual: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error adding contract:', error);
      toast.error('添加合约失败');
    }
  };

  const handleToggleContract = async (id: string, isActive: boolean) => {
    try {
      const { error } = await adminApi.update('futures_contracts', { is_active: !isActive }, { id });

      if (error) throw new Error(error);
      toast.success(isActive ? '已禁用' : '已启用');
      fetchData();
    } catch (error) {
      console.error('Error toggling contract:', error);
      toast.error('操作失败');
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('确定要删除这个合约吗？')) return;
    try {
      const { error } = await adminApi.delete('futures_contracts', { id });
      if (error) throw new Error(error);
      toast.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('删除失败');
    }
  };

  const handleUpdateOrder = async (id: string, status: string) => {
    try {
      const { error } = await adminApi.update('futures_orders', { status }, { id });

      if (error) throw new Error(error);
      toast.success('订单状态已更新');
      fetchData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('更新失败');
    }
  };

  const handleClosePosition = async (id: string) => {
    try {
      const { error } = await adminApi.update('futures_positions', { status: 'closed', closed_at: new Date().toISOString() }, { id });

      if (error) throw new Error(error);
      toast.success('仓位已平仓');
      fetchData();
    } catch (error) {
      console.error('Error closing position:', error);
      toast.error('平仓失败');
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500",
      filled: "bg-green-500/10 text-green-500",
      cancelled: "bg-gray-500/10 text-gray-500",
      open: "bg-blue-500/10 text-blue-500",
      closed: "bg-gray-500/10 text-gray-500",
    };
    return <Badge className={styles[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="contracts">
        <TabsList>
          <TabsTrigger value="contracts">期货合约</TabsTrigger>
          <TabsTrigger value="orders">交易订单</TabsTrigger>
          <TabsTrigger value="positions">持仓管理</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    期货合约管理
                  </CardTitle>
                  <CardDescription>管理可交易的期货合约</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="搜索合约..." 
                      className="pl-9 w-48"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={showAddContract} onOpenChange={setShowAddContract}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" />添加</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加期货合约</DialogTitle>
                        <DialogDescription>添加新的可交易期货合约</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input 
                          placeholder="合约代码 (如 BTCUSDT)" 
                          value={newContract.symbol}
                          onChange={(e) => setNewContract({...newContract, symbol: e.target.value})}
                        />
                        <Input 
                          placeholder="合约名称" 
                          value={newContract.name}
                          onChange={(e) => setNewContract({...newContract, name: e.target.value})}
                        />
                        <Input 
                          placeholder="标的资产 (如 BTC)" 
                          value={newContract.underlying}
                          onChange={(e) => setNewContract({...newContract, underlying: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input 
                            type="number"
                            placeholder="合约乘数" 
                            value={newContract.contract_size}
                            onChange={(e) => setNewContract({...newContract, contract_size: Number(e.target.value)})}
                          />
                          <Input 
                            type="number"
                            placeholder="最小变动" 
                            value={newContract.tick_size}
                            onChange={(e) => setNewContract({...newContract, tick_size: Number(e.target.value)})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input 
                            type="number"
                            placeholder="最大杠杆" 
                            value={newContract.max_leverage}
                            onChange={(e) => setNewContract({...newContract, max_leverage: Number(e.target.value)})}
                          />
                          <Input 
                            type="number"
                            placeholder="维持保证金率%" 
                            value={newContract.maintenance_margin}
                            onChange={(e) => setNewContract({...newContract, maintenance_margin: Number(e.target.value)})}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={newContract.is_perpetual}
                            onCheckedChange={(checked) => setNewContract({...newContract, is_perpetual: checked})}
                          />
                          <span>永续合约</span>
                        </div>
                        <Button onClick={handleAddContract} className="w-full">添加</Button>
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
                    <TableHead>合约</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>标的</TableHead>
                    <TableHead>杠杆</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-mono font-bold">{contract.symbol}</TableCell>
                      <TableCell>{contract.name}</TableCell>
                      <TableCell>{contract.underlying}</TableCell>
                      <TableCell>{contract.max_leverage}x</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {contract.is_perpetual ? '永续' : '交割'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={contract.is_active ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}>
                          {contract.is_active ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleToggleContract(contract.id, contract.is_active)}
                          >
                            {contract.is_active ? '禁用' : '启用'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteContract(contract.id)}
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
                  <CardTitle>期货订单管理</CardTitle>
                  <CardDescription>管理所有期货交易订单</CardDescription>
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
                    <TableHead>合约</TableHead>
                    <TableHead>方向</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>杠杆</TableHead>
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
                      <TableCell>${order.price?.toFixed(2) || '市价'}</TableCell>
                      <TableCell>{order.leverage}x</TableCell>
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
                  <CardDescription>查看和管理所有用户的期货持仓</CardDescription>
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
                    <TableHead>合约</TableHead>
                    <TableHead>方向</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>开仓价</TableHead>
                    <TableHead>标记价</TableHead>
                    <TableHead>杠杆</TableHead>
                    <TableHead>未实现盈亏</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell className="font-mono text-xs">{pos.user_id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-bold">{pos.symbol}</TableCell>
                      <TableCell>
                        <Badge className={pos.side === 'long' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}>
                          {pos.side === 'long' ? '多' : '空'}
                        </Badge>
                      </TableCell>
                      <TableCell>{pos.quantity}</TableCell>
                      <TableCell>${pos.entry_price.toFixed(2)}</TableCell>
                      <TableCell>${pos.mark_price?.toFixed(2) || '-'}</TableCell>
                      <TableCell>{pos.leverage}x</TableCell>
                      <TableCell className={pos.unrealized_pnl && pos.unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"}>
                        ${pos.unrealized_pnl?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>{getStatusBadge(pos.status)}</TableCell>
                      <TableCell>
                        {pos.status === 'open' && (
                          <Button size="sm" variant="destructive" onClick={() => handleClosePosition(pos.id)}>
                            强平
                          </Button>
                        )}
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
