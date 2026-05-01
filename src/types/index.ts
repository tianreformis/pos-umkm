export interface User { id: number; email: string; name: string; role: 'ADMIN' | 'KASIR'; }
export interface Category { id: number; name: string; description?: string; products?: Product[]; }
export interface Product { id: number; name: string; description?: string; price: number; cost: number; stock: number; minStock: number; imageUrl?: string; categoryId?: number; category?: Category; createdAt?: string; }
export interface SaleItem { id: number; saleId: number; productId: number; product?: Product; quantity: number; price: number; subtotal: number; }
export interface Sale { id: number; items: SaleItem[]; subtotal: number; discount: number; tax: number; total: number; paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER'; amountPaid: number; change: number; userId: number; user?: { name: string }; createdAt: string; }
export interface CartItem { productId: number; product: Product; quantity: number; price: number; subtotal: number; }
export interface AIInsight { id: number; type: 'RESTOCK' | 'TREND' | 'FORECAST' | 'INSIGHT'; title: string; content: string; confidence: number; generatedAt: string; }