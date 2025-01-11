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
  type Category
} from '@/utils/database';
import { toast } from 'sonner';
import { Loader2, ChevronRight, Trash2, RotateCcw, Calendar } from "lucide-react";
import dayjs from 'dayjs';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import "react-day-picker/dist/style.css";

// Define Firestore Timestamp type for internal use
type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

type DateRange = {
  from: Date;
  to: Date;
} | null;

// Helper function to format date for display
const formatDate = (date: Date | string): string => {
  return dayjs(date).format('DD-MMM-YYYY');
};

// Helper function to format date for input field
const dateToInputValue = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

// Helper function to format sale date
const formatSaleDate = (date: string | FirestoreTimestamp): string => {
  if (typeof date === 'string') {
    return date;
  }
  return formatDate(new Date(date.seconds * 1000));
};

// Add a Required label component
const RequiredLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <div className="flex items-center gap-1">
    <Label htmlFor={htmlFor}>{children}</Label>
    <span className="text-red-500">*</span>
  </div>
);

const SalesPage = () => {
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [saleToDelete, setSaleToDelete] = useState<SaleEntry | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [dateRangeDisplay, setDateRangeDisplay] = useState<string>('');
  
  const [newSale, setNewSale] = useState<Partial<SaleEntry>>({
    date: formatDate(new Date())
  });

  // Calculate sales summary based on filtered sales
  const salesSummary = React.useMemo(() => {
    return filteredSales.reduce((acc, sale) => ({
      totalSales: acc.totalSales + sale.total,
      totalQuantity: acc.totalQuantity + sale.quantity,
      totalOrders: acc.totalOrders + 1,
      averageOrderValue: (acc.totalSales + sale.total) / (acc.totalOrders + 1)
    }), {
      totalSales: 0,
      totalQuantity: 0,
      totalOrders: 0,
      averageOrderValue: 0
    });
  }, [filteredSales]);

  useEffect(() => {
    loadData();
  }, [showDeleted]);

  useEffect(() => {
    if (sales.length > 0) {
      filterSales();
    }
  }, [sales, dateRange, activeFilter]);

  useEffect(() => {
    updateDateRangeDisplay();
  }, [filteredSales, activeFilter, dateRange]);

  const filterSales = () => {
    let filtered = [...sales];
    
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(sale => {
        const saleDate = typeof sale.date === 'string' 
          ? new Date(sale.date) 
          : new Date((sale.date as FirestoreTimestamp).seconds * 1000);
        return saleDate >= dateRange.from && saleDate <= dateRange.to;
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
          setFilteredSales(filtered);
          return;
      }

      filtered = filtered.filter(sale => {
        const saleDate = typeof sale.date === 'string' 
          ? new Date(sale.date) 
          : new Date((sale.date as FirestoreTimestamp).seconds * 1000);
        return saleDate >= fromDate && saleDate <= today;
      });
    }

    setFilteredSales(filtered);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [salesData, productCats] = await Promise.all([
        showDeleted ? getDeletedSales() : getSales(),
        getProductCategories()
      ]);
      
      // Sort sales by date (most recent first)
      const sortedSales = salesData.sort((a, b) => {
        const getDateValue = (date: string | FirestoreTimestamp) => {
          if (typeof date === 'string') {
            return new Date(date).getTime();
          }
          return new Date(date.seconds * 1000).getTime();
        };
        
        return getDateValue(b.date) - getDateValue(a.date);
      });
      
      setSales(sortedSales);
      setFilteredSales(sortedSales);
      setProductCategories(productCats);
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
    
    // Enhanced validation
    const requiredFields = {
      date: 'Date',
      product: 'Product',
      order_number: 'Order Number',
      quantity: 'Quantity',
      price: 'Price'
    } as const;

    const missingFields = Object.entries(requiredFields).filter(
      ([key]) => !newSale[key as keyof typeof requiredFields]
    ).map(([, label]) => label);

    if (missingFields.length > 0) {
      toast.error(`Required fields missing: ${missingFields.join(', ')}`, {
        dismissible: true
      });
      return;
    }

    if (Number(newSale.quantity) <= 0) {
      toast.error('Quantity must be greater than 0', {
        dismissible: true
      });
      return;
    }

    if (Number(newSale.price) <= 0) {
      toast.error('Price must be greater than 0', {
        dismissible: true
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const saleEntry = {
        date: newSale.date || formatDate(new Date()),
        product: newSale.product!,
        order_number: newSale.order_number!,
        quantity: Number(newSale.quantity),
        price: Number(newSale.price),
        total: Number(newSale.quantity) * Number(newSale.price),
        notes: newSale.notes || ''
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

  const updateDateRangeDisplay = () => {
    if (filteredSales.length === 0) {
      setDateRangeDisplay('No data to display');
      return;
    }

    // Get the earliest and latest dates from filtered data
    const dates = filteredSales.map(sale => 
      typeof sale.date === 'string' 
        ? new Date(sale.date) 
        : new Date((sale.date as FirestoreTimestamp).seconds * 1000)
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

        {/* Sales Summary Section */}
        <div className="grid grid-cols-3 gap-4 mt-4 mb-6">
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Total Sales</h3>
            <p className="text-2xl font-bold mt-1">৳{salesSummary.totalSales.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">{salesSummary.totalOrders} orders</p>
          </div>
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Total Quantity</h3>
            <p className="text-2xl font-bold mt-1">{salesSummary.totalQuantity}</p>
            <p className="text-sm text-muted-foreground mt-1">Items sold</p>
          </div>
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Average Order Value</h3>
            <p className="text-2xl font-bold mt-1">৳{salesSummary.averageOrderValue.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">Per order</p>
          </div>
        </div>

        <div className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[180px]">Product</TableHead>
                <TableHead className="w-[120px]">Order Number</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[120px]">Price</TableHead>
                <TableHead className="w-[120px]">Total</TableHead>
                <TableHead className="w-[200px]">Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading sales data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {showDeleted ? 'No deleted sales entries' : 'No sales entries for the selected period'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id} className={cn(sale.isDeleted && "bg-muted/50")}>
                    <TableCell>{formatSaleDate(sale.date)}</TableCell>
                    <TableCell>{sale.product}</TableCell>
                    <TableCell>{sale.order_number}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>৳{sale.price.toFixed(2)}</TableCell>
                    <TableCell>৳{sale.total.toFixed(2)}</TableCell>
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
                  <RequiredLabel htmlFor="date">Date</RequiredLabel>
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
                  <RequiredLabel htmlFor="product">Product</RequiredLabel>
                  <CategorySelect
                    value={newSale.product || ''}
                    onValueChange={(value) => setNewSale(prev => ({ ...prev, product: value }))}
                    categories={productCategories}
                    placeholder="Select product"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <RequiredLabel htmlFor="order_number">Order Number</RequiredLabel>
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
                  <RequiredLabel htmlFor="quantity">Quantity</RequiredLabel>
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
                  <RequiredLabel htmlFor="price">Price</RequiredLabel>
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
                  <RequiredLabel htmlFor="total">Total</RequiredLabel>
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
                  <Label htmlFor="notes">Notes (Optional)</Label>
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
        open={saleToDelete !== null} 
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move this sale entry to the deleted records and update the inventory accordingly.
              You can restore it later from the deleted records view.
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