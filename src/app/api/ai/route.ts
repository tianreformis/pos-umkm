import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function callMistral(prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not configured');
  }
  
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral API error: ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

function serializeSale(sale: any) {
  return {
    ...sale,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    tax: Number(sale.tax),
    total: Number(sale.total),
    amountPaid: Number(sale.amountPaid),
    change: Number(sale.change),
    createdAt: sale.createdAt.toISOString()
  };
}

function serializeSaleItem(item: any) {
  return {
    ...item,
    price: Number(item.price),
    subtotal: Number(item.subtotal)
  };
}

export async function GET() {
  try {
    const insights = await prisma.aIInsight.findMany({ 
      orderBy: { generatedAt: 'desc' }, 
      take: 20 
    });
    return NextResponse.json(insights);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Get sales data
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: weekAgo } },
      include: { items: { include: { product: true } }, user: { select: { name: true } } }
    });

    // Calculate statistics
    const productStats: Record<number, { name: string; daily: Record<string, number>; weekly: number; monthly: number }> = {};
    let totalRevenue = 0;
    let totalTransactions = sales.length;
    const salesByDay: Record<string, { revenue: number; transactions: number }> = {};

    sales.forEach(sale => {
      totalRevenue += Number(sale.total);
      const dayKey = sale.createdAt.toISOString().split('T')[0];
      if (!salesByDay[dayKey]) {
        salesByDay[dayKey] = { revenue: 0, transactions: 0 };
      }
      salesByDay[dayKey].revenue += Number(sale.total);
      salesByDay[dayKey].transactions += 1;

      sale.items.forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { 
            name: item.product?.name || 'Unknown',
            daily: {}, 
            weekly: 0,
            monthly: 0 
          };
        }
        const dayKey = sale.createdAt.toISOString().split('T')[0];
        productStats[item.productId].daily[dayKey] = (productStats[item.productId].daily[dayKey] || 0) + item.quantity;
        productStats[item.productId].weekly += item.quantity;
        productStats[item.productId].monthly += item.quantity;
      });
    });

    // Get products with low stock
    const products = await prisma.product.findMany();
    const lowStockProducts = products.filter(p => p.stock <= p.minStock);

    // Calculate growth
    const recentSales = sales.filter(s => {
      const saleDate = new Date(s.createdAt);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return saleDate >= threeDaysAgo;
    });
    
    const olderSales = sales.filter(s => {
      const saleDate = new Date(s.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return saleDate >= sevenDaysAgo && saleDate < threeDaysAgo;
    });

    const recentRevenue = recentSales.reduce((sum, s) => sum + Number(s.total), 0);
    const olderRevenue = olderSales.reduce((sum, s) => sum + Number(s.total), 0);
    const growth = olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 : 0;

    // Try to use Mistral AI
    let mistralInsights = '';
    const apiKey = process.env.MISTRAL_API_KEY;
    
    if (apiKey && sales.length > 0) {
      try {
        const topProducts = Object.entries(productStats)
          .sort(([, a], [, b]) => b.weekly - a.weekly)
          .slice(0, 5)
          .map(([, data]) => data.name);

        const prompt = `
Berdasarkan data penjualan minggu ini untuk bisnis POS/UMKM:
- Total pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}
- Total transaksi: ${totalTransactions}
- Pertumbuhan vs minggu lalu: ${growth.toFixed(1)}%
- Produk terlaris: ${topProducts.join(', ')}
- Produk stok menipis: ${lowStockProducts.map(p => p.name).join(', ') || 'Tidak ada'}

Berikan insight singkat dalam Bahasa Indonesia (maksimal 5 poin) tentang:
1. Rekomendasi restok barang
2. Tren penjualan
3. Prediksi minggu depan
4. Saran bisnis

Jawaban dalam format JSON seperti ini:
{
  "insights": [
    {"type": "RESTOCK"|"TREND"|"FORECAST"|"INSIGHT", "title": "...", "content": "...", "confidence": 0.8}
  ]
}
`;
        mistralInsights = await callMistral(prompt);
      } catch (mistralError: any) {
        console.error('Mistral API error:', mistralError.message);
      }
    }

    // Parse and save Mistral insights
    if (mistralInsights) {
      try {
        const jsonMatch = mistralInsights.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.insights && Array.isArray(parsed.insights)) {
            for (const insight of parsed.insights) {
              await prisma.aIInsight.create({
                data: {
                  type: insight.type,
                  title: insight.title,
                  content: insight.content,
                  confidence: insight.confidence || 0.7,
                  generatedAt: new Date()
                }
              });
            }
          }
        }
      } catch (parseError) {
        console.error('Failed to parse Mistral response:', parseError);
      }
    }

    // Generate basic insights if Mistral failed or no API key
    if (!mistralInsights || sales.length === 0) {
      // Restock insights
      for (const product of products) {
        const stats = productStats[product.id];
        if (!stats) continue;

        const avgDaily = stats.weekly / 7;
        const daysLeft = avgDaily > 0 ? product.stock / avgDaily : 999;

        if (daysLeft <= 3 && product.stock <= product.minStock) {
          await prisma.aIInsight.create({
            data: {
              type: 'RESTOCK',
              title: `Restok urgent: ${product.name}`,
              content: `Stok ${product.name} (${product.stock}) hanya cukup ${daysLeft.toFixed(1)} hari lagi. Segera pesan ulang!`,
              confidence: Math.min(0.9, 1 - daysLeft / 7),
              generatedAt: new Date()
            }
          });
        } else if (daysLeft <= 7 && product.stock <= product.minStock) {
          await prisma.aIInsight.create({
            data: {
              type: 'RESTOCK',
              title: `Restok: ${product.name}`,
              content: `Stok ${product.name} mulai menipis. Pertimbangkan untuk memesan ulang.`,
              confidence: 0.6,
              generatedAt: new Date()
            }
          });
        }
      }

      // Trend insights
      const topProducts = Object.entries(productStats)
        .sort(([, a], [, b]) => b.weekly - a.weekly)
        .slice(0, 5)
        .map(([, data]) => data.name);

      if (topProducts.length > 0) {
        await prisma.aIInsight.create({
          data: {
            type: 'TREND',
            title: 'Produk Terlaris Minggu Ini',
            content: `Top 5 produk: ${topProducts.join(', ')}`,
            confidence: 0.9,
            generatedAt: new Date()
          }
        });
      }

      // Growth insight
      if (Math.abs(growth) >= 10) {
        await prisma.aIInsight.create({
          data: {
            type: 'INSIGHT',
            title: growth > 0 ? 'Penjualan Meningkat' : 'Penjualan Menurun',
            content: `Pendapatan ${growth > 0 ? 'meningkat' : 'menurun'} ${Math.abs(growth).toFixed(1)}% dibanding minggu lalu.`,
            confidence: Math.min(0.9, Math.abs(growth) / 100),
            generatedAt: new Date()
          }
        });
      }

      // Forecast
      const forecastedProducts = Object.entries(productStats)
        .sort(([, a], [, b]) => b.weekly - a.weekly)
        .slice(0, 5)
        .map(([, data]) => ({
          name: data.name,
          forecast: Math.round(data.weekly * 1.2)
        }));

      if (forecastedProducts.length > 0) {
        await prisma.aIInsight.create({
          data: {
            type: 'FORECAST',
            title: 'Prediksi Minggu Depan',
            content: `Estimasi produk terlaris minggu depan: ${forecastedProducts.map(p => `${p.name} (~${p.forecast} pcs)`).join(', ')}`,
            confidence: 0.75,
            generatedAt: new Date()
          }
        });
      }
    }

    // Clean old insights (keep only last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await prisma.aIInsight.deleteMany({
      where: { generatedAt: { lt: thirtyDaysAgo } }
    });

    return NextResponse.json({ 
      message: 'Insights generated successfully',
      source: mistralInsights ? 'mistral' : 'local'
    });
  } catch (e: any) {
    console.error('AI generation error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}