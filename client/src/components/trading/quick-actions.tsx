import { CreditCard, FileText, Headphones } from "lucide-react"

interface QuickActionsProps {
  onShowCustomerService?: () => void;
}

export function QuickActions({ onShowCustomerService }: QuickActionsProps) {
  const actions = [
    {
      icon: CreditCard,
      label: "入款",
      bgColor: "bg-[#fbbf24]",
      onClick: () => {},
    },
    {
      icon: FileText,
      label: "取款", 
      bgColor: "bg-[#3b82f6]",
      onClick: () => {},
    },
    {
      icon: Headphones,
      label: "客服中心",
      bgColor: "bg-[#ef4444]",
      ringColor: "ring-[#ef4444]/30",
      onClick: onShowCustomerService,
    },
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
          <div className={`w-14 h-14 rounded-full ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg ${action.ringColor ? `ring-4 ${action.ringColor}` : ''}`}>
            <action.icon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-foreground font-medium text-center">{action.label}</span>
        </button>
      ))}
    </div>
  )
}
