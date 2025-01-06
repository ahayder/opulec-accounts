import React, { useState, useEffect } from 'react';
import { getSales, getPurchases, getExpenses, getInvestments, getAssets } from '@/utils/database';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import { useBusiness } from '@/contexts/BusinessContext';
import dayjs from 'dayjs';

interface DashboardMetrics {
  // Time-based metrics
  totalSales: number;
  totalCOGS: number;
  grossProfit: number;
  totalOperatingExpenses: number;
  netProfit: number;
  
  // Portfolio metrics
  totalInvestments: number;
  investorCount: number;
  totalAssetValue: number;
  totalDepreciation: number;
  netAssetValue: number;
}

const DashboardPage = () => {
  const { currentBusiness, isLoading } = useBusiness();
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    // Time-based metrics
    totalSales: 0,
    totalCOGS: 0,
    grossProfit: 0,
    totalOperatingExpenses: 0,
    netProfit: 0,
    
    // Portfolio metrics
    totalInvestments: 0,
    investorCount: 0,
    totalAssetValue: 0,
    totalDepreciation: 0,
    netAssetValue: 0
  });

  const calculateMetrics = async () => {
    if (!currentBusiness) return;

    try {
      // Fetch all data
      const [sales, purchases, expenses, investments, assets] = await Promise.all([
        getSales(currentBusiness.id),
        getPurchases(currentBusiness.id),
        getExpenses(currentBusiness.id),
        getInvestments(currentBusiness.id),
        getAssets(currentBusiness.id)
      ]);

      // Calculate time-based metrics
      const filteredSales = (sales || []).filter(sale => {
        const saleDate = dayjs(sale.date);
        return saleDate.isAfter(dayjs(startDate)) && saleDate.isBefore(dayjs(endDate).add(1, 'day'));
      });

      const filteredPurchases = (purchases || []).filter(purchase => {
        const purchaseDate = dayjs(purchase.date);
        return purchaseDate.isAfter(dayjs(startDate)) && purchaseDate.isBefore(dayjs(endDate).add(1, 'day'));
      });

      const filteredExpenses = (expenses || []).filter(expense => {
        const expenseDate = dayjs(expense.date);
        return expenseDate.isAfter(dayjs(startDate)) && expenseDate.isBefore(dayjs(endDate).add(1, 'day'));
      });

      const totalSales = Number(filteredSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)) || 0;
      const totalCOGS = Number(filteredPurchases.reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0)) || 0;
      const grossProfit = totalSales - totalCOGS;
      const totalOperatingExpenses = Number(filteredExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0)) || 0;
      const netProfit = grossProfit - totalOperatingExpenses;

      // Calculate portfolio metrics
      const totalInvestments = Number((investments || []).reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)) || 0;
      const uniqueInvestors = new Set((investments || []).map(inv => inv.investor)).size;

      // Calculate asset metrics
      const now = dayjs();
      let totalAssetValue = 0;
      let totalDepreciation = 0;

      (assets || []).forEach(asset => {
        const cost = Number(asset.cost) || 0;
        totalAssetValue += cost;
        
        // Calculate depreciation
        const purchaseDate = dayjs(asset.purchaseDate);
        const ageInYears = now.diff(purchaseDate, 'year', true);
        const yearlyDepreciation = cost / asset.usefulLife;
        const currentDepreciation = Math.min(cost, yearlyDepreciation * ageInYears);
        
        totalDepreciation += currentDepreciation;
      });

      const netAssetValue = totalAssetValue - totalDepreciation;

      setMetrics({
        // Time-based metrics
        totalSales,
        totalCOGS,
        grossProfit,
        totalOperatingExpenses,
        netProfit,
        
        // Portfolio metrics
        totalInvestments,
        investorCount: uniqueInvestors,
        totalAssetValue,
        totalDepreciation,
        netAssetValue
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
      setMetrics({
        totalSales: 0,
        totalCOGS: 0,
        grossProfit: 0,
        totalOperatingExpenses: 0,
        netProfit: 0,
        totalInvestments: 0,
        investorCount: 0,
        totalAssetValue: 0,
        totalDepreciation: 0,
        netAssetValue: 0
      });
    }
  };

  useEffect(() => {
    calculateMetrics();
  }, [startDate, endDate, currentBusiness]);

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
          <p className="text-muted-foreground">
            {currentBusiness 
              ? `Track ${currentBusiness.name}'s performance and financial metrics` 
              : 'Select a business to view metrics'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : !currentBusiness ? (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-muted-foreground">Please select or create a business to view metrics</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time-based Metrics Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Performance Metrics</h2>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="startDate" className="text-sm font-medium whitespace-nowrap">From:</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="endDate" className="text-sm font-medium whitespace-nowrap">To:</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDateRangeClick('week')}
                      className="flex-1 text-sm"
                    >
                      Last 7 Days
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDateRangeClick('month')}
                      className="flex-1 text-sm"
                    >
                      Last Month
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDateRangeClick('3months')}
                      className="flex-1 text-sm"
                    >
                      Last 3 Months
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
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

          {/* Portfolio Overview Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Portfolio Overview</h2>
            
            {/* Investment Summary */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Investment Summary</h3>
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Total Investments</h3>
                      <ArrowUpIcon className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">৳{metrics.totalInvestments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Number of Investors</h3>
                      <ArrowUpIcon className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">{metrics.investorCount}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Asset Summary */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Asset Summary</h3>
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Total Asset Value</h3>
                      <ArrowUpIcon className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">৳{metrics.totalAssetValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Total Depreciation</h3>
                      <ArrowDownIcon className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold">৳{metrics.totalDepreciation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Net Asset Value</h3>
                      {metrics.netAssetValue >= 0 ? (
                        <ArrowUpIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className={`text-2xl font-bold ${metrics.netAssetValue < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ৳{metrics.netAssetValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 