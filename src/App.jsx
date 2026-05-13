import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import LessonsPage from "./pages/LessonsPage";
import PracticePage from "./pages/PracticePage";
import ScenariosPage from "./pages/ScenariosPage";
import PlacementTestPage from "./pages/PlacementTestPage";

import AccountsPage from "./pages/AccountsPage";
import InventoryPage from "./pages/InventoryPage";
import POSPage from "./pages/POSPage";
import SalesInvoicesPage from "./pages/SalesInvoicesPage";
import PurchasesPage from "./pages/PurchasesPage";
import PurchaseInvoicesPage from "./pages/PurchaseInvoicesPage";
import VouchersPage from "./pages/VouchersPage";
import PartiesPage from "./pages/PartiesPage";
import BusinessReportPage from "./pages/BusinessReportPage";
import EntryGeneratorPage from "./pages/EntryGeneratorPage";
import JournalPage from "./pages/JournalPage";
import LedgerPage from "./pages/LedgerPage";
import TrialBalancePage from "./pages/TrialBalancePage";
import StatementsPage from "./pages/StatementsPage";
import SettingsPage from "./pages/SettingsPage";

import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />

        <Route path="login" element={<LoginPage />} />

        {/* صفحات التعليم والتدريب - مفتوحة للجميع */}
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="scenarios" element={<ScenariosPage />} />
        <Route path="placement-test" element={<PlacementTestPage />} />

        {/* صفحات الأدمن فقط */}
        <Route
          path="accounts"
          element={
            <AdminRoute>
              <AccountsPage />
            </AdminRoute>
          }
        />

        <Route
          path="inventory"
          element={
            <AdminRoute>
              <InventoryPage />
            </AdminRoute>
          }
        />

        <Route
          path="pos"
          element={
            <AdminRoute>
              <POSPage />
            </AdminRoute>
          }
        />

        <Route
          path="sales-invoices"
          element={
            <AdminRoute>
              <SalesInvoicesPage />
            </AdminRoute>
          }
        />

        <Route
          path="purchases"
          element={
            <AdminRoute>
              <PurchasesPage />
            </AdminRoute>
          }
        />

        <Route
          path="purchase-invoices"
          element={
            <AdminRoute>
              <PurchaseInvoicesPage />
            </AdminRoute>
          }
        />

        <Route
          path="vouchers"
          element={
            <AdminRoute>
              <VouchersPage />
            </AdminRoute>
          }
        />

        <Route
          path="parties"
          element={
            <AdminRoute>
              <PartiesPage />
            </AdminRoute>
          }
        />

        <Route
          path="business-report"
          element={
            <AdminRoute>
              <BusinessReportPage />
            </AdminRoute>
          }
        />

        <Route
          path="entry-generator"
          element={
            <AdminRoute>
              <EntryGeneratorPage />
            </AdminRoute>
          }
        />

        <Route
          path="journal"
          element={
            <AdminRoute>
              <JournalPage />
            </AdminRoute>
          }
        />

        <Route
          path="ledger"
          element={
            <AdminRoute>
              <LedgerPage />
            </AdminRoute>
          }
        />

        <Route
          path="trial-balance"
          element={
            <AdminRoute>
              <TrialBalancePage />
            </AdminRoute>
          }
        />

        <Route
          path="statements"
          element={
            <AdminRoute>
              <StatementsPage />
            </AdminRoute>
          }
        />

        <Route
          path="settings"
          element={
            <AdminRoute>
              <SettingsPage />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;