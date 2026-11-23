import { useState, useEffect, useMemo } from 'react';
import { X, Minus, Plus, ShoppingBag, Clock } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import VegBadge from '../../components/common/VegBadge';

export default function ItemDetailModal({ item, isOpen, onClose }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedAddons([]);
      setSpecialInstructions('');
    }
  }, [isOpen, item?.id]);

  // Fallback image
  const fallbackImage = item?.is_veg
    ? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80';

  // Mathematical price calculations
  const addons = item?.addons || [];

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.some(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const addonsTotal = useMemo(() => {
    return selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  }, [selectedAddons]);

  const unitPrice = (Number(item?.price) || 0) + addonsTotal;
  const grandTotal = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!item) return;
    addToCart(item, quantity, selectedAddons, specialInstructions);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog with Mathematical 16px Radius Geometry */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Image Header (Fixed 16:9 Frame) */}
        <div className="relative w-full h-52 sm:h-60 bg-gray-900 shrink-0 overflow-hidden">
          <img
            src={item.image || fallbackImage}
            alt={item.name}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackImage;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          {/* Floating Badges */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-white shadow-xs">
                <VegBadge isVeg={item.is_veg} size="md" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
              </span>
            </div>

            {item.prep_time && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-semibold text-orange-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{item.prep_time} mins prep</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Title & Base Price */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                {item.name}
              </h2>
              {item.vendor_name && (
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Counter: {item.vendor_name}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-[#004E89]">
                ₹{Number(item.price).toFixed(0)}
              </span>
              <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Base Price
              </span>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
              {item.description}
            </p>
          )}

          {/* Add-ons Checklist */}
          {addons.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Available Add-ons
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">Select any</span>
              </div>

              <div className="space-y-2">
                {addons.map((addon) => {
                  const isChecked = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between h-12 px-4 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'border-[#FF6B35] bg-[#FFF8F5] shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addon)}
                          className="w-4 h-4 text-[#FF6B35] rounded-sm focus:ring-[#FF6B35] border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-gray-800">
                          {addon.name}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#004E89] tabular-nums">
                        +₹{Number(addon.price).toFixed(0)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Instructions */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Special Kitchen Request (Optional)
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, keep chutney separate, extra hot..."
              rows={2}
              maxLength={150}
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none placeholder-gray-400"
            />
          </div>

          {/* Quantity Selector Section */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Quantity</span>
              <span className="text-[11px] text-gray-400">₹{unitPrice.toFixed(0)} each</span>
            </div>

            <div className="inline-flex items-center h-9 px-1 rounded-lg bg-white border border-gray-200 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="w-8 text-center text-sm font-extrabold text-gray-900 tabular-nums">
                {quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 rounded-md bg-[#FF6B35] text-white flex items-center justify-center hover:bg-[#e55a28] cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer with Engineered CTA Button */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full h-12 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-between px-5 shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </div>
            <span className="text-base font-black tabular-nums">
              ₹{grandTotal.toFixed(0)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
