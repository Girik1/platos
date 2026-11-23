import { Minus, Plus } from 'lucide-react';

export default function ItemQuantityStepper({
  quantity = 0,
  onIncrement,
  onDecrement,
  onAdd,
  disabled = false,
  size = 'md',
  className = '',
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center justify-center h-9 w-[100px] rounded-xl bg-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider select-none">
        Sold Out
      </span>
    );
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAdd ? onAdd() : onIncrement();
        }}
        className={`inline-flex items-center justify-center gap-1.5 h-9 w-[100px] rounded-xl bg-white hover:bg-[#FF6B35] border-2 border-[#FF6B35] text-[#FF6B35] hover:text-white font-black text-xs uppercase tracking-wider shadow-xs hover:shadow-md active:scale-95 transition-all duration-150 select-none cursor-pointer ${className}`}
      >
        <span>ADD</span>
        <Plus className="w-3.5 h-3.5 stroke-[3]" />
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-between h-9 w-[100px] p-1 rounded-xl bg-orange-50 border-2 border-orange-200/90 shadow-xs select-none ${className}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        aria-label="Decrease quantity"
        className="w-7 h-7 rounded-lg bg-white hover:bg-orange-100 flex items-center justify-center text-[#FF6B35] shadow-xs active:scale-90 transition-transform duration-100 cursor-pointer"
      >
        <Minus className="w-3.5 h-3.5 stroke-[3]" />
      </button>

      <span className="w-8 text-center text-xs font-black text-gray-900 tabular-nums">
        {quantity}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
        aria-label="Increase quantity"
        className="w-7 h-7 rounded-lg bg-[#FF6B35] hover:bg-[#e55a28] flex items-center justify-center text-white shadow-xs active:scale-90 transition-transform duration-100 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 stroke-[3]" />
      </button>
    </div>
  );
}
