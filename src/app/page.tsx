'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { fetchApi, formatCurrency, formatDate } from '@/lib/api';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, 
  Moon, Sun, LogOut, Search, Plus, Minus, Trash2, TrendingUp, 
  Printer, Pencil, X, Users
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import type { Product, Sale, AIInsight } from '@/types';

export default function Home() {
  const { user, setAuth, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchApi('/api/auth').then(d => setAuth(d, token)).catch(() => {}).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);
  
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  
  if (!user) return <LoginPage onLogin={(u, t) => setAuth(u, t)} />;
  
  return <Dashboard user={user} onLogout={logout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
}

function LoginPage({ onLogin }: { onLogin: (u: any, t: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { const { token, user } = await fetchApi('/api/auth', { method: 'POST', body: JSON.stringify({ email, password }) }); onLogin(user, token); } 
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingCart className="w-8 h-8 text-primary-600" /></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">UMKN POS</h1>
          <p className="text-gray-500 dark:text-gray-400">Point of Sale untuk UMKM</p>
        </div>
        <form onSubmit={handle} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@umkn.com" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" required />
          <button type="submit" disabled={loading} className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg disabled:opacity-50">Masuk</button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">Demo: admin@umkn.com / admin123</p>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout, darkMode, toggleDarkMode }: { user: any; onLogout: () => void; darkMode: boolean; toggleDarkMode: () => void }) {
  const [tab, setTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(10);
  const [search, setSearch] = useState('');
  const [dailyData, setDailyData] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  
useEffect(() => {
    if (tab === 'dashboard') { fetchDaily(); fetchRecent(); fetchChartData().then(setChartData).catch(console.error); }
    if (tab === 'pos') fetchProducts();
    if (tab === 'reports') { /* handled in component */ }
    if (tab === 'ai') fetchInsights();
    if (tab === 'users') fetchUsers();
    if (tab === 'users') fetchUsers();
  }, [tab]);
  
  const fetchProducts = () => fetchApi('/api/products').then(setProducts).catch(console.error);
  const fetchDaily = () => fetchApi('/api/reports?type=daily').then(setDailyData).catch(console.error);
  const fetchRecent = () => fetchApi('/api/sales?limit=10').then(setRecentSales).catch(console.error);
  const fetchInsights = () => fetchApi('/api/ai').then(setInsights).catch(console.error);
  const fetchUsers = () => fetchApi('/api/users').then(setUsers).catch(console.error);
  
  const addToCart = (p: Product) => {
    const price = Number(p.price);
    const existing = cart.find(i => i.productId === p.id);
    if (existing) setCart(cart.map(i => i.productId === p.id ? { ...i, quantity: Math.min(i.quantity + 1, p.stock), subtotal: Math.min(i.quantity + 1, p.stock) * price } : i));
    else setCart([...cart, { productId: p.id, product: p, quantity: 1, price, subtotal: price }]);
  };
  
  const updateQty = (pid: number, delta: number) => {
    setCart(cart.map(i => i.productId === pid ? { ...i, quantity: Math.max(0, Math.min(i.quantity + delta, i.product.stock)), subtotal: Math.max(0, Math.min(i.quantity + delta, i.product.stock)) * Number(i.price) } : i).filter(i => i.quantity > 0));
  };
  
  const subtotal = cart.reduce((s, i) => s + Number(i.subtotal), 0);
  const total = subtotal - discount + (subtotal - discount) * (tax / 100);
  
  const processSale = async () => {
    if (!cart.length) return;
    setProcessing(true);
    try {
      const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));
      await fetchApi('/api/sales', { method: 'POST', body: JSON.stringify({ items, discount, tax, paymentMethod: 'CASH', amountPaid: total }) });
      setCart([]); setDiscount(0); toast.success('Transaksi berhasil!'); fetchProducts();
      } catch (e: any) { toast.error(e.message); }
    finally { setProcessing(false); }
  };
  
  const fetchChartData = async () => {
    try {
      const data = await fetchApi('/api/reports?chart=true');
      console.log('Chart data:', data);
      return data;
    } catch (e) {
      console.error('Chart fetch error:', e);
      return [];
    }
  };
  const [chartData, setChartData] = useState<any>(null);
  
  useEffect(() => {
    if (tab === 'dashboard') {
      fetchDaily();
      fetchRecent();
      fetchChartData().then(data => {
        console.log('Setting chart data:', data);
        setChartData(data);
      }).catch(err => {
        console.error('Chart fetch error:', err);
        setChartData([]);
      });
    }
  }, [tab]);
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir', icon: ShoppingCart },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'ai', label: 'AI', icon: TrendingUp },
    ...(user?.role === 'ADMIN' ? [{ id: 'users', label: 'User', icon: Users }] : []),
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <aside className="w-16 lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-primary-600" /></div>
            <div className="hidden lg:block"><h1 className="font-bold text-gray-900 dark:text-white">UMKN POS</h1></div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${tab === t.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100'}`}>
              <t.icon className="w-5 h-5" /><span className="hidden lg:block text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 dark:text-gray-400 rounded-lg">{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}<span className="hidden lg:block text-sm">Mode</span></button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 rounded-lg"><LogOut className="w-5 h-5" /><span className="hidden lg:block text-sm">Keluar</span></button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between">
          <div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{tabs.find(t => t.id === tab)?.label}</h2></div>
        </header>
        <div className="p-6">
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"><p className="text-sm text-gray-500">Pendapatan Hari Ini</p><p className="text-2xl font-bold">{formatCurrency(dailyData?.totalSales || 0)}</p></div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"><p className="text-sm text-gray-500">Transaksi</p><p className="text-2xl font-bold">{dailyData?.totalTransactions || 0}</p></div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"><p className="text-sm text-gray-500">Items Terjual</p><p className="text-2xl font-bold">{dailyData?.totalItems || 0}</p></div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"><p className="text-sm text-gray-500">Stok Menipis</p><p className="text-2xl font-bold">{products.filter(p => p.stock <= p.minStock).length}</p></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">Grafik Penjualan 7 Hari</h3>
                  <div className="h-64">
                    {chartData && Array.isArray(chartData) && chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{fontSize: 12}} />
                          <YAxis tick={{fontSize: 12}} />
                          <Tooltip formatter={(v: any) => formatCurrency(v)} />
                          <Line type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} dot={{fill: '#0ea5e9'}} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-500 text-center">
                        {chartData === null ? 'Loading...' : 'Tidak ada data'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">Transaksi Terakhir</h3>
                  <div className="space-y-3">{recentSales.slice(0, 5).map(s => (
                    <div key={s.id} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div><p className="font-medium">#{s.id}</p><p className="text-sm text-gray-500">{new Date(s.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div>
                      <p className="font-semibold">{formatCurrency(Number(s.total))}</p>
                    </div>
                  ))}
                  {recentSales.length === 0 && <p className="text-gray-500 text-center py-4">Belum ada transaksi</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === 'pos' && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk..." className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600" /></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                    <button key={p.id} onClick={() => addToCart(p)} disabled={!p.stock} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md disabled:opacity-50">
                      <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center"><Package className="w-8 h-8 text-gray-400" /></div>
                      <h3 className="font-medium text-sm truncate">{p.name}</h3>
                      <p className="text-primary-600 font-semibold">{formatCurrency(p.price)}</p>
                      <p className={`text-xs ${p.stock <= p.minStock ? 'text-red-500' : 'text-gray-500'}`}>Stok: {p.stock}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <h3 className="font-semibold mb-4">Keranjang</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cart.map(i => (
                    <div key={i.productId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{i.product.name}</p></div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(i.productId, -1)} className="p-1 rounded bg-gray-200 dark:bg-gray-600"><Minus className="w-4 h-4" /></button>
                        <span className="w-8 text-center text-sm">{i.quantity}</span>
                        <button onClick={() => updateQty(i.productId, 1)} className="p-1 rounded bg-gray-200 dark:bg-gray-600"><Plus className="w-4 h-4" /></button>
                      </div>
                      <button onClick={() => setCart(cart.filter(c => c.productId !== i.productId))} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 mt-4 pt-4 border-t">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                  <div className="flex gap-2"><label className="text-sm text-gray-500">Diskon</label><input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="flex-1 px-2 py-1 rounded border" /></div>
                  <div className="flex gap-2"><label className="text-sm text-gray-500">Pajak (%)</label><input type="number" value={tax} onChange={e => setTax(Number(e.target.value))} className="flex-1 px-2 py-1 rounded border" /></div>
                  <div className="flex justify-between pt-2 border-t"><span className="font-semibold">Total</span><span className="text-xl font-bold text-primary-600">{formatCurrency(total)}</span></div>
                </div>
                <button onClick={processSale} disabled={!cart.length || processing} className="w-full mt-4 py-3 bg-primary-600 text-white font-semibold rounded-lg disabled:opacity-50">{processing ? 'Memproses...' : 'Proses Transaksi'}</button>
              </div>
            </div>
          )}
          {tab === 'products' && <ProductsTab products={products} setProducts={setProducts} refresh={fetchProducts} />}
          {tab === 'reports' && <ReportsTab />}
          {tab === 'ai' && <AITab insights={insights} refresh={fetchInsights} />}
          {tab === 'users' && <UsersTab users={users} setUsers={setUsers} refresh={fetchUsers} />}
        </div>
      </main>
    </div>
  );
}

function ProductsTab({ products, setProducts, refresh }: { products: Product[]; setProducts: (p: Product[]) => void; refresh: () => void }) {
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', price: '', cost: '', stock: '', minStock: '10' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const openAdd = () => {
    setForm({ name: '', price: '', cost: '', stock: '', minStock: '10' });
    setEditId(null);
    setErrors({});
    setShow(true);
  };
  
  const openEdit = (p: Product) => {
    setForm({ 
      name: p.name, 
      price: String(p.price), 
      cost: String(p.cost || 0), 
      stock: String(p.stock), 
      minStock: String(p.minStock) 
    });
    setEditId(p.id);
    setErrors({});
    setShow(true);
  };
  
  const save = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    
    if (!form.name || form.name.trim().length < 1) {
      newErrors.name = 'Nama wajib diisi (minimal 1 karakter)';
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      newErrors.price = 'Harga wajib diisi dan harus lebih dari 0';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      if (editId) {
        await fetchApi(`/api/products/${editId}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('Produk berhasil diupdate!');
      } else {
        await fetchApi('/api/products', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Produk berhasil ditambahkan!');
      }
      setShow(false);
      setForm({ name: '', price: '', cost: '', stock: '', minStock: '10' });
      setEditId(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };
  
  const remove = async (id: number) => {
    try {
      await fetchApi(`/api/products/${id}`, { method: 'DELETE' });
      toast.success('Produk berhasil dihapus!');
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };
  
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const confirmDelete = (id: number, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
  };
  const [deleteName, setDeleteName] = useState('');
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetchApi(`/api/products/${deleteId}`, { method: 'DELETE' });
      toast.success('Produk berhasil dihapus!');
      setDeleteId(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h3 className="font-semibold">Daftar Produk</h3><button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg"><Plus className="w-4 h-4" />Tambah</button></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-4 py-3 text-left text-xs">Nama</th><th className="px-4 py-3 text-left text-xs">Harga</th><th className="px-4 py-3 text-left text-xs">Stok</th><th className="px-4 py-3 text-left text-xs">Status</th><th className="px-4 py-3 text-right text-xs">Aksi</th></tr></thead>
          <tbody className="divide-y">{products.map(p => (
            <tr key={p.id}>
              <td className="px-4 py-3">{p.name}</td>
              <td className="px-4 py-3">{formatCurrency(p.price)}</td>
              <td className="px-4 py-3">{p.stock}</td>
              <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${p.stock <= p.minStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.stock <= p.minStock ? 'Menipis' : 'Tersedia'}</span></td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => openEdit(p)} className="p-1 text-blue-600 hover:text-blue-700 mr-2"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => confirmDelete(p.id, p.name)} className="p-1 text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {show && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
          <h3 className="font-semibold mb-4">{editId ? 'Edit Produk' : 'Tambah Produk'}</h3>
          <div className="space-y-3">
            <div>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama produk" className={`w-full px-3 py-2 rounded-lg border ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <input value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Harga" type="number" className={`w-full px-3 py-2 rounded-lg border ${errors.price ? 'border-red-500 focus:ring-red-500' : ''}`} />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            <input value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} placeholder="Biaya (opsional)" type="number" className="w-full px-3 py-2 rounded-lg border" />
            <input value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="Stok" type="number" className="w-full px-3 py-2 rounded-lg border" />
            <input value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} placeholder="Batas minimum stok" type="number" className="w-full px-3 py-2 rounded-lg border" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setShow(false); setEditId(null); }} className="flex-1 py-2 border rounded-lg">Batal</button>
            <button onClick={save} className="flex-1 py-2 bg-primary-600 text-white rounded-lg">Simpan</button>
          </div>
        </div>
      </div>}
      
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Hapus Produk</h3>
              <p className="text-gray-500 mb-6">Apakah kamu yakin ingin menghapus <span className="font-semibold text-gray-900">{deleteName}</span>?</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border rounded-lg">Batal</button>
                <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsTab() {
  const [type, setType] = useState('daily');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  
  useEffect(() => { 
    setLoading(true);
    fetchApi(`/api/reports?type=${type}`).then(setData).catch(console.error).finally(() => setLoading(false)); 
  }, [type]);
  
  const printPDF = () => {
    if (!data) return;
    
    const periodLabel = type === 'daily' ? 'Harian' : type === 'weekly' ? 'Mingguan' : 'Bulanan';
    const date = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Laporan ${periodLabel} - UMKN POS</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { text-align: center; margin-bottom: 5px; }
    .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
    .summary { display: flex; justify-content: space-around; margin-bottom: 20px; }
    .summary-box { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    .summary-box h3 { margin: 0; font-size: 14px; color: #666; }
    .summary-box p { margin: 5px 0 0; font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .total-row { font-weight: bold; }
  </style>
</head>
<body>
  <h1>LAPORAN PENJUALAN ${periodLabel.toUpperCase()}</h1>
  <p class="subtitle">UMKN POS - ${date}</p>
  
  <div class="summary">
    <div class="summary-box">
      <h3>Total Penjualan</h3>
      <p>${formatCurrency(data.summary.totalSales)}</p>
    </div>
    <div class="summary-box">
      <h3>Transaksi</h3>
      <p>${data.summary.totalTransactions}</p>
    </div>
    <div class="summary-box">
      <h3>Items Terjual</h3>
      <p>${data.summary.totalItems}</p>
    </div>
  </div>
  
  <h2>Produk Terlaris</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Produk</th>
        <th>Terjual</th>
        <th>Revenue</th>
      </tr>
    </thead>
    <tbody>
      ${(data.topProducts || []).map((p: any, i: number) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.name}</td>
          <td>${p.quantity}</td>
          <td>${formatCurrency(p.revenue)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Riwayat Transaksi</h2>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Waktu</th>
        <th>Kasir</th>
        <th>Total</th>
        <th>Pembayaran</th>
      </tr>
    </thead>
    <tbody>
      ${(data.sales || []).map((s: any) => `
        <tr>
          <td>#${s.id}</td>
          <td>${new Date(s.createdAt).toLocaleString('id-ID')}</td>
          <td>${s.user?.name || '-'}</td>
          <td>${formatCurrency(s.total)}</td>
          <td>${s.paymentMethod}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <p style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
    Dicetak dari UMKN POS - ${new Date().toLocaleString('id-ID')}
  </p>
</body>
</html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select value={type} onChange={e => setType(e.target.value)} className="px-4 py-2 rounded-lg border bg-white dark:bg-gray-700">
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
          </select>
          <button onClick={() => setShowDetail(!showDetail)} className="px-4 py-2 rounded-lg border bg-white dark:bg-gray-700">
            {showDetail ? 'Sembunyikan' : 'Tampilkan'} Detail
          </button>
        </div>
        <button onClick={printPDF} disabled={!data || loading} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
          <Printer className="w-4 h-4" /> Print / PDF
        </button>
      </div>
      
      {loading && <div className="text-center py-8">Memuat...</div>}
      
      {data && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total Penjualan</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalSales)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Transaksi</p>
              <p className="text-xl font-bold">{data.summary.totalTransactions}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Items Terjual</p>
              <p className="text-xl font-bold">{data.summary.totalItems}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">Rata-rata/Transaksi</p>
              <p className="text-xl font-bold">{formatCurrency(data.summary.averageTransaction)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Produk Terlaris</h3>
              <div className="space-y-2">
                {(data.topProducts || []).slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <span className="text-sm">{p.name}</span>
                    </div>
                    <span className="text-sm font-medium">{p.quantity} pcs</span>
                  </div>
                ))}
                {(!data.topProducts || data.topProducts.length === 0) && <p className="text-gray-500 text-sm">Belum ada data</p>}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Metode Pembayaran</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Cash</span>
                  <span className="text-sm font-medium">{formatCurrency(data.paymentStats?.CASH || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">QRIS</span>
                  <span className="text-sm font-medium">{formatCurrency(data.paymentStats?.QRIS || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Transfer</span>
                  <span className="text-sm font-medium">{formatCurrency(data.paymentStats?.TRANSFER || 0)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {showDetail && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold mb-3">Riwayat Transaksi</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Waktu</th>
                      <th className="px-3 py-2 text-left">Kasir</th>
                      <th className="px-3 py-2 text-left">Items</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-left">Bayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(data.sales || []).map((s: any) => (
                      <tr key={s.id}>
                        <td className="px-3 py-2">#{s.id}</td>
                        <td className="px-3 py-2">{new Date(s.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-3 py-2">{s.user?.name || '-'}</td>
                        <td className="px-3 py-2">{s.items?.length || 0} item</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(s.total)}</td>
                        <td className="px-3 py-2">{s.paymentMethod}</td>
                      </tr>
                    ))}
                    {(!data.sales || data.sales.length === 0) && (
                      <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-500">Belum ada transaksi</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AITab({ insights, refresh }: { insights: AIInsight[]; refresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const colors: Record<string, string> = { RESTOCK: 'bg-red-100 text-red-700', TREND: 'bg-blue-100 text-blue-700', FORECAST: 'bg-purple-100 text-purple-700', INSIGHT: 'bg-green-100 text-green-700' };
  
  const generate = async () => {
    setLoading(true);
    try {
      await fetchApi('/api/ai', { method: 'POST' });
      toast.success('Insights generated!');
      refresh();
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">AI Insights</h3>
        <button onClick={generate} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
          {loading ? 'Generating...' : 'Generate Insights'}
        </button>
      </div>
      {insights.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Belum ada insight. Klik "Generate Insights" untuk membuat.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map(i => (
            <div key={i.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colors[i.type] || colors.INSIGHT}`}><TrendingUp className="w-5 h-5" /></div>
                <div><h4 className="font-medium">{i.title}</h4><p className="text-sm text-gray-500">{i.content}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTab({ users, setUsers, refresh }: { users: any[]; setUsers: (u: any[]) => void; refresh: () => void }) {
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'KASIR' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const openAdd = () => {
    setForm({ name: '', email: '', password: '', role: 'KASIR' });
    setEditId(null);
    setErrors({});
    setShow(true);
  };
  
  const openEdit = (u: any) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setEditId(u.id);
    setErrors({});
    setShow(true);
  };
  
  const save = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!form.name || form.name.trim().length < 1) {
      newErrors.name = 'Nama wajib diisi (minimal 1 karakter)';
    }
    
    if (!form.email || !emailRegex.test(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    if (!editId) {
      if (!form.password || form.password.length < 4) {
        newErrors.password = 'Password wajib diisi (minimal 4 karakter)';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      if (editId) {
        await fetchApi(`/api/users/${editId}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('User berhasil diupdate!');
      } else {
        await fetchApi('/api/users', { method: 'POST', body: JSON.stringify(form) });
        toast.success('User berhasil ditambahkan!');
      }
      setShow(false);
      setForm({ name: '', email: '', password: '', role: 'KASIR' });
      setEditId(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };
  
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const confirmDelete = (id: number, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
  };
  const handleDelete = async () => {
    try {
      await fetchApi(`/api/users/${deleteId}`, { method: 'DELETE' });
      toast.success('User berhasil dihapus!');
      setDeleteId(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h3 className="font-semibold">Manajemen User</h3><button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg"><Plus className="w-4 h-4" />Tambah User</button></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full"><thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-4 py-3 text-left text-xs">Nama</th><th className="px-4 py-3 text-left text-xs">Email</th><th className="px-4 py-3 text-left text-xs">Role</th><th className="px-4 py-3 text-right text-xs">Aksi</th></tr></thead>
          <tbody className="divide-y">{users.map(u => (
            <tr key={u.id}>
              <td className="px-4 py-3">{u.name}</td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span></td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => openEdit(u)} className="p-1 text-blue-600 hover:text-blue-700 mr-2"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => confirmDelete(u.id, u.name)} className="p-1 text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {show && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
          <h3 className="font-semibold mb-4">{editId ? 'Edit User' : 'Tambah User'}</h3>
          <div className="space-y-3">
            <div>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama lengkap" className={`w-full px-3 py-2 rounded-lg border ${errors.name ? 'border-red-500' : ''}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" type="email" className={`w-full px-3 py-2 rounded-lg border ${errors.email ? 'border-red-500' : ''}`} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder={editId ? "Password baru (opsional)" : "Password"} type="password" className={`w-full px-3 py-2 rounded-lg border ${errors.password ? 'border-red-500' : ''}`} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 rounded-lg border">
              <option value="KASIR">Kasir</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setShow(false); setEditId(null); }} className="flex-1 py-2 border rounded-lg">Batal</button>
            <button onClick={save} className="flex-1 py-2 bg-primary-600 text-white rounded-lg">Simpan</button>
          </div>
        </div>
      </div>}
      
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Hapus User</h3>
              <p className="text-gray-500 mb-6">Apakah kamu yakin ingin menghapus <span className="font-semibold text-gray-900">{deleteName}</span>?</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border rounded-lg">Batal</button>
                <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}