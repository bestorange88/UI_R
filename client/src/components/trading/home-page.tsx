

import { Bell, Globe, Shield, Zap, Globe2, Bitcoin, CreditCard, FileText, Headphones, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FloatingParticles } from "./floating-particles"

// Header Component
function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-4 bg-background">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-widest text-foreground">SAXO</span>
        <span className="text-[9px] text-[#00d4ff] font-semibold tracking-wider">BE INVESTED</span>
      </div>
      <div className="flex items-center gap-5">
        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-6 h-6" />
        </button>
        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
          <Globe className="w-6 h-6" />
        </button>
      </div>
    </header>
  )
}

// Hero Banner Component
function HeroBanner() {
  return (
    <div className="relative mx-4 rounded-2xl overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/saxo-datacenter.jpg')`
        }}
      />
      {/* Frosted glass effect with deep color overlay */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/50 via-[#1e3a5f]/40 to-[#0c1929]/50" />
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8b5cf6] via-[#06b6d4] to-[#22c55e]" />
      
      <div className="relative z-10 px-5 py-8">
        <h1 className="text-[28px] font-bold text-foreground leading-tight mb-3">
          Futures <span className="text-[#ef4444]">Cryptocurrency</span>
          <br />
          Trading Platform
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Millisecond - level trade execution · Institutional - level security protection · Global market coverage
        </p>
        <Button className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold px-6 py-2.5 h-auto rounded-lg flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Download App
        </Button>
      </div>
    </div>
  )
}

