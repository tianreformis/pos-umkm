import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState { user: User | null; token: string | null; setAuth: (u: User, t: string) => void; logout: () => void; }
export const useAuthStore = create<AuthState>()(persist((set) => ({
  user: null, token: null,
  setAuth: (user, token) => { localStorage.setItem('token', token); set({ user, token }); },
  logout: () => { localStorage.removeItem('token'); set({ user: null, token: null }); }
}), { name: 'auth' }));

interface CartItem { productId: number; product: any; quantity: number; price: number; subtotal: number; }
interface CartState {
  items: CartItem[]; discount: number; tax: number;
  addItem: (product: any, qty?: number) => void;
  removeItem: (pid: number) => void;
  updateQty: (pid: number, qty: number) => void;
  setDiscount: (d: number) => void; setTax: (t: number) => void;
  clear: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}
export const useCartStore = create<CartState>()((set, get) => ({
  items: [], discount: 0, tax: 10,
  addItem: (product, qty = 1) => {
    const items = get().items;
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      set({ items: items.map(i => i.productId === product.id ? { ...i, quantity: Math.min(i.quantity + qty, product.stock), subtotal: Math.min(i.quantity + qty, product.stock) * product.price } : i) });
    } else {
      set({ items: [...items, { productId: product.id, product, quantity: qty, price: product.price, subtotal: qty * product.price }] });
    }
  },
  removeItem: (pid) => set({ items: get().items.filter(i => i.productId !== pid) }),
  updateQty: (pid, qty) => set({ items: get().items.map(i => i.productId === pid ? { ...i, quantity: Math.max(0, qty), subtotal: Math.max(0, qty) * i.price } : i).filter(i => i.quantity > 0) }),
  setDiscount: (d) => set({ discount: d }), setTax: (t) => set({ tax: t }),
  clear: () => set({ items: [], discount: 0, tax: 10 }),
  getSubtotal: () => get().items.reduce((s, i) => s + i.subtotal, 0),
  getTotal: () => { const s = get().getSubtotal(); return s - get().discount + (s - get().discount) * (get().tax / 100); }
}));

interface UIState { darkMode: boolean; toggleDarkMode: () => void; }
export const useUIStore = create<UIState>()(persist((set) => ({
  darkMode: false, toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode }))
}), { name: 'ui' }));