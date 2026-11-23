import VegBadge from './VegBadge';
import ItemQuantityStepper from './ItemQuantityStepper';
import { Clock, Sparkles } from 'lucide-react';

export default function FoodItemCard({
  item,
  quantity = 0,
  onIncrement,
  onDecrement,
  onAdd,
  onClick,
}) {
  const hasAddons = item.addons && item.addons.length > 0;
  const isAvailable = item.is_available !== 0;

  // Fallback food imagery if image is missing or broken
  const fallbackImage = item.is_veg
    ? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80';

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer select-none ${
        !isAvailable ? 'opacity-60 grayscale-[30%]' : ''
      }`}
    >
      {/* 4:3 Aspect Ratio Image Frame with Overflow Hidden */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        <img
          src={item.image || fallbackImage}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackImage;
          }}
        />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <div className="p-1 rounded-md bg-white/95 backdrop-blur-xs shadow-xs">
            <VegBadge isVeg={item.is_veg} size="md" />
          </div>
          {item.is_bestseller ? (
            <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] uppercase tracking-wider shadow-sm">
              <Sparkles className="w-2.5 h-2.5 fill-current" />
              Bestseller
            </span>
          ) : null}
        </div>

        {/* Prep Time Tag */}
        {item.prep_time && (
          <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-900/75 backdrop-blur-sm text-white text-[11px] font-medium shadow-xs">
            <Clock className="w-3 h-3 text-orange-300" />
            <span>{item.prep_time} min</span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-white text-gray-900 font-extrabold text-xs uppercase tracking-wider shadow-md">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Card Content & Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-1">
          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-[#FF6B35] transition-colors">
            {item.name}
          </h3>
          {item.vendor_name && (
            <p className="text-[11px] font-medium text-gray-400 truncate mt-0.5">
              {item.vendor_name}
            </p>
          )}
        </div>

        {/* Calculated min-height description to keep bottom row mathematically aligned */}
        <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px] mb-3 leading-relaxed">
          {item.description || 'Prepared fresh in the cafeteria live counter with standard hygienic ingredients.'}
        </p>

        {/* Bottom Action Row */}
        <div className="mt-auto pt-2.5 border-t border-gray-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base font-black text-[#004E89] tracking-tight">
              ₹{Number(item.price).toFixed(0)}
            </span>
            {hasAddons && (
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Customizable
              </span>
            )}
          </div>

          <ItemQuantityStepper
            quantity={quantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            onAdd={onAdd}
            disabled={!isAvailable}
          />
        </div>
      </div>
    </div>
  );
}
