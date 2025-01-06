import React, { useState, useEffect } from 'react';
import { getSales, getPurchases, getExpenses, getInvestments, getAssets } from '@/utils/database';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dayjs from 'dayjs';

interface DashboardMetrics {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalInvestments: number;
  totalAssets: number;
  netIncome: number;
}

interface MetricCardProps {
  title: string;
  value: number;
  type: 'currency';
  className?: string;
  valueClassName?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, type, className, valueClassName }) => (
  <div className={cn("p-4 border rounded-lg", className)}>
    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
    <p className={cn("text-2xl font-bold mt-2", valueClassName)}>
      {type === 'currency' ? `৳${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : value}
    </p>
  </div>
);

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    totalInvestments: 0,
    totalAssets: 0,
    netIncome: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [startDate, endDate]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [sales, purchases, expenses, investments, assets] = await Promise.all([
        getSales(),
        getPurchases(),
        getExpenses(),
        getInvestments(),
        getAssets()
      ]);

      // Filter data based on date range
      const start = dayjs(startDate).startOf('day');
      const end = dayjs(endDate).endOf('day');

      const filteredSales = sales.filter(sale => {
        const saleDate = dayjs(sale.date, 'DD-MMM-YYYY');
        return saleDate.isAfter(start) && saleDate.isBefore(end);
      });

      const filteredPurchases = purchases.filter(purchase => {
        const purchaseDate = dayjs(purchase.date, 'DD-MMM-YYYY');
        return purchaseDate.isAfter(start) && purchaseDate.isBefore(end);
      });

      const filteredExpenses = expenses.filter(expense => {
        const expenseDate = dayjs(expense.date, 'DD-MMM-YYYY');
        return expenseDate.isAfter(start) && expenseDate.isBefore(end);
      });

      const filteredInvestments = investments.filter(investment => {
        const investmentDate = dayjs(investment.date, 'DD-MMM-YYYY');
        return investmentDate.isAfter(start) && investmentDate.isBefore(end);
      });

      // Calculate totals
      const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
      const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + purchase.total, 0);
      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalInvestments = filteredInvestments.reduce((sum, investment) => sum + investment.amount, 0);
      const totalAssets = assets.reduce((sum, asset) => sum + asset.cost, 0);

      setMetrics({
        totalSales,
        totalPurchases,
        totalExpenses,
        totalInvestments,
        totalAssets,
        netIncome: totalSales - totalPurchases - totalExpenses
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 pt-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your business performance and financial metrics
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Total Sales"
              value={metrics.totalSales}
              type="currency"
            />
            <MetricCard
              title="Total Purchases"
              value={metrics.totalPurchases}
              type="currency"
            />
            <MetricCard
              title="Total Expenses"
              value={metrics.totalExpenses}
              type="currency"
            />
            <MetricCard
              title="Total Investments"
              value={metrics.totalInvestments}
              type="currency"
            />
            <MetricCard
              title="Total Assets"
              value={metrics.totalAssets}
              type="currency"
            />
            <MetricCard
              title="Net Income"
              value={metrics.netIncome}
              type="currency"
              className={cn(
                metrics.netIncome >= 0 ? "bg-green-50" : "bg-red-50",
                "dark:bg-transparent"
              )}
              valueClassName={metrics.netIncome >= 0 ? "text-green-600" : "text-red-600"}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 