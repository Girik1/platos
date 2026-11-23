import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};

// Generate deterministic cart item ID based on item ID and sorted addon IDs
export const getCartItemId = (itemId, addons = []) => {
  const addonIds = (addons || [])
    .map(a => a.id || a.name)
    .sort()
    .join('_');
  return `${itemId}${addonIds ? `__${addonIds}` : ''}`;
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('platos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep localStorage in sync
  useEffect(() => {
    try {
      localStorage.setItem('platos_cart', JSON.stringify(items));
    } catch {
      // storage full or disabled
    }
  }, [items]);

  // Calculate unit price for a single item + its selected addons
  const getItemUnitPrice = useCallback((item) => {
    const basePrice = Number(item.price) || 0;
    const addonSum = (item.addons || []).reduce(
      (sum, ad) => sum + (Number(ad.price) || 0),
      0
    );
    return basePrice + addonSum;
  }, []);

  // Calculate total price for a cart line (unit price * quantity)
  const getItemTotalPrice = useCallback((item) => {
    return getItemUnitPrice(item) * (Number(item.quantity) || 1);
  }, [getItemUnitPrice]);

  // Add item to cart or increment existing matching line
  const addToCart = useCallback((item, quantity = 1, addons = [], specialInstructions = '') => {
    const key = getCartItemId(item.id, addons);
    const qtyToAdd = Math.max(1, Number(quantity) || 1);

    setItems(prev => {
      // Check vendor consistency (all items must belong to the same vendor)
      if (prev.length > 0 && item.vendor_id && prev[0].vendor_id && prev[0].vendor_id !== item.vendor_id) {
        toast.error(`Your cart contains items from ${prev[0].vendor_name || 'another cafeteria'}. Please clear cart or complete that order first.`);
        return prev;
      }

      const existingIndex = prev.findIndex(i => i.cartItemId === key);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qtyToAdd,
          specialInstructions: specialInstructions || updated[existingIndex].specialInstructions,
        };
        toast.success(`Updated ${item.name} quantity (${updated[existingIndex].quantity})`);
        return updated;
      }

      toast.success(`${item.name} added to cart`);
      return [
        ...prev,
        {
          ...item,
          cartItemId: key,
          quantity: qtyToAdd,
          addons: addons || [],
          specialInstructions: specialInstructions || '',
        },
      ];
    });
  }, []);

  // Remove specific item by cartItemId
  const removeFromCart = useCallback((cartItemId) => {
    setItems(prev => {
      const item = prev.find(i => i.cartItemId === cartItemId);
      if (item) toast.success(`${item.name} removed from cart`);
      return prev.filter(i => i.cartItemId !== cartItemId);
    });
  }, []);

  // Set quantity directly
  const updateQuantity = useCallback((cartItemId, quantity) => {
    const numQty = Number(quantity);
    if (numQty <= 0) {
      setItems(prev => prev.filter(i => i.cartItemId !== cartItemId));
      return;
    }
    setItems(prev =>
      prev.map(i => (i.cartItemId === cartItemId ? { ...i, quantity: numQty } : i))
    );
  }, []);

  // Quick increment by menu item ID (increments base item without addons)
  const quickIncrement = useCallback((item) => {
    addToCart(item, 1, [], '');
  }, [addToCart]);

  // Quick decrement by menu item ID (decrements the first matching line for this item)
  const quickDecrement = useCallback((itemId) => {
    setItems(prev => {
      const match = prev.find(i => i.id === itemId || i.menu_item_id === itemId);
      if (!match) return prev;
      if (match.quantity <= 1) {
        toast.success(`${match.name} removed`);
        return prev.filter(i => i.cartItemId !== match.cartItemId);
      }
      return prev.map(i =>
        i.cartItemId === match.cartItemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  // Total quantity of a specific menu item currently in cart
  const getItemQuantity = useCallback((itemId) => {
    return items
      .filter(i => i.id === itemId || i.menu_item_id === itemId)
      .reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  }, [items]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Financial calculations
  const cartSubtotal = items.reduce((sum, item) => sum + getItemTotalPrice(item), 0);
  const cartCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        quickIncrement,
        quickDecrement,
        getItemQuantity,
        getItemUnitPrice,
        getItemTotalPrice,
        clearCart,
        cartTotal: cartSubtotal,
        cartSubtotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
