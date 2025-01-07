import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { Loader2 } from "lucide-react";
import dayjs from 'dayjs';
import { getSales, getPurchases } from '@/utils/database';

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = new Date();
  const [dashboardData, setDashboardData] = useState<{
    sales: number;
    purchases: number;
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
    currentStock: {}
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [sales, purchases] = await Promise.all([
        getSales(),
        getPurchases()
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

      setDashboardData({
        sales: totalSales,
        purchases: totalPurchases,
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your business performance
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{dashboardData.purchases.toFixed(2)}</div>
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