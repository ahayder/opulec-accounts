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
import { getPurchases, addPurchase, type PurchaseEntry } from '@/utils/database';
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

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPurchase, setNewPurchase] = useState<Partial<PurchaseEntry>>({
    date: formatDate(new Date())
  });

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setIsLoading(true);
      const data = await getPurchases();
      setPurchases(data);
    } catch (error) {
      console.error('Error loading purchases:', error);
      toast.error('Failed to load purchases data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPurchase(prev => {
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
    if (!newPurchase.product || !newPurchase.quantity || !newPurchase.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const purchaseEntry = {
        date: newPurchase.date || formatDate(new Date()),
        product: newPurchase.product,
        quantity: Number(newPurchase.quantity),
        price: Number(newPurchase.price),
        total: Number(newPurchase.quantity) * Number(newPurchase.price),
        notes: newPurchase.notes || ''
      };
      
      await addPurchase(purchaseEntry);
      await loadPurchases();
      setNewPurchase({ date: formatDate(new Date()) }); // Reset form
      toast.success('Purchase entry added successfully');
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast.error('Failed to add purchase entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Purchases</h1>
        <p className="text-muted-foreground mt-2">Record and manage your purchase transactions</p>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">New Purchase Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={dateToInputValue(newPurchase.date || new Date())}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="product">Product</Label>
              <Input
                id="product"
                name="product"
                value={newPurchase.product || ''}
                onChange={handleInputChange}
                required
                placeholder="Product name"
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
                value={newPurchase.quantity || ''}
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
                value={newPurchase.price || ''}
                onChange={handleInputChange}
                required
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={newPurchase.notes || ''}
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
              <TableHead className="w-[200px]">Product</TableHead>
              <TableHead className="text-right w-[100px]">Quantity</TableHead>
              <TableHead className="text-right w-[120px]">Price</TableHead>
              <TableHead className="text-right w-[120px]">Total</TableHead>
              <TableHead className="w-[250px]">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading purchases data...
                  </div>
                </TableCell>
              </TableRow>
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No purchase entries yet
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{purchase.date}</TableCell>
                  <TableCell>{purchase.product}</TableCell>
                  <TableCell className="text-right">{purchase.quantity}</TableCell>
                  <TableCell className="text-right">৳{purchase.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">৳{purchase.total.toFixed(2)}</TableCell>
                  <TableCell>{purchase.notes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PurchasesPage; 