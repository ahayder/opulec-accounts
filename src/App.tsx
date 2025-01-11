import { Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import SalesPage from './pages/sales/SalesPage'
import ExpensesPage from './pages/expenses/ExpensesPage'
import AssetsPage from './pages/assets/AssetsPage'
import InvestmentsPage from './pages/investments/InvestmentsPage'
import SettingsPage from './pages/settings/SettingsPage'
import PurchasesPage from './pages/purchases/PurchasesPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Sidebar from './components/dashboard/Sidebar'
import { SidebarProvider } from './contexts/SidebarContext'

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="investments" element={<InvestmentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <SidebarProvider>
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
    </SidebarProvider>
  );
};

export default App
