import { Minus, Plus } from 'lucide-react';

export default function ItemQuantityStepper({
  quantity = 0,
  onIncrement,
  onDecrement,
  onAdd,
  disabled = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider select-none">
        Out of stock
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
        className={`inline-flex items-center justify-center gap-1.5 h-[34px] px-4 rounded-lg bg-white border border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-md active:scale-95 transition-all duration-150 select-none ${className}`}
      >
        <span>ADD</span>
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-between h-[34px] w-[96px] p-0.5 rounded-lg bg-[#FFF5F1] border border-[#FFD2C2] shadow-xs select-none ${className}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        aria-label="Decrease quantity"
        className="w-7 h-7 rounded-md bg-white hover:bg-orange-100 flex items-center justify-center text-[#FF6B35] shadow-xs active:scale-90 transition-transform duration-100 cursor-pointer"
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <span className="w-8 text-center text-xs font-extrabold text-[#1A1A2E] tabular-nums">
        {quantity}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
        aria-label="Increase quantity"
        className="w-7 h-7 rounded-md bg-[#FF6B35] hover:bg-[#e55a28] flex items-center justify-center text-white shadow-xs active:scale-90 transition-transform duration-100 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}
