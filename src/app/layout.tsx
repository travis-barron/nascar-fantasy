import AuthProvider from '@/components/AuthProvider'
import AppShell from '@/components/AppShell'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import './globals.css'


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">

          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">

            {/* Mobile Top Bar */}
            <div className="md:hidden">
              <Topbar />
            </div>

            <main className="flex-1 bg-gray-100 p-4 md:p-8 md:ml-64 text-gray-600">
              {children}
            </main>

          </div>
        </div>
      </body>
    </html>
  )
}
