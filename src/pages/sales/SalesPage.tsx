import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSales, addSale, type SaleEntry } from '@/utils/database';
import { toast } from 'sonner';
import { Loader2 } from "lucide-react";
import dayjs from 'dayjs';

// Helper function to format date as DD-MMM-YYYY
const formatDate = (date: Date | string): string => {
  return dayjs(date).format('DD-MMM-YYYY');
};

// Helper function to convert date to YYYY-MM-DD for input field
const dateToInputValue = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

const SalesPage = () => {
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSale, setNewSale] = useState<Partial<SaleEntry>>({
    date: formatDate(new Date())
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const data = await getSales();
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSale(prev => {
      const updated = { ...prev, [name]: value };
      
      // Calculate total when quantity or price changes
      if (name === 'quantity' || name === 'price') {
        const quantity = name === 'quantity' ? Number(value) : Number(prev.quantity) || 0;
        const price = name === 'price' ? Number(value) : Number(prev.price) || 0;
        updated.total = quantity * price;
      }
      
      // Format date when date changes
      if (name === 'date') {
        updated.date = formatDate(value);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSale.product || !newSale.order_number || !newSale.quantity || !newSale.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const saleEntry = {
        date: newSale.date || formatDate(new Date()),
        product: newSale.product,
        order_number: newSale.order_number,
        quantity: Number(newSale.quantity),
        price: Number(newSale.price),
        total: Number(newSale.quantity) * Number(newSale.price),
        notes: newSale.notes || ''
      };
      
      await addSale(saleEntry);
      await loadSales();
      setNewSale({ date: formatDate(new Date()) }); // Reset form
      toast.success('Sale entry added successfully');
    } catch (error) {
      console.error('Error adding sale:', error);
      toast.error('Failed to add sale entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="h-16 border-b flex items-center">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Record and manage your sales transactions</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">New Sale Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={dateToInputValue(newSale.date || new Date())}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="product">Product</Label>
              <Input
                id="product"
                name="product"
                value={newSale.product || ''}
                onChange={handleInputChange}
                required
                placeholder="Product name"
                disabled={isSubmitting}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="order_number">Order Number</Label>
              <Input
                id="order_number"
                name="order_number"
                value={newSale.order_number || ''}
                onChange={handleInputChange}
                required
                placeholder="Order #"
                disabled={isSubmitting}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={newSale.quantity || ''}
                onChange={handleInputChange}
                required
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={newSale.price || ''}
                onChange={handleInputChange}
                required
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={newSale.notes || ''}
                onChange={handleInputChange}
                placeholder="Add notes..."
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Entry'
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[180px]">Product</TableHead>
              <TableHead className="w-[120px]">Order Number</TableHead>
              <TableHead className="text-right w-[100px]">Quantity</TableHead>
              <TableHead className="text-right w-[120px]">Price</TableHead>
              <TableHead className="text-right w-[120px]">Total</TableHead>
              <TableHead className="w-[200px]">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading sales data...
                  </div>
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No sales entries yet
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell>{sale.product}</TableCell>
                  <TableCell>{sale.order_number}</TableCell>
                  <TableCell className="text-right">{sale.quantity}</TableCell>
                  <TableCell className="text-right">৳{sale.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">৳{sale.total.toFixed(2)}</TableCell>
                  <TableCell>{sale.notes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SalesPage; 