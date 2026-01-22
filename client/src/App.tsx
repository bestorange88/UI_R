import "@/i18n/config";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/config";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { AccountBindingChecker } from "@/components/auth/AccountBindingChecker";
import Index from "./pages/Index";
import Trade from "./pages/Trade";
import StockTrade from "./pages/StockTrade";
import FuturesTrade from "./pages/FuturesTrade";
import Markets from "./pages/Markets";
import Contracts from "./pages/Contracts";
import Earn from "./pages/Earn";
import Swap from "./pages/Swap";
import DepositWithdraw from "./pages/DepositWithdraw";
import OTC from "./pages/OTC";
import Mining from "./pages/Mining";
import News from "./pages/News";
import Quant from "./pages/Quant";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Assets from "./pages/Assets";
import Profile from "./pages/Profile";
import KYCVerification from "./pages/KYCVerification";
import KYC from "./pages/KYC";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import CustomerService from "./pages/CustomerService";
import HelpCenter from "./pages/HelpCenter";
import NotFound from "./pages/NotFound";
import ServiceLogin from "./pages/ServiceLogin";
import ServiceDashboard from "./pages/ServiceDashboard";

const queryClient = new QueryClient();

const App = () => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <AdminAuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AccountBindingChecker />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/trade" element={<Trade />} />
                <Route path="/stocks" element={<StockTrade />} />
                <Route path="/futures" element={<FuturesTrade />} />
                <Route path="/markets" element={<Markets />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/earn" element={<Earn />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/deposit-withdraw" element={<DepositWithdraw />} />
                <Route path="/deposit" element={<DepositWithdraw />} />
                <Route path="/withdraw" element={<DepositWithdraw />} />
                <Route path="/otc" element={<OTC />} />
                <Route path="/mining" element={<Mining />} />
                <Route path="/news" element={<News />} />
                <Route path="/quant" element={<Quant />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/kyc" element={<KYC />} />
                <Route path="/kyc-verification" element={<KYCVerification />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/customer-service" element={<CustomerService />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/service" element={<ServiceLogin />} />
                <Route path="/service/dashboard" element={<ServiceDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AdminAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </I18nextProvider>
);

export default App;
