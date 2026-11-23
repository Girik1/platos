export default function VegBadge({ isVeg, size = 'md', className = '' }) {
  const isVegetarian = Boolean(isVeg);

  // Exact mathematical sizing
  const dimensions = {
    sm: { box: 'w-3.5 h-3.5', inner: 'w-1.5 h-1.5' },
    md: { box: 'w-4 h-4', inner: 'w-2 h-2' },
    lg: { box: 'w-5 h-5', inner: 'w-2.5 h-2.5' },
  }[size] || { box: 'w-4 h-4', inner: 'w-2 h-2' };

  return (
    <div
      title={isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
      className={`inline-flex items-center justify-center border-[1.5px] rounded-[3px] bg-white shadow-xs shrink-0 ${dimensions.box} ${
        isVegetarian ? 'border-emerald-600' : 'border-red-600'
      } ${className}`}
    >
      {isVegetarian ? (
        <span className={`rounded-full bg-emerald-600 ${dimensions.inner}`} />
      ) : (
        <span
          className={`border-solid border-red-600 border-x-transparent border-t-transparent ${
            size === 'sm' ? 'border-b-[5px] border-x-[3px]' : size === 'lg' ? 'border-b-[7px] border-x-[5px]' : 'border-b-[6px] border-x-[4px]'
          }`}
        />
      )}
    </div>
  );
}
