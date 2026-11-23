import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, Mail, Lock, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'vendor') navigate('/vendor/dashboard');
      else navigate(from === '/login' ? '/' : from);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    try {
      setLoading(true);
      const user = await login(demoEmail, demoPassword);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'vendor') navigate('/vendor/dashboard');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-blue-50/40 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#e55a28] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <ChefHat className="w-7 h-7" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-[#1A1A2E]">Platos</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to order from your corporate cafeteria</p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
          {/* Quick Demo Logins Pill */}
          <div className="mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" /> Quick Demo Logins:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('user1@platos.com', 'user123')}
                className="px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-orange-50 text-gray-700 hover:text-[#FF6B35] border border-gray-200 rounded-lg transition-colors text-center shadow-xs"
              >
                👤 Employee
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('vendor1@platos.com', 'vendor123')}
                className="px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-orange-50 text-gray-700 hover:text-[#FF6B35] border border-gray-200 rounded-lg transition-colors text-center shadow-xs"
              >
                🍳 Vendor
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@platos.com', 'admin123')}
                className="px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-blue-50 text-gray-700 hover:text-[#004E89] border border-gray-200 rounded-lg transition-colors text-center shadow-xs"
              >
                ⚡ Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-gray-400">Default: user123</span>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#e55a28] hover:from-[#e55a28] hover:to-[#c84618] text-white font-semibold rounded-xl text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              New to Platos?{' '}
              <Link to="/register" className="font-semibold text-[#FF6B35] hover:underline">
                Create an employee account
              </Link>
            </p>
          </div>
        </div>

        {/* Corporate Trust Banner */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span>Corporate Cafeteria Network</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted & Cashless</span>
          </div>
        </div>
      </div>
    </div>
  );
}