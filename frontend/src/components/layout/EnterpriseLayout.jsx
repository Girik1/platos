import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChefHat,
  LayoutDashboard,
  Building2,
  Store,
  Users,
  Package,
  Wallet,
  Clock,
  Sparkles,
  LogOut,
  ChevronDown,
  Bell,
  UtensilsCrossed,
  ShieldCheck,
  CreditCard,
  FileText,
  Sliders,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';

export default function EnterpriseLayout({ children, activePortal = 'customer' }) {
  const { user, logout, login } = useAuth();
  const { cartCount, cartTotal } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [activeCafeteria, setActiveCafeteria] = useState('Central Food Court & Bistro');

  const currentRole = user?.role || 'customer';

  // Demo accounts for instantaneous persona switcher
  const demoPersonas = [
    { label: 'Super Admin', email: 'superadmin@platos.com', pw: 'admin123', role: 'super_admin', badge: 'HQ Platform', path: '/super-admin' },
    { label: 'Corporate Admin', email: 'orgadmin@platos.com', pw: 'admin123', role: 'org_admin', badge: 'TechCorp HR', path: '/org-admin' },
    { label: 'Cafeteria Manager', email: 'admin@platos.com', pw: 'admin123', role: 'admin', badge: 'Facility Lead', path: '/admin/dashboard' },
    { label: 'Food Vendor Partner', email: 'vendor1@platos.com', pw: 'vendor123', role: 'vendor', badge: 'Annapurna Kitchen', path: '/vendor/dashboard' },
    { label: 'Kitchen Chef (KDS)', email: 'kitchen1@platos.com', pw: 'vendor123', role: 'kitchen_staff', badge: 'Live Kitchen POS', path: '/kitchen' },
    { label: 'Employee / Customer', email: 'user1@platos.com', pw: 'user123', role: 'customer', badge: 'Rahul (TechCorp)', path: '/' },
  ];

  const handleSwitchPersona = async (persona) => {
    try {
      await login(persona.email, persona.pw);
      setRoleSwitcherOpen(false);
      navigate(persona.path);
      toast.success(`Switched persona to ${persona.label}`);
    } catch (_) {
      toast.error('Persona switch failed');
    }
  };

  // Role-specific navigation links
  const getNavLinks = () => {
    if (currentRole === 'super_admin') {
      return [
        { label: 'SaaS Command Center', path: '/super-admin', icon: LayoutDashboard },
        { label: 'Client Organizations', path: '/super-admin/organizations', icon: Building2 },
        { label: 'Vendor Approvals', path: '/super-admin/vendors', icon: Store },
        { label: 'Global Settlements', path: '/finance/settlements', icon: CreditCard },
      ];
    }
    if (currentRole === 'org_admin') {
      return [
        { label: 'Company Overview', path: '/org-admin', icon: LayoutDashboard },
        { label: 'Campus Cafeterias', path: '/org-admin/cafeterias', icon: Building2 },
        { label: 'Meal Subsidies', path: '/org-admin/subsidies', icon: Sliders },
        { label: 'Employee Wallets', path: '/org-admin/employees', icon: Users },
        { label: 'Audit Reports', path: '/finance/reports', icon: FileText },
      ];
    }
    if (currentRole === 'vendor') {
      return [
        { label: 'Live Orders', path: '/vendor/dashboard', icon: LayoutDashboard },
        { label: 'Handover & OTP', path: '/vendor/orders', icon: Package },
        { label: 'Menu & Pricing', path: '/vendor/menu', icon: UtensilsCrossed },
        { label: 'Payout Settlements', path: '/finance/settlements', icon: CreditCard },
      ];
    }
    if (currentRole === 'kitchen_staff') {
      return [
        { label: 'Kitchen Display (KDS)', path: '/kitchen', icon: Clock },
        { label: 'Order Handover', path: '/vendor/orders', icon: Package },
        { label: 'Kitchen Inventory', path: '/kitchen#inventory', icon: Store },
      ];
    }
    if (currentRole === 'admin') {
      return [
        { label: 'Campus Analytics', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Cafeteria Counters', path: '/admin/vendors', icon: Store },
        { label: 'Employee Directory', path: '/admin/users', icon: Users },
        { label: 'All Orders', path: '/admin/orders', icon: Package },
        { label: 'Finance & Payouts', path: '/finance/settlements', icon: CreditCard },
      ];
    }
    // Default Customer / Employee
    return [
      { label: 'Cafeteria Food Court', path: '/', icon: UtensilsCrossed },
      { label: 'My Orders & OTP', path: '/orders', icon: Package },
      { label: 'Employee Wallet', path: '/wallet', icon: Wallet },
      { label: 'Profile & Settings', path: '/profile', icon: Users },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Enterprise Announcement / Switcher Bar */}
      <header className="sticky top-0 z-40 bg-[#0F172A] text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Identity & Active Facility Pill */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black tracking-tight text-white leading-none">
                    Platos
                  </span>
                  <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-0.5">
                    Enterprise SaaS
                  </span>
                </div>
              </Link>

              {/* Campus Facility Location Selector */}
              <div className="hidden lg:flex items-center gap-2 pl-4 ml-4 border-l border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400">Campus:</span>
                <div className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-800/80 text-xs font-bold text-slate-200 border border-slate-700/60">
                  <Building2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>{activeCafeteria}</span>
                </div>
              </div>
            </div>

            {/* Center: Live Role Pill & 1-Click Persona Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-xs font-bold text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-xs"
                title="Click to switch live testing personas"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="capitalize">{currentRole.replace('_', ' ')}</span>
                <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 uppercase tracking-wider font-extrabold">
                  {user?.company || 'Platos'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Persona Switcher Dropdown */}
              {roleSwitcherOpen && (
                <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 text-slate-900 animate-in fade-in duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Interactive Role Switcher
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      1-click switch to test any stakeholder portal
                    </p>
                  </div>
                  <div className="py-1 max-h-72 overflow-y-auto">
                    {demoPersonas.map((p) => {
                      const isActive = user?.email === p.email;
                      return (
                        <button
                          key={p.email}
                          type="button"
                          onClick={() => handleSwitchPersona(p)}
                          className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${
                            isActive ? 'bg-orange-50/70 border-l-3 border-[#FF6B35]' : ''
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">
                              {p.label}
                            </p>
                            <p className="text-[10px] text-slate-400">{p.badge}</p>
                          </div>
                          {isActive ? (
                            <span className="text-[10px] font-black text-orange-600 px-1.5 py-0.5 rounded bg-orange-100">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700">
                              Switch →
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Actions, Wallet Balance, Notifications & Profile */}
            <div className="flex items-center gap-2.5">
              {/* Employee Wallet Balance Pill */}
              {currentRole === 'customer' && (
                <Link
                  to="/wallet"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-black tabular-nums transition-colors"
                  title="Corporate Food Wallet"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>₹{Number(user?.wallet_balance || 0).toFixed(0)}</span>
                </Link>
              )}

              {/* Cart Button */}
              {currentRole === 'customer' && (
                <Link
                  to="/cart"
                  className="relative inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs font-black transition-colors"
                >
                  <Package className="w-3.5 h-3.5 text-orange-400" />
                  <span>{cartCount > 0 ? `₹${cartTotal.toFixed(0)}` : 'Cart'}</span>
                  {cartCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#FF6B35] text-white text-[9px] font-black flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Quick Sign Out */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-300 flex items-center justify-center border border-slate-700 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Drawer Hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden h-9 w-9 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center border border-slate-700"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#0F172A] px-4 py-3 space-y-1 animate-in fade-in duration-150">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-[#FF6B35] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sticky Sidebar Navigation */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-6">
            {/* User Info Tile */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-black text-sm flex items-center justify-center shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                  {currentRole.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 mb-2">
                Portal Navigation
              </p>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-3.5 h-10 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#0F172A] text-white shadow-md shadow-slate-900/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Enterprise Support Pill */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-100 text-[11px] text-slate-700 space-y-1">
              <p className="font-extrabold text-orange-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Enterprise SLA Active
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                24/7 dedicated campus cafeteria kitchen operations & subsidy dispatch.
              </p>
            </div>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
