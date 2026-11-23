import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Star, Clock, ChevronRight, Store, Sparkles, Building2, ShieldCheck, X } from 'lucide-react';
import API from '../../api/axios';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import FoodItemCard from '../../components/common/FoodItemCard';
import ItemDetailModal from './ItemDetailModal';
import FloatingCartBar from '../../components/common/FloatingCartBar';
import toast from 'react-hot-toast';

const categories = [
  { id: 'all', emoji: '🍽️', label: 'All Items' },
  { id: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { id: 'lunch', emoji: '🍛', label: 'Lunch' },
  { id: 'snacks', emoji: '🍿', label: 'Snacks' },
  { id: 'beverages', emoji: '☕', label: 'Beverages' },
  { id: 'desserts', emoji: '🍰', label: 'Desserts' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getItemQuantity, quickIncrement, quickDecrement } = useCart();

  const [popularItems, setPopularItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all', 'veg', 'nonveg'
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [popularRes, vendorsRes] = await Promise.all([
        API.get('/menu/popular'),
        API.get('/vendors'),
      ]);
      setPopularItems(popularRes.data?.items || []);
      setVendors(vendorsRes.data?.vendors || []);
    } catch {
      setError('Unable to load cafeteria items. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  // Determine current meal time slot mathematically
  const currentSlot = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 11) return { name: 'Breakfast Counter', hours: '07:30 - 11:00 AM', emoji: '🍳' };
    if (hour >= 11 && hour < 16) return { name: 'Lunch Counter', hours: '12:00 - 03:30 PM', emoji: '🍛' };
    if (hour >= 16 && hour < 19) return { name: 'Evening Snacks', hours: '04:00 - 07:00 PM', emoji: '🍿' };
    return { name: 'Dinner & Café', hours: '07:00 - 10:00 PM', emoji: '☕' };
  }, []);

  // Filter items based on active category, search, and dietary preference
  const filteredItems = useMemo(() => {
    let result = popularItems;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.category_name?.toLowerCase().includes(q) ||
        item.vendor_name?.toLowerCase().includes(q)
      );
    } else if (activeCategory !== 'all') {
      result = result.filter(item =>
        item.category_name?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (dietaryFilter === 'veg') {
      result = result.filter(item => Number(item.is_veg) === 1);
    } else if (dietaryFilter === 'nonveg') {
      result = result.filter(item => Number(item.is_veg) === 0);
    }

    return result;
  }, [popularItems, searchQuery, activeCategory, dietaryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if query matches a vendor directly
    const matchedVendor = vendors.find(v =>
      v.name?.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
    if (matchedVendor) {
      navigate(`/vendor/${matchedVendor.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-11 h-11 border-[3.5px] border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-700">Connecting to Campus Cafeterias...</p>
        <p className="text-xs text-gray-400 mt-1">Fetching live menus & kitchen availability</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center bg-gray-50">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Cafeteria Sync Error</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-5">{error}</p>
        <button
          onClick={fetchInitialData}
          className="h-10 px-5 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white font-semibold text-sm shadow-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Enterprise Campus Hero Banner */}
      <section className="relative bg-gradient-to-br from-[#1A1A2E] via-[#0F172A] to-[#004E89] text-white overflow-hidden">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 relative z-10">
          <div className="max-w-3xl">
            {/* Campus & Live Slot Pill */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-orange-300 border border-white/10">
                <Building2 className="w-3.5 h-3.5" />
                {user?.company ? `${user.company} Cafeteria Hub` : 'Corporate Food Services'}
              </span>
              <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {currentSlot.emoji} {currentSlot.name} ({currentSlot.hours})
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-3">
              Order Ahead.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                Zero Queue.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 mb-8 max-w-xl leading-relaxed">
              Skip lunch hour lines at your office cafeteria. Place your order online, get notified when it is ready, and collect with a secure OTP.
            </p>

            {/* Mathematically Proportioned Search Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl">
              <div className="relative h-[54px] rounded-2xl bg-white shadow-2xl flex items-center p-1.5 border border-white/20">
                <Search className="w-5 h-5 text-gray-400 ml-3.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes (e.g. Dosa, Biryani, Coffee) or cafeteria..."
                  className="w-full h-full pl-3 pr-2 text-xs sm:text-sm text-gray-900 bg-transparent focus:outline-none placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 text-gray-400 hover:text-gray-600 mr-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="h-10 px-3.5 sm:px-5 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white font-bold text-xs uppercase tracking-wider shrink-0 shadow-sm transition-all"
                >
                  <span className="hidden xs:inline sm:inline">Find Food</span>
                  <span className="xs:hidden sm:hidden">Find</span>
                </button>
              </div>
            </form>

            {/* Benefit Highlights */}
            <div className="flex flex-wrap items-center gap-6 mt-8 text-xs font-medium text-gray-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Cashless Counter
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-400" /> Average Prep Time: 12-15 Mins
              </span>
              {user?.company && (
                <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <Sparkles className="w-4 h-4" /> Company Meal Subsidy Enabled
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        {/* Category & Dietary Filter Pills */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery('');
                  }}
                  className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer select-none border ${
                    isActive
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-md shadow-orange-500/20'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50/40'
                  }`}
                >
                  <span className="text-sm">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Dietary Preference Toggles */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Diet:</span>
            <button
              type="button"
              onClick={() => setDietaryFilter('all')}
              className={`h-7 px-3 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                dietaryFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setDietaryFilter('veg')}
              className={`h-7 px-3 rounded-lg font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Pure Veg
            </button>
            <button
              type="button"
              onClick={() => setDietaryFilter('nonveg')}
              className={`h-7 px-3 rounded-lg font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                dietaryFilter === 'nonveg'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Non-Veg
            </button>
          </div>
        </section>

        {/* Cafeteria Counters (Vendors) */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Cafeteria Food Courts & Bistros
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Select a kitchen counter to browse their full menu
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vendors.map((vendor) => {
              const isOpen = Boolean(vendor.is_active);
              return (
                <Link
                  key={vendor.id}
                  to={`/vendor/${vendor.id}`}
                  className="group flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-200 overflow-hidden"
                >
                  {/* Fixed 16:9 Image Frame on mobile, 4:3 on desktop */}
                  <div className="relative w-full sm:w-48 aspect-[16/9] sm:aspect-square bg-gray-100 shrink-0 overflow-hidden">
                    <img
                      src={vendor.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'}
                      alt={vendor.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold shadow-xs ${
                          isOpen
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-800/90 text-gray-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-white' : 'bg-gray-400'}`} />
                        {isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                  </div>

                  {/* Vendor Details */}
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#FF6B35] transition-colors">
                          {vendor.name}
                        </h3>
                        <div className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-emerald-50 text-emerald-800 text-xs font-black">
                          <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                          <span>{vendor.rating ? Number(vendor.rating).toFixed(1) : '4.5'}</span>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-[#004E89] mb-1.5">
                        {vendor.cuisine_type || 'Multi-Cuisine Food Hall'}
                      </p>

                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                        {vendor.description || 'Authentic campus meals prepared fresh with standard ingredients.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{vendor.opening_time || '07:30'} – {vendor.closing_time || '21:30'}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-bold text-[#FF6B35] group-hover:translate-x-0.5 transition-transform">
                        Explore Menu <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Popular Dishes Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>{searchQuery ? `Search Results (${filteredItems.length})` : 'Popular Campus Specials 🔥'}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {searchQuery
                  ? `Showing items matching "${searchQuery}"`
                  : 'Highest rated dishes ordered by tech park employees today'}
              </p>
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-[#FF6B35] hover:underline self-start sm:self-auto"
              >
                Clear Search Filter
              </button>
            )}
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <span className="text-4xl block mb-3">🔍</span>
              <h3 className="text-base font-bold text-gray-900 mb-1">No items found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                We could not find any cafeteria item matching "{searchQuery}". Try searching for another dish.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => {
                const qty = getItemQuantity(item.id);
                return (
                  <FoodItemCard
                    key={item.id}
                    item={item}
                    quantity={qty}
                    onIncrement={() => quickIncrement(item)}
                    onDecrement={() => quickDecrement(item.id)}
                    onAdd={() => quickIncrement(item)}
                    onClick={() => setSelectedItem(item)}
                  />
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Item Customization Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Floating Bottom Cart Bar (Appears when cart has items) */}
      <FloatingCartBar />
    </div>
  );
}
