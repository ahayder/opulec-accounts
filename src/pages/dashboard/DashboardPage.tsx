import React, { useState, useEffect } from 'react';
import { getSales, getPurchases, getExpenses } from '@/utils/database';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import dayjs from 'dayjs';

interface DashboardMetrics {
  totalSales: number;
  totalCOGS: number;
  grossProfit: number;
  totalOperatingExpenses: number;
  netProfit: number;
}

const DashboardPage = () => {
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalCOGS: 0,
    grossProfit: 0,
    totalOperatingExpenses: 0,
    netProfit: 0
  });

  const calculateMetrics = async () => {
    try {
      const [sales, purchases, expenses] = await Promise.all([
        getSales(),
        getPurchases(),
        getExpenses()
      ]);

      const filteredSales = sales.filter(sale => {
        const saleDate = dayjs(sale.date);
        return saleDate.isAfter(dayjs(startDate)) && saleDate.isBefore(dayjs(endDate).add(1, 'day'));
      });

      const filteredPurchases = purchases.filter(purchase => {
        const purchaseDate = dayjs(purchase.date);
        return purchaseDate.isAfter(dayjs(startDate)) && purchaseDate.isBefore(dayjs(endDate).add(1, 'day'));
      });

      const filteredExpenses = expenses.filter(expense => {
        const expenseDate = dayjs(expense.date);
        return expenseDate.isAfter(dayjs(startDate)) && expenseDate.isBefore(dayjs(endDate).add(1, 'day'));
      });

      const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
      const totalCOGS = filteredPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
      const grossProfit = totalSales - totalCOGS;
      const totalOperatingExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const netProfit = grossProfit - totalOperatingExpenses;

      setMetrics({
        totalSales,
        totalCOGS,
        grossProfit,
        totalOperatingExpenses,
        netProfit
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  useEffect(() => {
    calculateMetrics();
  }, [startDate, endDate]);

  const handleDateRangeClick = (range: 'week' | 'month' | '3months') => {
    const end = dayjs();
    let start;

    switch (range) {
      case 'week':
        start = end.subtract(7, 'day');
        break;
      case 'month':
        start = end.subtract(1, 'month');
        break;
      case '3months':
        start = end.subtract(3, 'month');
        break;
    }

    setStartDate(start.format('YYYY-MM-DD'));
    setEndDate(end.format('YYYY-MM-DD'));
  };

  return (
    <div className="space-y-6">
      <div className="h-16 border-b flex items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your business performance and financial metrics</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate" className="text-sm font-medium whitespace-nowrap">From:</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full md:w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="endDate" className="text-sm font-medium whitespace-nowrap">To:</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full md:w-40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleDateRangeClick('week')}
                className="flex-1 md:flex-none text-sm"
              >
                Last 7 Days
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDateRangeClick('month')}
                className="flex-1 md:flex-none text-sm"
              >
                Last Month
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDateRangeClick('3months')}
                className="flex-1 md:flex-none text-sm"
              >
                Last 3 Months
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
              <ArrowUpIcon className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">৳{metrics.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total COGS</h3>
              <ArrowDownIcon className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold">৳{metrics.totalCOGS.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Gross Profit</h3>
              {metrics.grossProfit >= 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className={`text-2xl font-bold ${metrics.grossProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ৳{metrics.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Operating Expenses</h3>
              <ArrowDownIcon className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold">৳{metrics.totalOperatingExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
              {metrics.netProfit >= 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className={`text-2xl font-bold ${metrics.netProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ৳{metrics.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage; 