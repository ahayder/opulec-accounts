import React, { useState, useEffect } from 'react';
import { getSales, getPurchases, getExpenses, getInvestments, getAssets } from '@/utils/database';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, CalendarIcon } from '@radix-ui/react-icons';
import { useBusiness } from '@/contexts/BusinessContext';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  const { currentBusiness, isLoading: isBusinessLoading } = useBusiness();
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    setIsCalculating(true);
    setError(null);

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
      setError('Failed to load dashboard metrics. Please try again.');
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
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (!isBusinessLoading) {
      calculateMetrics();
    }
  }, [startDate, endDate, currentBusiness, isBusinessLoading]);

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {currentBusiness 
              ? `Track ${currentBusiness.name}'s performance and financial metrics` 
              : 'Select a business to view metrics'}
          </p>
          {error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
          )}
        </div>

        <Card className="w-fit">
          <CardContent className="py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-36"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-36"
                  />
                </div>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <Tabs defaultValue="7d" className="w-fit">
                <TabsList>
                  <TabsTrigger value="7d" onClick={() => handleDateRangeClick('week')}>7D</TabsTrigger>
                  <TabsTrigger value="1m" onClick={() => handleDateRangeClick('month')}>1M</TabsTrigger>
                  <TabsTrigger value="3m" onClick={() => handleDateRangeClick('3months')}>3M</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>

      {isBusinessLoading || isCalculating ? (
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : !currentBusiness ? (
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <p className="text-muted-foreground">Please select or create a business to view metrics</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Card className="shadow-sm">
                <CardHeader className="pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Total Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">
                      ৳{metrics.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <ArrowUpIcon className="h-3 w-3 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Total COGS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">
                      ৳{metrics.totalCOGS.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <ArrowDownIcon className="h-3 w-3 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Gross Profit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className={`text-xl font-bold ${metrics.grossProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ৳{metrics.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {metrics.grossProfit >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Operating Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">
                      ৳{metrics.totalOperatingExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <ArrowDownIcon className="h-3 w-3 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm md:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Net Profit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className={`text-xl font-bold ${metrics.netProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ৳{metrics.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {metrics.netProfit >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Portfolio Overview */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Portfolio Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Investment Summary */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-3">Investment Summary</h3>
                <div className="space-y-3">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2 space-y-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        Total Investments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold">
                          ৳{metrics.totalInvestments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <ArrowUpIcon className="h-3 w-3 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-2 space-y-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        Number of Investors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold">
                          {metrics.investorCount}
                        </div>
                        <ArrowUpIcon className="h-3 w-3 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Asset Summary */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-3">Asset Summary</h3>
                <div className="space-y-3">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2 space-y-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        Total Asset Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold">
                          ৳{metrics.totalAssetValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <ArrowUpIcon className="h-3 w-3 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-2 space-y-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        Total Depreciation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold">
                          ৳{metrics.totalDepreciation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <ArrowDownIcon className="h-3 w-3 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-2 space-y-0">
                      <CardTitle className="text-xs font-medium text-muted-foreground">
                        Net Asset Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className={`text-xl font-bold ${metrics.netAssetValue < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ৳{metrics.netAssetValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {metrics.netAssetValue >= 0 ? (
                          <ArrowUpIcon className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 