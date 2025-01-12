import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "lucide-react";
import { toast } from 'sonner';
import { Loader2 } from "lucide-react";
import dayjs from 'dayjs';
import { getSales, getPurchases, getExpenses } from '@/utils/database';
import { cn } from "@/lib/utils";

// Helper function to format date for display
const formatDate = (date: Date | string): string => {
  return dayjs(date).format('DD-MMM-YYYY');
};

type DateRange = {
  from: Date;
  to: Date;
} | null;

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [dateRangeDisplay, setDateRangeDisplay] = useState<string>('');
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
        totalPurchaseValue: number;
        totalPurchaseQuantity: number;
        averageCost: number;
        currentValue: number;
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
  }, [dateRange, activeFilter]);

  useEffect(() => {
    updateDateRangeDisplay();
  }, [dashboardData, activeFilter, dateRange]);

  const updateDateRangeDisplay = () => {
    // Format date to "Jan 1 2025" style
    const formatDisplayDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };

    if (dateRange?.from && dateRange?.to) {
      setDateRangeDisplay(`Showing data from ${formatDisplayDate(dateRange.from)} to ${formatDisplayDate(dateRange.to)}`);
    } else {
      const today = new Date();
      const fromDate = new Date();

      switch (activeFilter) {
        case 'all':
          setDateRangeDisplay('Showing all data');
          break;
        case '7days':
          fromDate.setDate(today.getDate() - 7);
          setDateRangeDisplay(`Last 7 days (${formatDisplayDate(fromDate)} - ${formatDisplayDate(today)})`);
          break;
        case '1month':
          fromDate.setMonth(today.getMonth() - 1);
          setDateRangeDisplay(`Last month (${formatDisplayDate(fromDate)} - ${formatDisplayDate(today)})`);
          break;
        case '3months':
          fromDate.setMonth(today.getMonth() - 3);
          setDateRangeDisplay(`Last 3 months (${formatDisplayDate(fromDate)} - ${formatDisplayDate(today)})`);
          break;
        default:
          setDateRangeDisplay('');
      }
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [sales, purchases, expenses] = await Promise.all([
        getSales(),
        getPurchases(),
        getExpenses()
      ]);

      // Filter data based on date range and active filter
      let start = new Date(0);
      let end = new Date();

      if (dateRange?.from && dateRange?.to) {
        start = dateRange.from;
        end = dateRange.to;
      } else {
        const today = new Date();
        switch (activeFilter) {
          case '7days':
            start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '1month':
            start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '3months':
            start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          // 'all' case will use the default values set above
        }
      }

      const startDay = dayjs(start).startOf('day');
      const endDay = dayjs(end).endOf('day');

      const filteredSales = sales.filter(sale => {
        const saleDate = dayjs(sale.date, 'DD-MMM-YYYY');
        return saleDate.isAfter(startDay) && saleDate.isBefore(endDay);
      });

      const filteredPurchases = purchases.filter(purchase => {
        const purchaseDate = dayjs(purchase.date, 'DD-MMM-YYYY');
        return purchaseDate.isAfter(startDay) && purchaseDate.isBefore(endDay);
      });

      const filteredExpenses = expenses.filter(expense => {
        const expenseDate = dayjs(expense.date, 'DD-MMM-YYYY');
        return expenseDate.isAfter(startDay) && expenseDate.isBefore(endDay);
      });

      // Calculate current stock
      const currentStock: {
        [key: string]: {
          product: string;
          quantity: number;
          totalPurchaseValue: number;
          totalPurchaseQuantity: number;
          averageCost: number;
          currentValue: number;
        };
      } = {};

      // Add all purchases
      purchases.forEach(purchase => {
        if (!currentStock[purchase.product]) {
          currentStock[purchase.product] = {
            product: purchase.product,
            quantity: 0,
            totalPurchaseValue: 0,
            totalPurchaseQuantity: 0,
            averageCost: 0,
            currentValue: 0
          };
        }
        currentStock[purchase.product].totalPurchaseValue += purchase.total;
        currentStock[purchase.product].totalPurchaseQuantity += purchase.quantity;
        currentStock[purchase.product].quantity += purchase.quantity;
      });

      // Subtract all sales
      sales.forEach(sale => {
        if (currentStock[sale.product]) {
          currentStock[sale.product].quantity -= sale.quantity;
        }
      });

      // Calculate average cost and current value for each product
      Object.values(currentStock).forEach(stock => {
        if (stock.totalPurchaseQuantity > 0) {
          stock.averageCost = stock.totalPurchaseValue / stock.totalPurchaseQuantity;
          stock.currentValue = stock.quantity * stock.averageCost;
        }
      });

      // Calculate totals
      const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
      const totalOperatingExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // COGS is the total purchases for the period
      const totalCOGS = totalPurchases;
      const grossProfit = totalSales - totalCOGS;
      const netProfit = grossProfit - totalOperatingExpenses;

      setDashboardData({
        sales: totalSales,
        purchases: totalPurchases,
        cogs: totalCOGS,
        grossProfit,
        operatingExpenses: totalOperatingExpenses,
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

      {/* Date Filter Section */}
      <div className="space-y-4 mt-4">
        <div className="flex items-center gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => {
              setActiveFilter('all');
              setDateRange(null);
            }}
          >
            All Time
          </Button>
          <Button
            variant={activeFilter === '7days' ? 'default' : 'outline'}
            onClick={() => {
              setActiveFilter('7days');
              setDateRange(null);
            }}
          >
            Last 7 Days
          </Button>
          <Button
            variant={activeFilter === '1month' ? 'default' : 'outline'}
            onClick={() => {
              setActiveFilter('1month');
              setDateRange(null);
            }}
          >
            Last Month
          </Button>
          <Button
            variant={activeFilter === '3months' ? 'default' : 'outline'}
            onClick={() => {
              setActiveFilter('3months');
              setDateRange(null);
            }}
          >
            Last 3 Months
          </Button>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateRange?.from ? 'default' : 'outline'}
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    formatDate(dateRange.from)
                  ) : (
                    "From Date"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="border-b p-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Select start date</h4>
                    <p className="text-sm text-muted-foreground">
                      Pick the starting date
                    </p>
                  </div>
                </div>
                <CalendarComponent
                  mode="single"
                  selected={dateRange?.from}
                  onSelect={(date: Date | undefined) => {
                    if (date) {
                      const newRange = {
                        from: date,
                        to: dateRange?.to ?? date
                      };
                      setDateRange(newRange);
                      setActiveFilter('custom');
                    }
                  }}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground">-</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateRange?.to ? 'default' : 'outline'}
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange?.to && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange?.to ? (
                    formatDate(dateRange.to)
                  ) : (
                    "To Date"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="border-b p-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Select end date</h4>
                    <p className="text-sm text-muted-foreground">
                      Pick the ending date
                    </p>
                  </div>
                </div>
                <CalendarComponent
                  mode="single"
                  selected={dateRange?.to}
                  onSelect={(date: Date | undefined) => {
                    if (date) {
                      const newRange = {
                        from: dateRange?.from ?? date,
                        to: date
                      };
                      setDateRange(newRange);
                      setActiveFilter('custom');
                    }
                  }}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Date Range Display */}
        {dateRangeDisplay && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {dateRangeDisplay}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Revenue Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Revenue</h3>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm">Total Sales</span>
                  <span className="text-lg font-semibold">৳{dashboardData.sales.toFixed(2)}</span>
                </div>
              </div>

              {/* Costs Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Costs</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm">Cost of Goods Sold (COGS)</span>
                    <span className="text-lg font-semibold text-red-500">৳{dashboardData.cogs.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm">Operating Expenses</span>
                    <span className="text-lg font-semibold text-red-500">৳{dashboardData.operatingExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2 pt-1">
                    <span className="text-sm font-medium">Total Cost</span>
                    <span className="text-lg font-semibold text-red-500">৳{(dashboardData.cogs + dashboardData.operatingExpenses).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Profit Analysis</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Gross Profit = Total Sales - COGS
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm">Gross Profit</span>
                      <span className={cn(
                        "text-lg font-semibold",
                        dashboardData.grossProfit < 0 ? "text-red-500" : "text-green-500"
                      )}>
                        {dashboardData.grossProfit < 0 ? "-" : ""}৳{Math.abs(dashboardData.grossProfit).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Net Profit = Gross Profit - Operating Expenses
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm">Net Profit</span>
                      <span className={cn(
                        "text-lg font-semibold",
                        dashboardData.netProfit < 0 ? "text-red-500" : "text-green-500"
                      )}>
                        {dashboardData.netProfit < 0 ? "-" : ""}৳{Math.abs(dashboardData.netProfit).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Margins */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Profit Margins</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Gross Margin = (Gross Profit ÷ Total Sales) × 100
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm">Gross Margin</span>
                      <span className={cn(
                        "text-lg font-semibold",
                        dashboardData.grossProfit < 0 ? "text-red-500" : "text-green-500"
                      )}>
                        {dashboardData.sales > 0 
                          ? ((dashboardData.grossProfit / dashboardData.sales) * 100).toFixed(1)
                          : "0.0"}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Net Margin = (Net Profit ÷ Total Sales) × 100
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm">Net Margin</span>
                      <span className={cn(
                        "text-lg font-semibold",
                        dashboardData.netProfit < 0 ? "text-red-500" : "text-green-500"
                      )}>
                        {dashboardData.sales > 0 
                          ? ((dashboardData.netProfit / dashboardData.sales) * 100).toFixed(1)
                          : "0.0"}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <th className="h-12 px-4 text-right align-middle font-medium">Average Cost</th>
                    <th className="h-12 px-4 text-right align-middle font-medium">Current Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(dashboardData.currentStock)
                    .filter(item => item.quantity > 0)
                    .map(item => (
                      <tr key={item.product} className="border-b">
                        <td className="p-4 align-middle">{item.product}</td>
                        <td className="p-4 align-middle text-right">{item.quantity}</td>
                        <td className="p-4 align-middle text-right">৳{item.averageCost.toFixed(2)}</td>
                        <td className="p-4 align-middle text-right">৳{item.currentValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  {/* Total Row */}
                  <tr className="border-t border-t-2">
                    <td className="p-4 align-middle font-medium">Total</td>
                    <td className="p-4 align-middle text-right font-medium">
                      {Object.values(dashboardData.currentStock)
                        .filter(item => item.quantity > 0)
                        .reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="p-4 align-middle text-right font-medium">-</td>
                    <td className="p-4 align-middle text-right font-medium">
                      ৳{Object.values(dashboardData.currentStock)
                        .filter(item => item.quantity > 0)
                        .reduce((sum, item) => sum + item.currentValue, 0).toFixed(2)}
                    </td>
                  </tr>
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