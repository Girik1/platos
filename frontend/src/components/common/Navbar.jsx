import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Menu,
  X,
  ChefHat,
  LogOut,
  Package,
  UserCircle,
  LayoutDashboard,
  UtensilsCrossed,
  Wallet,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, cartTotal } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'vendor') return '/vendor/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/';
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <Link to={getDashboardLink()} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#e55a28] rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-150">
              <ChefHat className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-[#1A1A2E] leading-none">
                Platos
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                Cafeteria Tech
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {user?.role === 'customer' && (
              <>
                <Link
                  to="/"
                  className="h-9 px-3.5 rounded-lg text-xs font-bold text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50/50 flex items-center transition-colors"
                >
                  Campus Menu
                </Link>
                <Link
                  to="/orders"
                  className="h-9 px-3.5 rounded-lg text-xs font-bold text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50/50 flex items-center transition-colors"
                >
                  My Orders
                </Link>
              </>
            )}

            {user?.role === 'vendor' && (
              <>
                <Link
                  to="/vendor/dashboard"
                  className="h-9 px-3.5 rounded-lg text-xs font-bold text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50/50 flex items-center transition-colors"
                >
                  Live Kitchen KDS
                </Link>
                <Link
                  to="/vendor/orders"
                  className="h-9 px-3.5 rounded-lg text-xs font-bold text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50/50 flex items-center transition-colors"
                >
                  Order Handover
                </Link>
                <Link
                  to="/vendor/menu"
                  className="h-9 px-3.5 rounded-lg text-xs font-bold text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50/50 flex items-center transition-colors"
                >
                  Menu & Pricing
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="h-9 px-3.5 rounded-lg text-xs font-bold text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50/50 flex items-center transition-colors"
                >
                  Analytics
                </Link>
                <Link
                  to="/admin/vendors"
                  className="h-9 px-3.5 rounded-lg text-xs font-bold text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50/50 flex items-center transition-colors"
                >
                  Cafeterias
                </Link>
                <Link
                  to="/admin/users"
                  className="h-9 px-3.5 rounded-lg text-xs font-bold text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50/50 flex items-center transition-colors"
                >
                  Users & Subsidies
                </Link>
                <Link
                  to="/admin/orders"
                  className="h-9 px-3.5 rounded-lg text-xs font-bold text-gray-700 hover:text-[#FF6B35] hover:bg-orange-50/50 flex items-center transition-colors"
                >
                  All Orders
                </Link>
              </>
            )}
          </div>

          {/* Right Action Icons & User Dropdown */}
          <div className="flex items-center gap-3">
            {/* Employee Wallet Balance Badge */}
            {isAuthenticated && user?.role === 'customer' && (
              <div
                title="Employee Cafeteria Wallet"
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-extrabold tabular-nums select-none"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>₹{Number(user.wallet_balance || 0).toFixed(0)}</span>
              </div>
            )}

            {/* Cart Icon & Badge */}
            {isAuthenticated && user?.role === 'customer' && (
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="relative h-10 px-3 rounded-xl bg-orange-50 text-[#FF6B35] hover:bg-orange-100/80 flex items-center gap-2 transition-all cursor-pointer select-none"
                aria-label="View Cart"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-xs font-black tabular-nums">
                  {cartCount > 0 ? `₹${cartTotal.toFixed(0)}` : 'Cart'}
                </span>
                {cartCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            )}

            {/* User Dropdown */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer select-none"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A1A2E] to-[#004E89] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-extrabold text-sm text-gray-900 leading-tight">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-[#FF6B35] uppercase tracking-wider">
                          {user?.role}
                        </span>
                        {user?.company && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            {user.company}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <UserCircle className="w-4 h-4 text-gray-400" /> My Profile
                      </Link>

                      {user?.role === 'customer' && (
                        <Link
                          to="/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Package className="w-4 h-4 text-gray-400" /> Order History
                        </Link>
                      )}

                      {user?.role === 'vendor' && (
                        <>
                          <Link
                            to="/vendor/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <LayoutDashboard className="w-4 h-4 text-gray-400" /> Kitchen Orders
                          </Link>
                          <Link
                            to="/vendor/menu"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <UtensilsCrossed className="w-4 h-4 text-gray-400" /> Manage Menu
                          </Link>
                        </>
                      )}

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" /> Admin Console
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="h-9 px-4 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white text-xs font-bold uppercase tracking-wider flex items-center shadow-xs transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="md:hidden p-2 text-gray-600 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Navigation"
            >
              {menuOpen ? <X className="w-5 h-5 text-gray-800" /> : <Menu className="w-5 h-5 text-gray-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          {isAuthenticated ? (
            <>
              {/* User Identity Card */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1A1A2E] to-[#004E89] text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-100 text-[#FF6B35] uppercase tracking-wider">
                        {user?.role}
                      </span>
                      {user?.company && (
                        <span className="text-[10px] font-bold text-gray-500">
                          {user.company}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {user?.role === 'customer' && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Food Wallet</span>
                    <span className="text-sm font-black text-emerald-700">₹{Number(user?.wallet_balance || 0).toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* Navigation Options */}
              <div className="space-y-1">
                {user?.role === 'customer' && (
                  <>
                    <Link
                      to="/"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                      <span>Campus Menu & Food Courts</span>
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <Package className="w-4 h-4 text-orange-500" />
                      <span>My Orders & Live Pickup</span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <UserCircle className="w-4 h-4 text-orange-500" />
                      <span>My Profile</span>
                    </Link>
                  </>
                )}

                {user?.role === 'vendor' && (
                  <>
                    <Link
                      to="/vendor/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-orange-500" />
                      <span>Live Kitchen KDS</span>
                    </Link>
                    <Link
                      to="/vendor/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <Package className="w-4 h-4 text-orange-500" />
                      <span>Order Handover & OTP</span>
                    </Link>
                    <Link
                      to="/vendor/menu"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                      <span>Menu & Pricing</span>
                    </Link>
                  </>
                )}

                {user?.role === 'admin' && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-orange-500" />
                      <span>Analytics Dashboard</span>
                    </Link>
                    <Link
                      to="/admin/vendors"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-orange-500" />
                      <span>Cafeterias & Vendors</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <UserCircle className="w-4 h-4 text-orange-500" />
                      <span>Users & Meal Subsidies</span>
                    </Link>
                    <Link
                      to="/admin/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 h-11 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <Package className="w-4 h-4 text-orange-500" />
                      <span>All Cafeteria Orders</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Sign Out CTA */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full h-11 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-xs text-gray-500">Sign in to order and redeem your corporate meal subsidy.</p>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="w-full h-11 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center shadow-md transition-colors"
              >
                Sign In / Demo Login
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
