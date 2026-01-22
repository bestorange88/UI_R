

import { Home, ArrowUpDown, TrendingUp, Wallet, User } from "lucide-react"
import { useState } from "react"

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: ArrowUpDown, label: "Trade", id: "trade" },
  { icon: TrendingUp, label: "Market", id: "market" },
  { icon: Wallet, label: "Wallet", id: "wallet" },
  { icon: User, label: "Profile", id: "profile" },
]

export function BottomNav() {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50">
      <div className="flex items-center justify-around py-3 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center gap-1.5 py-1 px-4 min-w-[60px] transition-all"
            >
              <item.icon
                className={`w-6 h-6 transition-colors ${isActive ? "text-[#3b82f6]" : "text-muted-foreground"}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[11px] font-medium transition-colors ${isActive ? "text-[#3b82f6]" : "text-muted-foreground"}`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
      {/* Safe area padding for mobile */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
