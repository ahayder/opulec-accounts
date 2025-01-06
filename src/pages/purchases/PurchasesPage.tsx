import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPurchase, getPurchases, type PurchaseEntry as DBPurchaseEntry } from '@/utils/database';
import { Loader2, ChevronRight } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PurchaseFormData {
  date: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
  notes: string;
}

const PurchasesPage = () => {
  const { currentBusiness } = useBusiness();
  const [purchases, setPurchases] = useState<DBPurchaseEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [formData, setFormData] = useState<PurchaseFormData>({
    date: new Date().toISOString().split('T')[0],
    product: '',
    quantity: 0,
    price: 0,
    total: 0,
    notes: ''
  });

  useEffect(() => {
    if (currentBusiness) {
      loadPurchases();
    }
  }, [currentBusiness]);

  const loadPurchases = async () => {
    if (!currentBusiness) return;
    
    try {
      setIsLoading(true);
      const data = await getPurchases(currentBusiness.id);
      setPurchases(data);
    } catch (error) {
      console.error('Error loading purchases:', error);
      toast.error('Failed to load purchases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name: keyof PurchaseFormData, value: string | number) => {
    setFormData(prev => {
      const updates = {
        ...prev,
        [name]: value
      };
      
      // Automatically calculate total when quantity or price changes
      if (name === 'quantity' || name === 'price') {
        updates.total = Number(updates.quantity) * Number(updates.price);
      }
      
      return updates;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) {
      toast.error('Please select a business first');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addPurchase(currentBusiness.id, formData);
      await loadPurchases();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        product: '',
        quantity: 0,
        price: 0,
        total: 0,
        notes: ''
      });
      toast.success('Purchase added successfully');
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast.error('Failed to add purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full">
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out p-4 md:p-8 pt-6 overflow-auto",
          isSidebarOpen ? "pr-[400px]" : "pr-2"
        )}
      >
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Purchases</h1>
            <p className="text-muted-foreground">Track and manage your business purchases</p>
          </div>
        </div>

        <div className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[200px]">Product</TableHead>
                <TableHead className="text-right w-[100px]">Quantity</TableHead>
                <TableHead className="text-right w-[120px]">Price</TableHead>
                <TableHead className="text-right w-[120px]">Total</TableHead>
                <TableHead>Notes</TableHead>
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
                    No purchases entries yet
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
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

      <div 
        className={cn(
          "fixed right-0 top-0 h-full transition-all duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "translate-x-[calc(100%-16px)]"
        )}
      >
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-10 w-10 absolute -left-5 top-[68px] z-10 rounded-full bg-background border shadow-md hover:bg-accent",
            !isSidebarOpen && "rotate-180"
          )}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        <div className="w-[400px] border-l bg-background h-full overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">New Purchase Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Input
                    id="product"
                    type="text"
                    value={formData.product}
                    onChange={(e) => handleInputChange('product', e.target.value)}
                    placeholder="Enter product name"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value))}
                    placeholder="0"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                    placeholder="৳0.00"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    type="number"
                    value={formData.total}
                    readOnly
                    className="w-full bg-muted"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    type="text"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter notes"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
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
        </div>
      </div>
    </div>
  );
};

export default PurchasesPage; 