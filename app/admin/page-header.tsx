export function AdminPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-border bg-background px-4 py-4 md:px-6">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}
