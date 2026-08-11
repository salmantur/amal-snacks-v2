import { AdminMenuButton } from "./admin-shell"

export function AdminPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-6 border-b border-admin-border-soft bg-admin-header px-4 py-3.5 sm:px-8">
      <div>
        <h1 className="text-[15px] font-bold text-admin-ink">{title}</h1>
        {description ? <p className="mt-0.5 text-[13px] text-admin-muted">{description}</p> : null}
      </div>
      <AdminMenuButton />
    </div>
  )
}
