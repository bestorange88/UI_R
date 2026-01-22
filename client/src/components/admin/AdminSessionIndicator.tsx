import { useEffect, useState } from "react";
import { useAdminAuth, formatSessionTime, SESSION_WARNING_THRESHOLD } from "@/hooks/useAdminAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, LogOut, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const AdminSessionIndicator = () => {
  const { admin, sessionTimeLeft, resetSessionTimer, logout, isAuthenticated } = useAdminAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  // Show warning dialog when session is about to expire
  useEffect(() => {
    if (!isAuthenticated) return;
    
    if (sessionTimeLeft <= SESSION_WARNING_THRESHOLD && sessionTimeLeft > 0 && !hasShownWarning) {
      setShowWarning(true);
      setHasShownWarning(true);
    }
    
    // Reset the warning flag when session is extended
    if (sessionTimeLeft > SESSION_WARNING_THRESHOLD) {
      setHasShownWarning(false);
    }
  }, [sessionTimeLeft, isAuthenticated, hasShownWarning]);

  const handleExtendSession = () => {
    resetSessionTimer();
    setShowWarning(false);
    setHasShownWarning(false);
  };

  const handleLogout = () => {
    setShowWarning(false);
    logout();
  };

  if (!isAuthenticated || !admin) return null;

  const isWarning = sessionTimeLeft <= SESSION_WARNING_THRESHOLD;
  const isCritical = sessionTimeLeft <= 60; // Last minute

  return (
    <>
      {/* Session indicator badge */}
      <div className="flex items-center gap-2">
        <Badge 
          variant={isCritical ? "destructive" : isWarning ? "secondary" : "outline"}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1",
            isCritical && "animate-pulse"
          )}
        >
          <Clock className="h-3 w-3" />
          <span className="font-mono text-xs">
            {formatSessionTime(sessionTimeLeft)}
          </span>
        </Badge>
        
        {isWarning && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleExtendSession}
            className="h-7 px-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            延长
          </Button>
        )}
      </div>

      {/* Warning dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              会话即将过期
            </AlertDialogTitle>
            <AlertDialogDescription>
              您的管理员会话将在 <strong className="text-foreground">{formatSessionTime(sessionTimeLeft)}</strong> 后过期。
              <br />
              为确保安全，长时间未操作将自动登出。
              <br />
              <br />
              是否需要延长会话时间？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              立即登出
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleExtendSession}>
              <RefreshCw className="h-4 w-4 mr-2" />
              延长会话
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
