import {
  Receipt,
  ChefHat,
  BarChart3,
  Palette,
  Truck,
  BadgePercent,
  Users,
  Printer,
  type LucideIcon,
} from "lucide-react"

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "الطلبات", icon: Receipt },
  { href: "/admin/items", label: "الأصناف", icon: ChefHat },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/sales", label: "المبيعات", icon: BarChart3 },
  { href: "/admin/appearance", label: "المظهر", icon: Palette },
  { href: "/admin/delivery", label: "التوصيل", icon: Truck },
  { href: "/admin/discounts", label: "الخصومات", icon: BadgePercent },
  { href: "/admin/printer", label: "الطابعة", icon: Printer },
]
