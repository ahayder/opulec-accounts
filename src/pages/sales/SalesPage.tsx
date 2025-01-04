import React, { useState } from 'react';
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

interface SaleEntry {
  id: string;
  date: string;
  product: string;
  orderNumber: string;
  quantity: number;
  price: number;
  total: number;
}

// Helper function to format date as DD-MMM-YYYY
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Helper function to convert date to YYYY-MM-DD for input field
const dateToInputValue = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const SalesPage = () => {
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [newSale, setNewSale] = useState<Partial<SaleEntry>>({
    date: formatDate(new Date())
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSale(prev => {
      const updated = { ...prev, [name]: value };
      if ((name === 'quantity' || name === 'price') && updated.quantity && updated.price) {
        updated.total = Number(updated.quantity) * Number(updated.price);
      }
      if (name === 'date') {
        updated.date = formatDate(new Date(value));
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSale.product && newSale.orderNumber && newSale.quantity && newSale.price) {
      const saleEntry: SaleEntry = {
        id: Date.now().toString(),
        date: newSale.date || formatDate(new Date()),
        product: newSale.product,
        orderNumber: newSale.orderNumber,
        quantity: Number(newSale.quantity),
        price: Number(newSale.price),
        total: Number(newSale.quantity) * Number(newSale.price)
      };
      setSales(prev => [...prev, saleEntry]);
      setNewSale({ date: formatDate(new Date()) });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales</h1>
        <p className="text-muted-foreground mt-2">Record and manage your sales transactions</p>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">New Sale Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-6 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={dateToInputValue(new Date())}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Input
                id="product"
                name="product"
                value={newSale.product || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                name="orderNumber"
                value={newSale.orderNumber || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={newSale.quantity || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={newSale.price || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Button type="submit" className="w-full">Save Sale</Button>
            </div>
          </div>
        </form>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Order Number</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.date}</TableCell>
                <TableCell>{sale.product}</TableCell>
                <TableCell>{sale.orderNumber}</TableCell>
                <TableCell className="text-right">{sale.quantity}</TableCell>
                <TableCell className="text-right">${sale.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">${sale.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {sales.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No sales entries yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SalesPage; 