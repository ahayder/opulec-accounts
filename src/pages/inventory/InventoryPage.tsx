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
  getPurchases, 
  addPurchase,
  deletePurchase,
  getProductCategories,
  getSupplierCategories,
  getColorCategories,
  getDialColorCategories,
  addProductCategory,
  addSupplierCategory,
  addColorCategory,
  addDialColorCategory,
  getDeletedPurchases,
  restorePurchase,
  type PurchaseEntry,
  type Category
} from '@/utils/database';
import { Loader2, ChevronRight, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import dayjs from 'dayjs';
import { Switch } from "@/components/ui/switch";

interface PurchaseFormData {
  date: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
  notes: string;
  supplier: string;
  gender: string;
  color: string;
  dialColor: string;
}

const formatDate = (date: string): string => {
  return dayjs(date).format('DD-MMM-YYYY');
};

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseEntry | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [supplierCategories, setSupplierCategories] = useState<Category[]>([]);
  const [colorCategories, setColorCategories] = useState<Category[]>([]);
  const [dialColorCategories, setDialColorCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState<PurchaseFormData>({
    date: new Date().toISOString().split('T')[0],
    product: '',
    quantity: 0,
    price: 0,
    total: 0,
    notes: '',
    supplier: '',
    gender: '',
    color: '',
    dialColor: ''
  });

  useEffect(() => {
    loadData();
  }, [showDeleted]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [
        purchasesData,
        productCats,
        supplierCats,
        colorCats,
        dialColorCats
      ] = await Promise.all([
        showDeleted ? getDeletedPurchases() : getPurchases(),
        getProductCategories(),
        getSupplierCategories(),
        getColorCategories(),
        getDialColorCategories()
      ]);
      console.log('Loaded categories:', {
        products: productCats,
        suppliers: supplierCats,
        colors: colorCats,
        dialColors: dialColorCats
      });
      setPurchases(purchasesData);
      setProductCategories(productCats);
      setSupplierCategories(supplierCats);
      setColorCategories(colorCats);
      setDialColorCategories(dialColorCats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load inventory data', {
        dismissible: true
      });
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
      
      if (name === 'quantity' || name === 'price') {
        updates.total = Number(updates.quantity) * Number(updates.price);
      }
      
      return updates;
    });
  };

  const handleAddProduct = async (name: string) => {
    try {
      await addProductCategory({ name });
      const categories = await getProductCategories();
      setProductCategories(categories);
    } catch (error) {
      console.error('Error adding product category:', error);
      toast.error('Failed to add product', {
        dismissible: true
      });
    }
  };

  const handleAddSupplier = async (name: string) => {
    try {
      await addSupplierCategory({ name });
      const categories = await getSupplierCategories();
      setSupplierCategories(categories);
    } catch (error) {
      console.error('Error adding supplier category:', error);
      toast.error('Failed to add supplier', {
        dismissible: true
      });
    }
  };

  const handleAddColor = async (name: string) => {
    try {
      await addColorCategory({ name });
      const categories = await getColorCategories();
      setColorCategories(categories);
    } catch (error) {
      console.error('Error adding color category:', error);
      toast.error('Failed to add color', {
        dismissible: true
      });
    }
  };

  const handleAddDialColor = async (name: string) => {
    try {
      await addDialColorCategory({ name });
      const categories = await getDialColorCategories();
      setDialColorCategories(categories);
    } catch (error) {
      console.error('Error adding dial color category:', error);
      toast.error('Failed to add dial color', {
        dismissible: true
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product || !formData.quantity || !formData.price) {
      toast.error('Please fill in all required fields', {
        dismissible: true
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const purchaseEntry = {
        ...formData,
        date: formatDate(formData.date),
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        total: Number(formData.quantity) * Number(formData.price)
      };
      
      await addPurchase(purchaseEntry);
      await loadData();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        product: '',
        quantity: 0,
        price: 0,
        total: 0,
        notes: '',
        supplier: '',
        gender: '',
        color: '',
        dialColor: ''
      });
      toast.success('Purchase added successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast.error('Failed to add purchase', {
        dismissible: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (purchase: PurchaseEntry) => {
    if (!purchase.id) return;
    
    try {
      await deletePurchase(purchase.id);
      await loadData();
      toast.success('Purchase entry deleted successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Failed to delete purchase entry', {
        dismissible: true
      });
    } finally {
      setPurchaseToDelete(null);
    }
  };

  const handleRestore = async (purchase: PurchaseEntry) => {
    if (!purchase.id) return;
    
    try {
      setIsRestoring(true);
      await restorePurchase(purchase.id);
      await loadData();
      toast.success('Purchase entry restored successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error restoring purchase:', error);
      toast.error('Failed to restore purchase entry', {
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
            <h1 className="text-2xl font-bold">Purchases</h1>
            <p className="text-muted-foreground">Track and manage your purchase transactions</p>
          </div>
        </div>

        <Tabs defaultValue="purchases" className="mt-4">
          <TabsList>
            <TabsTrigger value="purchases">Purchase History</TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="border rounded-lg mt-4">
            <div className="flex justify-end mb-4">
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

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[200px]">Product</TableHead>
                    <TableHead className="w-[150px]">Supplier</TableHead>
                    <TableHead className="w-[100px]">Gender</TableHead>
                    <TableHead className="w-[100px]">Color</TableHead>
                    <TableHead className="w-[100px]">Dial Color</TableHead>
                    <TableHead className="text-right w-[100px]">Quantity</TableHead>
                    <TableHead className="text-right w-[120px]">Price</TableHead>
                    <TableHead className="text-right w-[120px]">Total</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading purchases data...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground">
                        No purchase entries yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{purchase.date}</TableCell>
                        <TableCell>{purchase.product}</TableCell>
                        <TableCell>{purchase.supplier}</TableCell>
                        <TableCell>{purchase.gender}</TableCell>
                        <TableCell>{purchase.color}</TableCell>
                        <TableCell>{purchase.dialColor}</TableCell>
                        <TableCell className="text-right">{purchase.quantity}</TableCell>
                        <TableCell className="text-right">৳{purchase.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">৳{purchase.total.toFixed(2)}</TableCell>
                        <TableCell>{purchase.notes}</TableCell>
                        <TableCell>
                          {showDeleted ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestore(purchase)}
                              className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
                              disabled={isRestoring}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPurchaseToDelete(purchase)}
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
          </TabsContent>
        </Tabs>
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
                  <CategorySelect
                    value={formData.product}
                    onValueChange={(value) => handleInputChange('product', value)}
                    categories={productCategories}
                    onAddCategory={handleAddProduct}
                    placeholder="Select product"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <CategorySelect
                    value={formData.supplier}
                    onValueChange={(value) => handleInputChange('supplier', value)}
                    categories={supplierCategories}
                    onAddCategory={handleAddSupplier}
                    placeholder="Select supplier"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <CategorySelect
                    value={formData.color}
                    onValueChange={(value) => handleInputChange('color', value)}
                    categories={colorCategories}
                    onAddCategory={handleAddColor}
                    placeholder="Select color"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="dialColor">Dial Color</Label>
                  <CategorySelect
                    value={formData.dialColor}
                    onValueChange={(value) => handleInputChange('dialColor', value)}
                    categories={dialColorCategories}
                    onAddCategory={handleAddDialColor}
                    placeholder="Select dial color"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <GenderSelect
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
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
                    min="0"
                    step="0.01"
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
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    type="text"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add notes..."
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

      <AlertDialog 
        open={purchaseToDelete !== null} 
        onOpenChange={(open) => !open && setPurchaseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move this purchase entry to the deleted records and update the inventory accordingly.
              You can restore it later from the deleted records view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => purchaseToDelete && handleDelete(purchaseToDelete)}
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

export default PurchasesPage; 