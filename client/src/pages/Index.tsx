import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AnnouncementDialog } from "@/components/home/AnnouncementDialog";
import { DeviceFrame } from "@/components/ui/device-frame";
import { NetworkBackground } from "@/components/ui/network-background";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  ArrowLeftRight, 
  BarChart3, 
  Wallet, 
  User,
  Bell,
  Globe,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import arxLogoText from "@/assets/arx-logo-text.png";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user) {
      navigate("/trade");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return null;
  }

  // Sample market data
  const marketData = [
    { symbol: "XAU", name: "London Gold", price: "4,910.71", change: "+0.86%", positive: true },
    { symbol: "XAG", name: "London Silver", price: "96.44", change: "+0.88%", positive: true },
    { symbol: "CL", name: "WTI Oil", price: "59.201", change: "-0.82%", positive: false },
    { symbol: "HG", name: "COMEX Copper", price: "580.513", change: "+1.21%", positive: true },
  ];

  return (
    <>
      <AnnouncementDialog />
      <div className="min-h-screen bg-[#0a0e14] relative overflow-hidden">
        <NetworkBackground />
        
        {/* Content Container */}
        <div className="relative z-10">
          {/* Desktop Layout with Device Frame */}
          <div className="hidden lg:flex min-h-screen items-center justify-center py-10">
            <div className="flex items-center gap-20">
              {/* Left Side - Text Content */}
              <div className="max-w-lg space-y-8">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <img src={arxLogoText} alt="ARX" className="h-12 object-contain brightness-0 invert" />
                </div>
                
                <h1 className="text-5xl font-bold leading-tight">
                  <span className="text-white">{t('home.hero_title', '未来')}</span>{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                    {t('home.hero_subtitle', '由您掌握')}
                  </span>
                </h1>
                
                <p className="text-gray-400 text-lg leading-relaxed">
                  {t('home.hero_description', '全球資本市場中處處充滿機遇，我們相信，每個人都有能力實現自己的夢想，我們始終致力於幫助您進行投資和交易，助您將未來掌握在自己手中。')}
                </p>
                
                <div className="flex gap-4">
                  <Button 
                    size="lg" 
                    className="btn-gradient text-white px-8 py-6 text-lg rounded-xl"
                    onClick={() => navigate("/auth")}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {t('home.download_app', '下載App')}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-gray-600 text-white px-8 py-6 text-lg rounded-xl hover:bg-white/10"
                    onClick={() => navigate("/auth")}
                  >
                    {t('common.login', '登入')}
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 pt-4">
                  <LanguageSwitcher />
                </div>
              </div>
              
              {/* Right Side - iPhone Frame */}
              <DeviceFrame>
                <MobileAppContent marketData={marketData} navigate={navigate} t={t} />
              </DeviceFrame>
            </div>
          </div>
          
          {/* Mobile Layout - Direct App View */}
          <div className="lg:hidden">
            <MobileAppContent marketData={marketData} navigate={navigate} t={t} />
          </div>
        </div>
        
        {/* Footer - Desktop Only */}
        <footer className="hidden lg:block absolute bottom-0 left-0 right-0 text-center py-6 text-gray-500 text-sm">
          © 2024 ARX Trading Platform. All rights reserved.
        </footer>
      </div>
    </>
  );
};

// Mobile App Content Component
interface MobileAppContentProps {
  marketData: Array<{
    symbol: string;
    name: string;
    price: string;
    change: string;
    positive: boolean;
  }>;
  navigate: (path: string) => void;
  t: ReturnType<typeof import('react-i18next').useTranslation>['t'];
}

