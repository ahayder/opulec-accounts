import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/dashboard/DashboardLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import SalesPage from './pages/sales/SalesPage'
import InventoryPage from './pages/inventory/InventoryPage'
import ExpensesPage from './pages/expenses/ExpensesPage'
import AssetsPage from './pages/assets/AssetsPage'
import InvestmentsPage from './pages/investments/InvestmentsPage'
import SettingsPage from './pages/settings/SettingsPage'

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/investments" element={<InvestmentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </DashboardLayout>
    </Router>
  )
}

export default App
