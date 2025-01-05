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

interface PurchaseEntry {
  id: string;
  date: string;
  product: string;
  notes: string;
  quantity: number;
  price: number;
  total: number;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const dateToInputValue = (date: Date): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [newPurchase, setNewPurchase] = useState<Partial<PurchaseEntry>>({
    date: formatDate(new Date())
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPurchase(prev => {
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
    if (newPurchase.product && newPurchase.quantity && newPurchase.price) {
      const purchaseEntry: PurchaseEntry = {
        id: Date.now().toString(),
        date: newPurchase.date || formatDate(new Date()),
        product: newPurchase.product,
        notes: newPurchase.notes || '',
        quantity: Number(newPurchase.quantity),
        price: Number(newPurchase.price),
        total: Number(newPurchase.quantity) * Number(newPurchase.price)
      };
      setPurchases(prev => [...prev, purchaseEntry]);
      setNewPurchase({ date: formatDate(new Date()) });
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
                value={dateToInputValue(new Date(newPurchase.date || new Date()))}
                onChange={handleInputChange}
                required
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
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                value={newPurchase.quantity || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={newPurchase.price || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={newPurchase.notes || ''}
                onChange={handleInputChange}
                placeholder="Add any additional notes..."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit">Save Entry</Button>
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
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>{purchase.date}</TableCell>
                <TableCell>{purchase.product}</TableCell>
                <TableCell className="text-right">{purchase.quantity}</TableCell>
                <TableCell className="text-right">৳{purchase.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">৳{purchase.total.toFixed(2)}</TableCell>
                <TableCell>{purchase.notes}</TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No purchase entries yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PurchasesPage; 