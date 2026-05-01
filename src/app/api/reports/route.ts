import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'daily';
    const chart = req.nextUrl.searchParams.get('chart') === 'true';
    
    const now = new Date();
    
    // If requesting chart data (last 7 days)
    if (chart) {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Get sales from last 7 days
      const sales = await prisma.sale.findMany({
        where: { createdAt: { gte: sevenDaysAgo } }
      });
      
      // Group by date
      const salesByDate: Record<string, {total: number, count: number}> = {};
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = d.toISOString().split('T')[0];
        salesByDate[dateKey] = { total: 0, count: 0 };
      }
      
      // Group sales by date
      for (const sale of sales) {
        const dateKey = sale.createdAt.toISOString().split('T')[0];
        if (salesByDate[dateKey]) {
          salesByDate[dateKey].total += Number(sale.total);
          salesByDate[dateKey].count += 1;
        } else {
          // Sale is outside our 7-day window - add it
          salesByDate[dateKey] = { total: Number(sale.total), count: 1 };
        }
      }
      
      const days = Object.keys(salesByDate).sort().map((fullDate) => {
        const d = new Date(fullDate);
        return {
          date: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
          fullDate,
          sales: salesByDate[fullDate].total,
          transactions: salesByDate[fullDate].count
        };
      });
      
      return NextResponse.json(days);
    }
    
    let startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    
    if (type === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (type === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: startDate } },
      include: { 
        items: { include: { product: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    let totalSales = 0;
    let totalItems = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    
    const salesByDate: Record<string, any> = {};
    const productStats: Record<number, { name: string; quantity: number; revenue: number }> = {};
    const paymentStats: Record<string, number> = { CASH: 0, QRIS: 0, TRANSFER: 0 };
    
    for (const sale of sales) {
      totalSales += Number(sale.total);
      totalDiscount += Number(sale.discount);
      totalTax += Number(sale.tax);
      
      paymentStats[sale.paymentMethod] = (paymentStats[sale.paymentMethod] || 0) + Number(sale.total);
      
      const dateKey = sale.createdAt.toISOString().split('T')[0];
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { date: dateKey, transactions: 0, total: 0, items: 0 };
      }
      salesByDate[dateKey].transactions++;
      salesByDate[dateKey].total += Number(sale.total);
      
      for (const item of sale.items) {
        totalItems += item.quantity;
        salesByDate[dateKey].items += item.quantity;
        
        if (!productStats[item.productId]) {
          productStats[item.productId] = { 
            name: item.product?.name || `Product #${item.productId}`,
            quantity: 0, 
            revenue: 0 
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue += Number(item.subtotal);
      }
    }
    
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    
    const dailyData = Object.values(salesByDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
    
    return NextResponse.json({
      type,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
        label: type === 'daily' ? 'Hari Ini' : type === 'weekly' ? '7 Hari Terakhir' : '30 Hari Terakhir'
      },
      summary: {
        totalSales,
        totalTransactions: sales.length,
        totalItems,
        totalDiscount,
        totalTax,
        averageTransaction: sales.length > 0 ? totalSales / sales.length : 0
      },
      dailyData,
      topProducts,
      paymentStats,
      sales: sales.map(s => ({
        ...serializeSale(s),
        items: s.items.map(serializeSaleItem)
      }))
    });
  } catch (e: any) {
    console.error('Reports error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}