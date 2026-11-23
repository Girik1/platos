import { ChefHat, Heart, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B35] to-[#e55a28] rounded-xl flex items-center justify-center text-white shadow-sm">
                <ChefHat className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1A1A2E]">Platos</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Cafeteria Redefined. Order contactless meals, track kitchen prep in real-time, and skip cafeteria queues.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
              <ShieldCheck className="w-4 h-4" /> 100% Cashless & Hygienic
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/" className="hover:text-[#FF6B35] transition-colors">Cafeteria Menu</Link></li>
              <li><Link to="/orders" className="hover:text-[#FF6B35] transition-colors">Track Orders</Link></li>
              <li><Link to="/cart" className="hover:text-[#FF6B35] transition-colors">My Cart</Link></li>
              <li><Link to="/profile" className="hover:text-[#FF6B35] transition-colors">Corporate Wallet</Link></li>
            </ul>
          </div>

          {/* For Partners */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Portals</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/vendor/dashboard" className="hover:text-[#FF6B35] transition-colors">Vendor KDS Portal</Link></li>
              <li><Link to="/admin/dashboard" className="hover:text-[#FF6B35] transition-colors">Enterprise Admin</Link></li>
              <li><Link to="/login" className="hover:text-[#FF6B35] transition-colors">Staff Login</Link></li>
              <li><Link to="/register" className="hover:text-[#FF6B35] transition-colors">Employee Onboarding</Link></li>
            </ul>
          </div>

          {/* Corporate Benefits */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Corporate Perks</h4>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Zero wait-time pickup with OTP & QR</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#004E89]" />
                <span>Company meal subsidy integration</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Live kitchen status & notifications</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Platos Technologies Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for modern smart cafeterias
          </p>
        </div>
      </div>
    </footer>
  );
}