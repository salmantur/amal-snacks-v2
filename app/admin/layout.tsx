import type { ReactNode } from "react"
import { IBM_Plex_Mono } from "next/font/google"
import { AdminShell } from "./admin-shell"

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
})

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={ibmPlexMono.variable}>
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
