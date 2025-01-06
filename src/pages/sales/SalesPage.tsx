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
import { 
  getSales, 
  addSale,
  deleteSale,
  getDeletedSales,
  restoreSale,
  type SaleEntry,
  getProductCategories,
  getColorCategories,
  getDialColorCategories,
  type Category
} from '@/utils/database';
import { toast } from 'sonner';
import { Loader2, ChevronRight, Trash2, RotateCcw } from "lucide-react";
import dayjs from 'dayjs';
import { cn } from "@/lib/utils";
import CategorySelect from '@/components/form/CategorySelect';
import GenderSelect from '@/components/form/GenderSelect';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

// Define Firestore Timestamp type for internal use
type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

// Helper function to format date as DD-MMM-YYYY
const formatDate = (date: Date | string): string => {
  return dayjs(date).format('DD-MMM-YYYY');
};

// Helper function to convert date to YYYY-MM-DD for input field
const dateToInputValue = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

// Helper function to handle Firestore timestamp or string date
const formatSaleDate = (date: string | FirestoreTimestamp): string => {
  if (typeof date === 'object' && 'seconds' in date) {
    return formatDate(new Date(date.seconds * 1000));
  }
  return date;
};

const SalesPage = () => {
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [colorCategories, setColorCategories] = useState<Category[]>([]);
  const [dialColorCategories, setDialColorCategories] = useState<Category[]>([]);
  const [saleToDelete, setSaleToDelete] = useState<SaleEntry | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [newSale, setNewSale] = useState<Partial<SaleEntry>>({
    date: formatDate(new Date())
  });

  useEffect(() => {
    loadData();
  }, [showDeleted]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [salesData, productCats, colorCats, dialColorCats] = await Promise.all([
        showDeleted ? getDeletedSales() : getSales(),
        getProductCategories(),
        getColorCategories(),
        getDialColorCategories()
      ]);
      setSales(salesData);
      setProductCategories(productCats);
      setColorCategories(colorCats);
      setDialColorCategories(dialColorCats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load sales data', {
        dismissible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      toast.error('Please fill in all required fields', {
        dismissible: true
      });
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
        notes: newSale.notes || '',
        gender: newSale.gender || '',
        color: newSale.color || '',
        dialColor: newSale.dialColor || ''
      };
      
      await addSale(saleEntry);
      await loadData();
      setNewSale({ date: formatDate(new Date()) }); // Reset form
      toast.success('Sale entry added successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error adding sale:', error);
      toast.error('Failed to add sale entry', {
        dismissible: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (sale: SaleEntry) => {
    if (!sale.id) return;
    
    try {
      await deleteSale(sale.id);
      await loadData();
      toast.success('Sale entry deleted successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Failed to delete sale entry', {
        dismissible: true
      });
    } finally {
      setSaleToDelete(null);
    }
  };

  const handleRestore = async (sale: SaleEntry) => {
    if (!sale.id) return;
    
    try {
      setIsRestoring(true);
      await restoreSale(sale.id);
      await loadData();
      toast.success('Sale entry restored successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error restoring sale:', error);
      toast.error('Failed to restore sale entry', {
        dismissible: true
      });
    } finally {
      setIsRestoring(false);
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
            <h1 className="text-2xl font-bold">Sales</h1>
            <p className="text-muted-foreground">Record and manage your sales transactions</p>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="show-deleted" className="text-sm">
              Show Deleted Records
            </Label>
            <Switch
              id="show-deleted"
              checked={showDeleted}
              onCheckedChange={setShowDeleted}
            />
          </div>
        </div>

        <div className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[180px]">Product</TableHead>
                <TableHead className="w-[120px]">Order Number</TableHead>
                <TableHead className="w-[100px]">Gender</TableHead>
                <TableHead className="w-[100px]">Color</TableHead>
                <TableHead className="w-[100px]">Dial Color</TableHead>
                <TableHead className="text-right w-[100px]">Quantity</TableHead>
                <TableHead className="text-right w-[120px]">Price</TableHead>
                <TableHead className="text-right w-[120px]">Total</TableHead>
                <TableHead className="w-[200px]">Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading sales data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    {showDeleted ? 'No deleted sales entries' : 'No sales entries yet'}
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id} className={cn(sale.isDeleted && "bg-muted/50")}>
                    <TableCell>{formatSaleDate(sale.date)}</TableCell>
                    <TableCell>{sale.product}</TableCell>
                    <TableCell>{sale.order_number}</TableCell>
                    <TableCell>{sale.gender}</TableCell>
                    <TableCell>{sale.color}</TableCell>
                    <TableCell>{sale.dialColor}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right">৳{sale.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">৳{sale.total.toFixed(2)}</TableCell>
                    <TableCell>{sale.notes}</TableCell>
                    <TableCell>
                      {showDeleted ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(sale)}
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
                          disabled={isRestoring}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSaleToDelete(sale)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
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
            <h2 className="text-lg font-semibold mb-4">New Sale Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
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

                <div>
                  <Label htmlFor="product">Product</Label>
                  <CategorySelect
                    value={newSale.product || ''}
                    onValueChange={(value) => setNewSale(prev => ({ ...prev, product: value }))}
                    categories={productCategories}
                    placeholder="Select product"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
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

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <GenderSelect
                    value={newSale.gender || ''}
                    onValueChange={(value) => setNewSale(prev => ({ ...prev, gender: value }))}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <CategorySelect
                    value={newSale.color || ''}
                    onValueChange={(value) => setNewSale(prev => ({ ...prev, color: value }))}
                    categories={colorCategories}
                    placeholder="Select color"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="dialColor">Dial Color</Label>
                  <CategorySelect
                    value={newSale.dialColor || ''}
                    onValueChange={(value) => setNewSale(prev => ({ ...prev, dialColor: value }))}
                    categories={dialColorCategories}
                    placeholder="Select dial color"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={newSale.quantity || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
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
                    placeholder="৳0.00"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    name="total"
                    type="number"
                    value={newSale.total || ''}
                    readOnly
                    className="w-full bg-muted"
                  />
                </div>

                <div>
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

              <div className="flex justify-end">
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
        </div>
      </div>

      <AlertDialog 
        open={saleToDelete !== null} 
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this sale entry and update the inventory accordingly.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => saleToDelete && handleDelete(saleToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalesPage; 