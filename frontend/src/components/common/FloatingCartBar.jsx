import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export default function FloatingCartBar() {
  const navigate = useNavigate();
  const { cartCount, cartTotal } = useCart();

  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-xl z-40 select-none pb-[env(safe-area-inset-bottom,0px)]">
      <button
        type="button"
        onClick={() => navigate('/cart')}
        className="w-full h-14 px-4 sm:px-5 rounded-2xl bg-[#1A1A2E] text-white shadow-2xl shadow-black/40 border border-gray-800 hover:bg-gray-900 active:scale-[0.99] transition-all duration-150 flex items-center justify-between group cursor-pointer"
      >
        {/* Left Side: Items Count & Total */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg bg-[#FF6B35] text-white font-black text-xs tabular-nums shadow-xs">
            {cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'}
          </span>
          <div className="flex flex-col text-left">
            <span className="text-sm sm:text-base font-black text-white tracking-tight">
              ₹{cartTotal.toFixed(0)}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              Tap to review & checkout
            </span>
          </div>
        </div>

        {/* Right Side: View Cart Action */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-orange-400 group-hover:text-orange-300 transition-colors">
          <ShoppingBag className="w-4 h-4 text-orange-400" />
          <span>View Cart</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    </div>
  );
}
