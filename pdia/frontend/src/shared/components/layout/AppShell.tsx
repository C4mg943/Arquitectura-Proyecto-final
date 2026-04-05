import type { PropsWithChildren } from 'react'

import OfflineBanner from '../feedback/OfflineBanner'
import BottomNav from './BottomNav'
import SideNav from './SideNav'
import TopBar from './TopBar'

export default function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="grain-overlay min-h-screen bg-surface text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      <TopBar />
      <SideNav />
      <OfflineBanner />

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-24 md:px-6 lg:pl-80 lg:pr-10 lg:pb-12">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
