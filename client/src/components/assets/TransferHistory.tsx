import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRightLeft } from "lucide-react";

interface Transfer {
  id: string;
  from_account: string;
  to_account: string;
  currency: string;
  amount: number;
  created_at: string;
}

export function TransferHistory() {
  const { t } = useTranslation();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      // 这里暂时使用空数组，因为还没有划转记录表
      // 未来可以从 user_transfers 表获取数据
      setTransfers([]);
    } catch (error) {
      console.error("Failed to load transfers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          {t('assets.transfers')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('assets.no_transfers')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.time')}</TableHead>
                <TableHead>{t('assets.from_account')}</TableHead>
                <TableHead>{t('assets.to_account')}</TableHead>
                <TableHead>{t('assets.currency')}</TableHead>
                <TableHead className="text-right">{t('assets.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>{new Date(transfer.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transfer.from_account}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transfer.to_account}</Badge>
                  </TableCell>
                  <TableCell>{transfer.currency}</TableCell>
                  <TableCell className="text-right">{transfer.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
