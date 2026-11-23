import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Star, Clock, ArrowLeft, Leaf, Store } from 'lucide-react';
import API from '../../api/axios';
import { useCart } from '../../contexts/CartContext';
import FoodItemCard from '../../components/common/FoodItemCard';
import ItemDetailModal from './ItemDetailModal';
import FloatingCartBar from '../../components/common/FloatingCartBar';

export default function MenuPage() {
  const { id: vendorId } = useParams();
  const navigate = useNavigate();
  const { getItemQuantity, quickIncrement, quickDecrement } = useCart();

  const [vendor, setVendor] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchVendorMenu();
  }, [vendorId]);

  const fetchVendorMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/vendors/${vendorId}`);
      const data = res.data;
      const v = data.vendor || data;
      setVendor(v);

      const cats = data.menu || [];
      setCategories(cats);

      // Flatten items while preserving vendor information and category IDs
      const allItems = cats.flatMap(c =>
        (c.items || []).map(i => ({
          ...i,
          category_id: c.id,
          category_name: c.name,
          vendor_id: v.id,
          vendor_name: v.name,
        }))
      );
      setMenuItems(allItems);

      if (cats.length > 0) {
        setActiveCategoryId(cats[0].id);
      }
    } catch {
      setError('Unable to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mathematical filtering
  const filteredItems = useMemo(() => {
    let result = menuItems;

    if (activeCategoryId !== 'all') {
      result = result.filter(item => item.category_id === activeCategoryId);
    }

    if (vegOnly) {
      result = result.filter(item => Boolean(item.is_veg));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [menuItems, activeCategoryId, vegOnly, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-11 h-11 border-[3.5px] border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-700">Loading Cafeteria Kitchen...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center bg-gray-50">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Cafeteria Not Found</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-5">{error || 'This kitchen is currently unavailable.'}</p>
        <button
          onClick={() => navigate('/')}
          className="h-10 px-5 rounded-xl bg-[#FF6B35] text-white font-semibold text-sm shadow-sm transition-colors"
        >
          Back to Cafeterias
        </button>
      </div>
    );
  }

  const isOpen = Boolean(vendor.is_active);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Vendor Cover Banner with Mathematical 21:9 Aspect Ratio on desktop */}
      <div className="relative w-full h-48 md:h-64 bg-gray-900 overflow-hidden">
        <img
          src={vendor.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80'}
          alt={vendor.name}
          className="w-full h-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 h-9 w-9 rounded-xl bg-white/90 backdrop-blur-md text-gray-800 hover:bg-white flex items-center justify-center shadow-md transition-all active:scale-95"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Header Info Overlay */}
        <div className="absolute bottom-5 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-bold shadow-xs ${
                    isOpen ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-white' : 'bg-gray-400'}`} />
                  {isOpen ? 'Kitchen Open' : 'Closed'}
                </span>
                <span className="text-xs text-gray-300">
                  {vendor.cuisine_type || 'Campus Food Hall'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                {vendor.name}
              </h1>
            </div>

            {/* Rating & Timings Pills */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 h-8 px-3 rounded-xl bg-white/15 backdrop-blur-md text-xs font-black border border-white/10">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{vendor.rating ? Number(vendor.rating).toFixed(1) : '4.5'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/15 backdrop-blur-md text-xs font-medium border border-white/10 text-gray-200">
                <Clock className="w-3.5 h-3.5 text-orange-300" />
                <span>{vendor.opening_time || '07:30'} – {vendor.closing_time || '21:30'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Strip (Search & Filter) */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1 h-10">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${vendor.name} menu...`}
                className="w-full h-full pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all"
              />
            </div>

            {/* Veg Only Toggle Button */}
            <button
              type="button"
              onClick={() => setVegOnly(!vegOnly)}
              className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border shrink-0 ${
                vegOnly
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
              }`}
            >
              <Leaf className={`w-4 h-4 ${vegOnly ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span>Veg Only</span>
            </button>
          </div>

          {/* Category Tabs (Mathematical Horizontal Rhythm) */}
          {categories.length > 0 && !searchQuery && (
            <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-hide border-t border-gray-100 mt-3">
              <button
                type="button"
                onClick={() => setActiveCategoryId('all')}
                className={`h-8 px-3.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryId === 'all'
                    ? 'bg-[#004E89] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({menuItems.length})
              </button>
              {categories.map((cat) => {
                const count = (cat.items || []).length;
                const isActive = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`h-8 px-3.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#004E89] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`ml-1 text-[11px] font-normal ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <span className="text-4xl block mb-2">🍽️</span>
            <h3 className="text-base font-bold text-gray-900 mb-1">No items found</h3>
            <p className="text-xs text-gray-500 mb-4">
              {vegOnly ? 'No vegetarian items found in this section.' : 'No dishes matched your filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setVegOnly(false);
                setSearchQuery('');
                setActiveCategoryId('all');
              }}
              className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs"
            >
              Reset Filters
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
      </div>

      {/* Item Customization Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar />
    </div>
  );
}
