import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAccountBinding } from "@/hooks/useAccountBinding";
import { AccountBindingDialog } from "./AccountBindingDialog";
import { useAuth } from "@/hooks/useAuth";

/**
 * Component that checks if the user needs to bind email or wallet
 * and shows the appropriate dialog
 * NOTE: This only applies to regular users, not admin users
 */
export function AccountBindingChecker() {
  const { user } = useAuth();
  const location = useLocation();
  const { 
    needsEmailBinding, 
    needsWalletBinding, 
    walletAddress,
    loading 
  } = useAccountBinding();
  
  const [showDialog, setShowDialog] = useState(false);
  const [bindingType, setBindingType] = useState<"email" | "wallet">("email");

  // Check if we're on admin or service agent pages - don't show binding dialog
  const isAdminPage = location.pathname.startsWith('/admin');
  const isServicePage = location.pathname.startsWith('/service-');

  useEffect(() => {
    if (loading || !user || isAdminPage || isServicePage) return;

    // Priority: email binding for wallet users
    if (needsEmailBinding) {
      setBindingType("email");
      setShowDialog(true);
    } else if (needsWalletBinding) {
      setBindingType("wallet");
      setShowDialog(true);
    }
  }, [needsEmailBinding, needsWalletBinding, loading, user, isAdminPage, isServicePage]);

  // Don't render on admin/service pages or if no user
  if (!user || loading || isAdminPage || isServicePage) return null;

  return (
    <AccountBindingDialog
      open={showDialog}
      onOpenChange={setShowDialog}
      bindingType={bindingType}
      walletAddress={walletAddress || undefined}
    />
  );
}
