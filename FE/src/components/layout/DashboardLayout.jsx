import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const DashboardLayout = ({ links, roleName, profileLink }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const location = useLocation()

  // Find current title based on active link
  const currentLink = links.find(link => link.path === location.pathname)
  const title = currentLink ? currentLink.label : 'Dashboard'

  return (
    <div className="flex h-screen bg-gray-50/50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 selection:bg-blue-200 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100 transition-colors duration-300">
      <Sidebar
        links={links}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        roleName={roleName}
      />

      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Navbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={title}
          profileLink={profileLink}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
