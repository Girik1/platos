import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Enterprise Layout
import EnterpriseLayout from './components/layout/EnterpriseLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import ProfilePage from './pages/customer/ProfilePage';
import WalletPage from './pages/customer/WalletPage';

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorMenu from './pages/vendor/VendorMenu';
import VendorSettlements from './pages/vendor/VendorSettlements';

// Kitchen KDS Page
import KitchenDisplayPage from './pages/kitchen/KitchenDisplayPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVendors from './pages/admin/AdminVendors';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';

// Super Admin & Org Admin Pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import OrgAdminDashboard from './pages/orgadmin/OrgAdminDashboard';

export default function App() {
  const location = useLocation();

  // Route paths that use EnterpriseLayout
  const isEnterprisePortal = [
    '/super-admin',
    '/org-admin',
    '/kitchen',
    '/wallet',
    '/finance',
  ].some((p) => location.pathname.startsWith(p));

  const allRoles = ['customer', 'vendor', 'admin', 'org_admin', 'super_admin', 'kitchen_staff'];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-gray-900 font-sans antialiased">
      {/* Consumer Header & Navigation (hidden in full Enterprise Portal views) */}
      {!isEnterprisePortal && <Navbar />}

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vendor/:id" element={<MenuPage />} />

          {/* Customer Ordering Protected Routes */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={allRoles}>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={allRoles}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute allowedRoles={allRoles}>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={allRoles}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Employee Wallet & Corporate Subsidies */}
          <Route
            path="/wallet"
            element={
              <ProtectedRoute allowedRoles={allRoles}>
                <EnterpriseLayout>
                  <WalletPage />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />

          {/* Kitchen Display System (KDS) */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['kitchen_staff', 'vendor', 'admin', 'super_admin']}>
                <EnterpriseLayout>
                  <KitchenDisplayPage />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />

          {/* Vendor Protected Routes */}
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['vendor', 'admin', 'super_admin']}>
                <VendorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/orders"
            element={
              <ProtectedRoute allowedRoles={['vendor', 'kitchen_staff', 'admin', 'super_admin']}>
                <VendorOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/menu"
            element={
              <ProtectedRoute allowedRoles={['vendor', 'admin', 'super_admin']}>
                <VendorMenu />
              </ProtectedRoute>
            }
          />

          {/* Financial Settlements & Payouts */}
          <Route
            path="/finance/settlements"
            element={
              <ProtectedRoute allowedRoles={['vendor', 'admin', 'super_admin', 'org_admin']}>
                <EnterpriseLayout>
                  <VendorSettlements />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />

          {/* Cafeteria Facility Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendors"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminVendors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'org_admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Platform SaaS Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <EnterpriseLayout>
                  <SuperAdminDashboard />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/*"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                <EnterpriseLayout>
                  <SuperAdminDashboard />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />

          {/* Organization / Corporate Admin Routes */}
          <Route
            path="/org-admin"
            element={
              <ProtectedRoute allowedRoles={['org_admin', 'super_admin', 'admin']}>
                <EnterpriseLayout>
                  <OrgAdminDashboard />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/org-admin/*"
            element={
              <ProtectedRoute allowedRoles={['org_admin', 'super_admin', 'admin']}>
                <EnterpriseLayout>
                  <OrgAdminDashboard />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Consumer Footer (hidden in full Enterprise Portal views) */}
      {!isEnterprisePortal && <Footer />}
    </div>
  );
}
