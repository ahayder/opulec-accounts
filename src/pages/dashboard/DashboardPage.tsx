import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { toast } from 'sonner';
import { Loader2 } from "lucide-react";
import dayjs from 'dayjs';
import { getSales, getPurchases } from '@/utils/database';
import { cn } from "@/lib/utils";

type DateRange = {
  from: Date;
  to: Date;
} | undefined;

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [activeFilter, setActiveFilter] = useState<'7d' | '1m' | '3m' | 'custom'>('1m');
  const [dashboardData, setDashboardData] = useState<{
    sales: number;
    purchases: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
    currentStock: {
      [key: string]: {
        product: string;
        quantity: number;
        value: number;
      };
    };
  }>({
    sales: 0,
    purchases: 0,
    cogs: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    netProfit: 0,
    currentStock: {}
  });

  useEffect(() => {
    loadDashboardData();
  }, [date]);

  const handleFilterChange = (filter: '7d' | '1m' | '3m' | 'custom') => {
    setActiveFilter(filter);
    const now = new Date();
    
    switch (filter) {
      case '7d':
        setDate({
          from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          to: now
        });
        break;
      case '1m':
        setDate({
          from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          to: now
        });
        break;
      case '3m':
        setDate({
          from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          to: now
        });
        break;
      // For custom, we don't set the date here as it's handled by the calendar
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [sales, purchases] = await Promise.all([
        getSales(),
        getPurchases()
      ]);

      // Filter data based on date range
      const start = date?.from ? dayjs(date.from).startOf('day') : dayjs(0);
      const end = date?.to ? dayjs(date.to).endOf('day') : dayjs();

      const filteredSales = sales.filter(sale => {
        const saleDate = dayjs(sale.date, 'DD-MMM-YYYY');
        return date?.from && date?.to 
          ? saleDate.isAfter(start) && saleDate.isBefore(end)
          : true;
      });

      const filteredPurchases = purchases.filter(purchase => {
        const purchaseDate = dayjs(purchase.date, 'DD-MMM-YYYY');
        return date?.from && date?.to 
          ? purchaseDate.isAfter(start) && purchaseDate.isBefore(end)
          : true;
      });

      // Calculate current stock
      const currentStock: {
        [key: string]: {
          product: string;
          quantity: number;
          value: number;
        };
      } = {};

      // Add all purchases
      purchases.forEach(purchase => {
        if (!currentStock[purchase.product]) {
          currentStock[purchase.product] = {
            product: purchase.product,
            quantity: 0,
            value: 0
          };
        }
        currentStock[purchase.product].quantity += purchase.quantity;
        currentStock[purchase.product].value += purchase.total;
      });

      // Subtract all sales
      sales.forEach(sale => {
        if (currentStock[sale.product]) {
          currentStock[sale.product].quantity -= sale.quantity;
        }
      });

      // Calculate totals
      const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
      const totalCOGS = 220; // This should be calculated based on your business logic
      const grossProfit = totalSales - totalCOGS;
      const operatingExpenses = 500; // This should be fetched from your expenses data
      const netProfit = grossProfit - operatingExpenses;

      setDashboardData({
        sales: totalSales,
        purchases: totalPurchases,
        cogs: totalCOGS,
        grossProfit,
        operatingExpenses,
        netProfit,
        currentStock
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data', {
        dismissible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 py-3 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your business performance
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Button
          variant={activeFilter === '7d' ? 'default' : 'outline'}
          onClick={() => handleFilterChange('7d')}
        >
          Last 7 Days
        </Button>
        <Button
          variant={activeFilter === '1m' ? 'default' : 'outline'}
          onClick={() => handleFilterChange('1m')}
        >
          Last Month
        </Button>
        <Button
          variant={activeFilter === '3m' ? 'default' : 'outline'}
          onClick={() => handleFilterChange('3m')}
        >
          Last 3 Months
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={activeFilter === 'custom' ? 'default' : 'outline'}
              className={cn(
                'justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
              onClick={() => setActiveFilter('custom')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {dayjs(date.from).format('MMM D, YYYY')} -{' '}
                    {dayjs(date.to).format('MMM D, YYYY')}
                  </>
                ) : (
                  dayjs(date.from).format('MMM D, YYYY')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(selectedDate: DateRange) => {
                if (selectedDate?.from && selectedDate.to) {
                  setDate(selectedDate);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{dashboardData.sales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total COGS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{dashboardData.cogs.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dashboardData.grossProfit < 0 ? 'text-red-500' : ''}`}>
              ৳{dashboardData.grossProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operating Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{dashboardData.operatingExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dashboardData.netProfit < 0 ? 'text-red-500' : ''}`}>
              ৳{dashboardData.netProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Stock</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading stock data...
            </div>
          ) : Object.keys(dashboardData.currentStock).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No stock data available</p>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="h-12 px-4 text-left align-middle font-medium">Product</th>
                    <th className="h-12 px-4 text-right align-middle font-medium">Quantity</th>
                    <th className="h-12 px-4 text-right align-middle font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(dashboardData.currentStock)
                    .filter(item => item.quantity > 0)
                    .map(item => (
                      <tr key={item.product} className="border-b">
                        <td className="p-4 align-middle">{item.product}</td>
                        <td className="p-4 align-middle text-right">{item.quantity}</td>
                        <td className="p-4 align-middle text-right">৳{item.value.toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage; 