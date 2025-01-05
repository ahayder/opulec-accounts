import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import SalesPage from './pages/sales/SalesPage'
import PurchasesPage from './pages/purchases/PurchasesPage'
import ExpensesPage from './pages/expenses/ExpensesPage'
import AssetsPage from './pages/assets/AssetsPage'
import InvestmentsPage from './pages/investments/InvestmentsPage'
import SettingsPage from './pages/settings/SettingsPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Sidebar from './components/dashboard/Sidebar'

const AppLayout = () => {
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
    <div className="flex min-h-screen bg-background">
      <Sidebar items={sidebarItems} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-6 space-y-6">
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="investments" element={<InvestmentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App
