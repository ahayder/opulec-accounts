import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const sidebarItems = [
    { title: 'Dashboard', path: '/', icon: '📊' },
    { title: 'Sales', path: '/sales', icon: '💵' },
    { title: 'Purchases', path: '/purchases', icon: '🛍️' },
    { title: 'Expenses', path: '/expenses', icon: '💸' },
    { title: 'Assets', path: '/assets', icon: '🏢' },
    { title: 'Investments', path: '/investments', icon: '📈' },
    { title: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={sidebarItems} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout; 