// Quick Actions Component
function QuickActions({ onShowCustomerService }: { onShowCustomerService?: () => void }) {
  const actions = [
    { icon: CreditCard, label: "入款", bgColor: "bg-[#fbbf24]", onClick: () => {} },
    { icon: FileText, label: "取款", bgColor: "bg-[#3b82f6]", onClick: () => {} },
    { icon: Headphones, label: "客服中心", bgColor: "bg-[#ef4444]", onClick: onShowCustomerService },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 py-5 px-6 bg-card mx-4 mt-4 rounded-xl border border-border/50">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          className="flex flex-col items-center gap-2.5 group"
        >
          <div className={`w-14 h-14 rounded-full ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
            <action.icon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-foreground font-medium text-center">{action.label}</span>
        </button>
      ))}
    </div>
  )
}

// Market Data Component
const marketItems = [
  { symbol: "XAU", name: "London Gold", price: "4,882.42", change: "+0.28%", isPositive: true, iconBg: "bg-gradient-to-br from-[#f59e0b] to-[#b45309]" },
  { symbol: "XAG", name: "London Silver", price: "95.45", change: "-0.16%", isPositive: false, iconBg: "bg-gradient-to-br from-[#fbbf24] to-[#d97706]" },
  { symbol: "CL", name: "WTI Oil", price: "59.421", change: "-0.46%", isPositive: false, iconBg: "bg-gradient-to-br from-[#7f1d1d] to-[#450a0a]" },
  { symbol: "HG", name: "COMEX Copper", price: "577.551", change: "+0.70%", isPositive: true, iconBg: "bg-gradient-to-br from-[#c2410c] to-[#9a3412]" },
  { symbol: "NG", name: "Natural Gas Futures", price: "3.679", change: "+0.41%", isPositive: true, iconBg: "bg-gradient-to-br from-[#0891b2] to-[#0e7490]" },
  { symbol: "USDAUD", name: "USDAUD", price: "1.4633", change: "-0.14%", isPositive: false, iconBg: "bg-gradient-to-br from-[#1e40af] to-[#1e3a8a]" },
  { symbol: "USDGBP", name: "USDGBP", price: "0.7412", change: "-0.11%", isPositive: false, iconBg: "bg-gradient-to-br from-[#dc2626] to-[#b91c1c]" },
  { symbol: "USDJPY", name: "USDJPY", price: "158.3057", change: "-0.05%", isPositive: false, iconBg: "bg-gradient-to-br from-[#dc2626] to-[#991b1b]" },
  { symbol: "BTC", name: "Bitcoin", price: "89,048.19", change: "+0.88%", isPositive: true, iconBg: "bg-gradient-to-br from-[#f59e0b] to-[#d97706]" },
  { symbol: "ETH", name: "Ethereum", price: "2,945.44", change: "+1.79%", isPositive: true, iconBg: "bg-gradient-to-br from-[#6366f1] to-[#4f46e5]" },
]

function MarketData() {
  return (
    <div className="mx-4 mt-4 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-1 py-4">
        <h2 className="text-xl font-bold text-foreground">市場數據</h2>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10 px-5 bg-transparent h-9"
        >
          期權
        </Button>
      </div>

      <div className="grid grid-cols-3 px-1 pb-3 text-sm text-muted-foreground">
        <span>名稱</span>
        <span>價格</span>
        <span className="text-right">24小時漲跌幅</span>
      </div>

      <div className="space-y-1">
        {marketItems.map((item) => (
          <div key={item.symbol} className="grid grid-cols-3 items-center px-1 py-3 hover:bg-muted/30 transition-colors rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${item.iconBg} flex items-center justify-center shadow-md`}>
                <span className="text-xs font-bold text-white">{item.symbol.slice(0,2)}</span>
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">{item.symbol}</div>
                <div className="text-xs text-muted-foreground">{item.name}</div>
              </div>
            </div>
            <div className="font-medium text-foreground text-sm">$ {item.price}</div>
            <div className={`text-right font-semibold text-sm ${item.isPositive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
              {item.change}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center py-4">
        <button type="button" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
          查看全部
        </button>
      </div>
    </div>
  )
}

// Why Choose Us Component
function WhyChooseUs() {
  const features = [
    { icon: Shield, title: "銀行級安全", desc: "多簽名冷錢包存儲", color: "text-[#3b82f6]" },
    { icon: Zap, title: "快速交易", desc: "百萬級TPS處理能力", color: "text-[#3b82f6]" },
    { icon: Globe2, title: "全球市場", desc: "交易差價合約、期貨、上市期權和債券等", color: "text-[#3b82f6]" },
    { icon: Bitcoin, title: "區塊鏈市場", desc: "支持24小時多種數字貨幣交易", color: "text-[#3b82f6]" },
  ]

  return (
    <div className="mx-4 mt-6">
      <h2 className="text-xl font-bold text-foreground mb-4">為何選擇我們</h2>
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature) => (
          <div key={feature.title} className="bg-card border border-border/50 rounded-xl p-4">
            <feature.icon className={`w-8 h-8 ${feature.color} mb-3`} />
            <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Future Banner Component
function FutureBanner() {
  return (
    <div className="relative mx-4 mt-6 rounded-2xl overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/futures-banner.jpg')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/80 to-[#0f172a]/60" />
      
      <div className="relative z-10 p-5">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          未来 <span className="text-[#3b82f6]">由您掌握</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          全球資本市場中處處充滿機遇，我們相信，每個人都有能力實現自己的夢想，我們始終致力於幫助您進行投資和交易，助您將未來掌握在自己手中。
        </p>
        <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium px-5 py-2 h-auto rounded-lg flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          下載App
        </Button>
      </div>
    </div>
  )
}

// Quick Deposit/Withdraw Component
function QuickDepositWithdraw() {
  return (
    <div className="mx-4 mt-6 bg-card border border-border/50 rounded-xl p-5">
      <h2 className="text-xl font-bold text-foreground mb-2">入款取款，快捷便利</h2>
      <p className="text-sm text-muted-foreground mb-4">
        支持多種入款方式，到賬迅速，取款即時處理。
      </p>
      <div className="flex gap-3">
        <Button className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold h-11 rounded-lg">
          入款
        </Button>
        <Button className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold h-11 rounded-lg">
          取款
        </Button>
      </div>
    </div>
  )
}

// SAXO Bank Info Component
function SaxoBankInfo() {
  return (
    <div className="mx-4 mt-6 mb-8">
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        SAXO為上百萬投資人，上千種產品的合約差提供令人滿意的世界級服務，晝夜無休。
      </p>
      
      <div className="bg-white rounded-xl p-6 mb-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-[#0f172a] tracking-wider mb-1">SAXO</div>
          <div className="text-3xl font-bold text-[#0f172a] tracking-widest">BANK</div>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground leading-relaxed">
        關於差價合約，您應該了解差價合約是金融衍生產品，讓您可以通過預測期貨、債券、外匯和其它商品等迅速變化的價格漲跌，從而賺取潛在的淨利潤
      </p>
    </div>
  )
}

interface HomePageProps {
  onShowAuth?: (view: "login" | "register" | "forgot") => void;
  onShowCustomerService?: () => void;
}

// Main HomePage Component
export function HomePage({ onShowAuth, onShowCustomerService }: HomePageProps) {
  return (
    <div className="relative min-h-full bg-background pb-4">
      <FloatingParticles />
      <Header />
      <main className="relative z-20 pb-4">
        <HeroBanner />
        <QuickActions onShowCustomerService={onShowCustomerService} />
        <MarketData />
        <WhyChooseUs />
        <FutureBanner />
        <QuickDepositWithdraw />
        <SaxoBankInfo />
      </main>
    </div>
  )
}
