import { useState, useEffect } from "react";
import { adminApi } from "@/hooks/useAdminData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";

interface EarnProduct {
  id: string;
  product_type: string;
  coin_symbol: string;
  coin_name: string;
  apy_rate: number;
  min_amount: number;
  max_amount: number | null;
  lock_period_days: number | null;
  risk_level: string;
  is_active: boolean;
  total_value_locked: number;
}

const AdminEarnManager = () => {
  const [products, setProducts] = useState<EarnProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EarnProduct | null>(null);
  const [formData, setFormData] = useState({
    product_type: "savings",
    coin_symbol: "",
    coin_name: "",
    apy_rate: "",
    min_amount: "",
    max_amount: "",
    lock_period_days: "",
    risk_level: "low",
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await adminApi.select<EarnProduct[]>('earn_products', {
        order: { column: 'product_type', ascending: true }
      });

      if (error) throw new Error(error);
      setProducts(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Failed to fetch earn products: " + message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const productData = {
        product_type: formData.product_type,
        coin_symbol: formData.coin_symbol.toUpperCase(),
        coin_name: formData.coin_name,
        apy_rate: parseFloat(formData.apy_rate),
        min_amount: parseFloat(formData.min_amount),
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
        lock_period_days: formData.lock_period_days ? parseInt(formData.lock_period_days) : null,
        risk_level: formData.risk_level,
        is_active: formData.is_active,
      };

      if (editingProduct) {
        const { error } = await adminApi.update('earn_products', productData, { id: editingProduct.id });

        if (error) throw new Error(error);
        toast.success("Product updated successfully");
      } else {
        const { error } = await adminApi.insert('earn_products', productData);

        if (error) throw new Error(error);
        toast.success("Product created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Failed to save product: " + message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await adminApi.delete('earn_products', { id });

      if (error) throw new Error(error);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Failed to delete product: " + message);
    }
  };

  const handleToggleActive = async (product: EarnProduct) => {
    try {
      const { error } = await adminApi.update('earn_products', { is_active: !product.is_active }, { id: product.id });

      if (error) throw new Error(error);
      toast.success(`Product ${!product.is_active ? "activated" : "deactivated"}`);
      fetchProducts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Failed to update product: " + message);
    }
  };

  const openEditDialog = (product: EarnProduct) => {
    setEditingProduct(product);
    setFormData({
      product_type: product.product_type,
      coin_symbol: product.coin_symbol,
      coin_name: product.coin_name,
      apy_rate: product.apy_rate.toString(),
      min_amount: product.min_amount.toString(),
      max_amount: product.max_amount?.toString() || "",
      lock_period_days: product.lock_period_days?.toString() || "",
      risk_level: product.risk_level,
      is_active: product.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      product_type: "savings",
      coin_symbol: "",
      coin_name: "",
      apy_rate: "",
      min_amount: "",
      max_amount: "",
      lock_period_days: "",
      risk_level: "low",
      is_active: true,
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>理財產品管理</CardTitle>
            <CardDescription>管理加密貨幣、股票、期貨理財產品</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新增產品
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "編輯" : "新增"}理財產品</DialogTitle>
                <DialogDescription>
                  配置理財產品詳細資訊
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>產品類型</Label>
                  <Select value={formData.product_type} onValueChange={(value) => setFormData({ ...formData, product_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto_savings">加密貨幣 - 活期理財</SelectItem>
                      <SelectItem value="crypto_staking">加密貨幣 - 定期鎖倉</SelectItem>
                      <SelectItem value="crypto_defi">加密貨幣 - DeFi挖礦</SelectItem>
                      <SelectItem value="stock_dividend">股票 - 股息收益</SelectItem>
                      <SelectItem value="stock_growth">股票 - 成長基金</SelectItem>
                      <SelectItem value="stock_index">股票 - 指數基金</SelectItem>
                      <SelectItem value="futures_arbitrage">期貨 - 套利策略</SelectItem>
                      <SelectItem value="futures_hedge">期貨 - 對沖基金</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>代碼/符號</Label>
                    <Input
                      value={formData.coin_symbol}
                      onChange={(e) => setFormData({ ...formData, coin_symbol: e.target.value })}
                      placeholder="BTC / AAPL / ES"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>產品名稱</Label>
                    <Input
                      value={formData.coin_name}
                      onChange={(e) => setFormData({ ...formData, coin_name: e.target.value })}
                      placeholder="Bitcoin 活期理財"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>年化收益率 (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.apy_rate}
                      onChange={(e) => setFormData({ ...formData, apy_rate: e.target.value })}
                      placeholder="5.2"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>風險等級</Label>
                    <Select value={formData.risk_level} onValueChange={(value) => setFormData({ ...formData, risk_level: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低風險</SelectItem>
                        <SelectItem value="medium">中風險</SelectItem>
                        <SelectItem value="high">高風險</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>最小金額</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={formData.min_amount}
                      onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                      placeholder="0.001"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>最大金額 (可選)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={formData.max_amount}
                      onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                      placeholder="不限"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>鎖倉期限 (天) - 留空為活期</Label>
                  <Input
                    type="number"
                    value={formData.lock_period_days}
                    onChange={(e) => setFormData({ ...formData, lock_period_days: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>啟用</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  取消
                </Button>
                <Button onClick={handleSave}>
                  儲存
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>類型</TableHead>
              <TableHead>代碼</TableHead>
              <TableHead>年化</TableHead>
              <TableHead>最小金額</TableHead>
              <TableHead>鎖倉期</TableHead>
              <TableHead>風險</TableHead>
              <TableHead>TVL</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="text-xs">{getProductTypeLabel(product.product_type)}</TableCell>
                <TableCell className="font-bold">{product.coin_symbol}</TableCell>
                <TableCell className="text-primary font-semibold">{product.apy_rate}%</TableCell>
                <TableCell>{product.min_amount}</TableCell>
                <TableCell>{product.lock_period_days ? `${product.lock_period_days}天` : "活期"}</TableCell>
                <TableCell>{getRiskLabel(product.risk_level)}</TableCell>
                <TableCell>${(product.total_value_locked / 1000000).toFixed(2)}M</TableCell>
                <TableCell>
                  <Switch
                    checked={product.is_active}
                    onCheckedChange={() => handleToggleActive(product)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
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
  );
};

// Helper functions
const getProductTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    crypto_savings: '加密-活期',
    crypto_staking: '加密-定期',
    crypto_defi: '加密-DeFi',
    stock_dividend: '股票-股息',
    stock_growth: '股票-成長',
    stock_index: '股票-指數',
    futures_arbitrage: '期貨-套利',
    futures_hedge: '期貨-對沖',
    savings: '活期',
    staking: '定期',
    defi: 'DeFi',
  };
  return labels[type] || type;
};

const getRiskLabel = (risk: string) => {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  };
  return labels[risk] || risk;
};

export default AdminEarnManager;