const MobileAppContent = ({ marketData, navigate, t }: MobileAppContentProps) => {
  return (
    <div className="flex flex-col min-h-full bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-xl">ARX</span>
          <span className="text-gray-400 text-xs">BE INVESTED</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-white">
            <Bell className="h-5 w-5" />
          </button>
          <button className="text-gray-400 hover:text-white">
            <Globe className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Hero Banner */}
      <div className="relative mx-4 my-4 p-6 rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(30, 40, 60, 0.9) 0%, rgba(20, 30, 50, 0.95) 100%)'
      }}>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">
            <span className="text-white">{t('home.hero_title', '未来')}</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              {t('home.hero_subtitle', '由您掌握')}
            </span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            {t('home.mobile_hero_desc', '全球資本市場中處處充滿機遇，我們相信，每個人都有能力實現自己的夢想。')}
          </p>
          <Button 
            className="btn-gradient text-white rounded-lg px-6"
            onClick={() => navigate("/auth")}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('home.download_app', '下載App')}
          </Button>
        </div>
        
        {/* Decorative Lines */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 300 150">
            <path d="M0 100 Q75 50 150 80 T300 60" stroke="url(#grad1)" strokeWidth="1" fill="none" />
            <path d="M0 120 Q100 90 200 110 T300 90" stroke="url(#grad1)" strokeWidth="1" fill="none" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-around px-4 py-4">
        <ActionButton icon={<Wallet className="h-5 w-5" />} label={t('nav.deposit', '入款')} color="bg-blue-500/20 text-blue-400" onClick={() => navigate("/deposit")} />
        <ActionButton icon={<ArrowLeftRight className="h-5 w-5" />} label={t('nav.withdraw', '取款')} color="bg-purple-500/20 text-purple-400" onClick={() => navigate("/deposit")} />
        <ActionButton icon={<User className="h-5 w-5" />} label={t('nav.support', '客服中心')} color="bg-orange-500/20 text-orange-400" onClick={() => navigate("/customer-service")} />
      </div>
      
      {/* Market Data Section */}
      <div className="flex-1 px-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">{t('market.data', '市場數據')}</h3>
          <Button variant="outline" size="sm" className="text-xs border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
            {t('market.futures', '期權')}
          </Button>
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-3 text-gray-400 text-xs pb-2 border-b border-gray-800">
          <span>{t('market.name', '名稱')}</span>
          <span className="text-center">{t('market.price', '價格')}</span>
          <span className="text-right">{t('market.change_24h', '24小時漲跌幅')}</span>
        </div>
        
        {/* Market Items */}
        <div className="space-y-1 mt-2">
          {marketData.map((item, index) => (
            <div 
              key={index} 
              className="grid grid-cols-3 items-center py-3 border-b border-gray-800/50 hover:bg-white/5 cursor-pointer transition-colors"
              onClick={() => navigate("/trade")}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{item.symbol[0]}</span>
                </div>
                <div>
                  <span className="text-white font-medium block">{item.symbol}</span>
                  <span className="text-gray-500 text-xs">{item.name}</span>
                </div>
              </div>
              <span className="text-white text-center font-mono">$ {item.price}</span>
              <div className="flex items-center justify-end gap-1">
                {item.positive ? (
                  <ArrowUpRight className="h-3 w-3 text-green-400" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-400" />
                )}
                <span className={item.positive ? "text-green-400" : "text-red-400"}>
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 lg:absolute bg-[#0d1117]/95 backdrop-blur-lg border-t border-gray-800 px-2 py-2 z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <NavButton icon={<Home className="h-5 w-5" />} label={t('nav.home', '首頁')} active onClick={() => {}} />
          <NavButton icon={<ArrowLeftRight className="h-5 w-5" />} label={t('nav.trade', '交易')} onClick={() => navigate("/trade")} />
          <NavButton icon={<BarChart3 className="h-5 w-5" />} label={t('nav.market', '市場')} onClick={() => navigate("/markets")} />
          <NavButton icon={<Wallet className="h-5 w-5" />} label={t('nav.wallet', '錢包')} onClick={() => navigate("/assets")} />
          <NavButton icon={<User className="h-5 w-5" />} label={t('nav.profile', '我的')} onClick={() => navigate("/profile")} />
        </div>
      </div>
    </div>
  );
};

// Action Button Component
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

const ActionButton = ({ icon, label, color, onClick }: ActionButtonProps) => (
  <button 
    className="flex flex-col items-center gap-2 group"
    onClick={onClick}
  >
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center transition-transform group-hover:scale-105`}>
      {icon}
    </div>
    <span className="text-gray-300 text-xs">{label}</span>
  </button>
);

// Navigation Button Component
interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavButton = ({ icon, label, active, onClick }: NavButtonProps) => (
  <button 
    className={`flex flex-col items-center gap-1 px-3 py-1 ${active ? 'text-cyan-400' : 'text-gray-400'} hover:text-cyan-400 transition-colors`}
    onClick={onClick}
  >
    {icon}
    <span className="text-[10px]">{label}</span>
  </button>
);

export default Index;
