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
  addProductCategory,
  getDeletedPurchases,
  restorePurchase,
  type PurchaseEntry,
  type Category
} from '@/utils/database';
import { Loader2, ChevronRight, Trash2, RotateCcw, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import CategorySelect from '@/components/form/CategorySelect';
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
import dayjs from 'dayjs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useSidebar } from '@/contexts/SidebarContext';

// Define Firestore Timestamp type for internal use
type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

type DateRange = {
  from: Date;
  to: Date;
} | null;

// Add Required label component
const RequiredLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <div className="flex items-center gap-1">
    <Label htmlFor={htmlFor}>{children}</Label>
    <span className="text-red-500">*</span>
  </div>
);

interface PurchaseFormData {
  date: string;
  product: string;
  order_number: string;
  quantity: number;
  price: number;
  total: number;
  notes: string;
}

// Helper function to format date for display
const formatDate = (date: Date | string): string => {
  return dayjs(date).format('DD-MMM-YYYY');
};

// Helper function to format date for input field
const dateToInputValue = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseEntry[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseEntry | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [dateRangeDisplay, setDateRangeDisplay] = useState<string>('');
  
  const [formData, setFormData] = useState<PurchaseFormData>({
    date: formatDate(new Date()),
    product: '',
    order_number: '',
    quantity: 0,
    price: 0,
    total: 0,
    notes: ''
  });

  // Calculate purchases summary based on filtered purchases
  const purchasesSummary = React.useMemo(() => {
    const summary = filteredPurchases.reduce((acc, purchase) => ({
      totalPurchases: acc.totalPurchases + purchase.total,
      totalQuantity: acc.totalQuantity + purchase.quantity,
      averagePrice: (acc.totalPurchases + purchase.total) / (acc.totalQuantity + purchase.quantity)
    }), {
      totalPurchases: 0,
      totalQuantity: 0,
      averagePrice: 0
    });

    // Calculate monthly average
    const dates = filteredPurchases.map(purchase => 
      typeof purchase.date === 'string' 
        ? new Date(purchase.date) 
        : new Date((purchase.date as FirestoreTimestamp).seconds * 1000)
    );
    
    let monthlyAverage = 0;
    if (dates.length > 0) {
      const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
      const latest = new Date(Math.max(...dates.map(d => d.getTime())));
      const monthDiff = (latest.getFullYear() - earliest.getFullYear()) * 12 + 
                       (latest.getMonth() - earliest.getMonth()) + 1;
      monthlyAverage = summary.totalPurchases / Math.max(1, monthDiff);
    }

    return {
      ...summary,
      monthlyAverage
    };
  }, [filteredPurchases]);

  useEffect(() => {
    loadData();
  }, [showDeleted]);

  useEffect(() => {
    if (purchases.length > 0) {
      filterPurchases();
    }
  }, [purchases, dateRange, activeFilter]);

  useEffect(() => {
    updateDateRangeDisplay();
  }, [filteredPurchases, activeFilter, dateRange]);

  const filterPurchases = () => {
    let filtered = [...purchases];
    
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(purchase => {
        const purchaseDate = typeof purchase.date === 'string' 
          ? new Date(purchase.date) 
          : new Date((purchase.date as FirestoreTimestamp).seconds * 1000);
        return purchaseDate >= dateRange.from && purchaseDate <= dateRange.to;
      });
    } else {
      const today = new Date();
      const fromDate = new Date();

      switch (activeFilter) {
        case '7days':
          fromDate.setDate(today.getDate() - 7);
          break;
        case '1month':
          fromDate.setMonth(today.getMonth() - 1);
          break;
        case '3months':
          fromDate.setMonth(today.getMonth() - 3);
          break;
        default:
          setFilteredPurchases(filtered);
          return;
      }

      filtered = filtered.filter(purchase => {
        const purchaseDate = typeof purchase.date === 'string' 
          ? new Date(purchase.date) 
          : new Date((purchase.date as FirestoreTimestamp).seconds * 1000);
        return purchaseDate >= fromDate && purchaseDate <= today;
      });
    }

    setFilteredPurchases(filtered);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [
        purchasesData,
        productCats
      ] = await Promise.all([
        showDeleted ? getDeletedPurchases() : getPurchases(),
        getProductCategories()
      ]);
      
      // Sort purchases by date (most recent first)
      const sortedPurchases = purchasesData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
      setPurchases(sortedPurchases);
      setProductCategories(productCats);
      console.log('Loaded categories:', {
        products: productCats
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const requiredFields = {
      date: 'Date',
      product: 'Product',
      quantity: 'Quantity',
      price: 'Price'
    } as const;

    const missingFields = Object.entries(requiredFields).filter(
      ([key]) => !formData[key as keyof typeof requiredFields]
    ).map(([, label]) => label);

    if (missingFields.length > 0) {
      toast.error(`Required fields missing: ${missingFields.join(', ')}`, {
        dismissible: true
      });
      return;
    }

    if (Number(formData.quantity) <= 0) {
      toast.error('Quantity must be greater than 0', {
        dismissible: true
      });
      return;
    }

    if (Number(formData.price) <= 0) {
      toast.error('Price must be greater than 0', {
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
        date: formatDate(new Date()),
        product: '',
        order_number: '',
        quantity: 0,
        price: 0,
        total: 0,
        notes: ''
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

  const updateDateRangeDisplay = () => {
    if (filteredPurchases.length === 0) {
      setDateRangeDisplay('No data to display');
      return;
    }

    // Get the earliest and latest dates from filtered data
    const dates = filteredPurchases.map(purchase => 
      typeof purchase.date === 'string' 
        ? new Date(purchase.date) 
        : new Date((purchase.date as FirestoreTimestamp).seconds * 1000)
    );
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));

    // Format date to "Jan 1 2025" style
    const formatDisplayDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };

    if (dateRange?.from && dateRange?.to) {
      setDateRangeDisplay(`Showing data from ${formatDisplayDate(dateRange.from)} to ${formatDisplayDate(dateRange.to)}`);
    } else {
      switch (activeFilter) {
        case 'all':
          setDateRangeDisplay(`Showing all data (${formatDisplayDate(earliest)} - ${formatDisplayDate(latest)})`);
          break;
        case '7days':
          setDateRangeDisplay(`Last 7 days (${formatDisplayDate(earliest)} - ${formatDisplayDate(latest)})`);
          break;
        case '1month':
          setDateRangeDisplay(`Last month (${formatDisplayDate(earliest)} - ${formatDisplayDate(latest)})`);
          break;
        case '3months':
          setDateRangeDisplay(`Last 3 months (${formatDisplayDate(earliest)} - ${formatDisplayDate(latest)})`);
          break;
        default:
          setDateRangeDisplay('');
      }
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

        {/* Date Filter Section */}
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => {
                setActiveFilter('all');
                setDateRange(null);
              }}
            >
              All Time
            </Button>
            <Button
              variant={activeFilter === '7days' ? 'default' : 'outline'}
              onClick={() => {
                setActiveFilter('7days');
                setDateRange(null);
              }}
            >
              Last 7 Days
            </Button>
            <Button
              variant={activeFilter === '1month' ? 'default' : 'outline'}
              onClick={() => {
                setActiveFilter('1month');
                setDateRange(null);
              }}
            >
              Last Month
            </Button>
            <Button
              variant={activeFilter === '3months' ? 'default' : 'outline'}
              onClick={() => {
                setActiveFilter('3months');
                setDateRange(null);
              }}
            >
              Last 3 Months
            </Button>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange?.from ? 'default' : 'outline'}
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      formatDate(dateRange.from)
                    ) : (
                      "From Date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="border-b p-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Select start date</h4>
                      <p className="text-sm text-muted-foreground">
                        Pick the starting date
                      </p>
                    </div>
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange?.from}
                    onSelect={(date: Date | undefined) => {
                      if (date) {
                        const newRange = {
                          from: date,
                          to: dateRange?.to ?? date
                        };
                        setDateRange(newRange);
                        setActiveFilter('custom');
                      }
                    }}
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">-</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange?.to ? 'default' : 'outline'}
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange?.to && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.to ? (
                      formatDate(dateRange.to)
                    ) : (
                      "To Date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="border-b p-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Select end date</h4>
                      <p className="text-sm text-muted-foreground">
                        Pick the ending date
                      </p>
                    </div>
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange?.to}
                    onSelect={(date: Date | undefined) => {
                      if (date) {
                        const newRange = {
                          from: dateRange?.from ?? date,
                          to: date
                        };
                        setDateRange(newRange);
                        setActiveFilter('custom');
                      }
                    }}
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Date Range Display */}
          {dateRangeDisplay && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {dateRangeDisplay}
            </div>
          )}
        </div>

        {/* Purchases Summary Section */}
        <div className="grid grid-cols-4 gap-4 mt-4 mb-6">
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Total Purchases</h3>
            <p className="text-2xl font-bold mt-1">৳{purchasesSummary.totalPurchases.toFixed(2)}</p>
          </div>
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Average</h3>
            <p className="text-2xl font-bold mt-1">৳{purchasesSummary.monthlyAverage.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">Per month</p>
          </div>
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Total Quantity</h3>
            <p className="text-2xl font-bold mt-1">{purchasesSummary.totalQuantity}</p>
          </div>
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Average Price</h3>
            <p className="text-2xl font-bold mt-1">৳{purchasesSummary.averagePrice.toFixed(2)}</p>
          </div>
        </div>

        <div className="border rounded-lg mt-4 min-w-[1220px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[200px]">Product</TableHead>
                <TableHead className="w-[150px]">Order Number</TableHead>
                <TableHead className="w-[120px]">Quantity</TableHead>
                <TableHead className="w-[150px]">Price</TableHead>
                <TableHead className="w-[150px]">Total</TableHead>
                <TableHead className="w-[250px]">Notes</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading purchases data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {showDeleted ? 'No deleted purchases entries' : 'No purchases entries yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id} className={cn(purchase.isDeleted && "bg-muted/50")}>
                    <TableCell>{formatDate(purchase.date)}</TableCell>
                    <TableCell>{purchase.product}</TableCell>
                    <TableCell>ORD-{Math.floor(Math.random() * 10000)}</TableCell>
                    <TableCell>{purchase.quantity}</TableCell>
                    <TableCell>৳{purchase.price.toFixed(2)}</TableCell>
                    <TableCell>৳{purchase.total.toFixed(2)}</TableCell>
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
          onClick={toggleSidebar}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        <div className="w-[400px] border-l bg-background h-full overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">New Purchase Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <RequiredLabel htmlFor="date">Date</RequiredLabel>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={dateToInputValue(formData.date)}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="product">Product</RequiredLabel>
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
                  <RequiredLabel htmlFor="quantity">Quantity</RequiredLabel>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.quantity || ''}
                    onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value))}
                    placeholder="0"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="price">Price</RequiredLabel>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                    placeholder="৳0.00"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    name="total"
                    type="number"
                    value={formData.total || ''}
                    readOnly
                    className="w-full bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add notes..."
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="order_number">Order Number</RequiredLabel>
                  <Input
                    id="order_number"
                    name="order_number"
                    value={formData.order_number}
                    onChange={(e) => handleInputChange('order_number', e.target.value)}
                    placeholder="Order #"
                    required
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