import { SiteHeader } from '@/components/SiteHeader'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
    </div>
  )
}
