import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addExpense, getExpenses, addExpenseCategory, getExpenseCategories, type ExpenseEntry as DBExpenseEntry, type ExpenseCategory, deleteExpense, getDeletedExpenses, restoreExpense } from '@/utils/database';
import { Loader2, ChevronRight, Trash2, RotateCcw, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { formatDate, formatDateForInput } from "@/utils/dateFormat";
import CategorySelect from '@/components/form/CategorySelect';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

// Define Firestore Timestamp type for internal use
type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

type DateRange = {
  from: Date;
  to: Date;
} | null;

interface ExpenseFormData {
  date: string;
  category: string;
  description: string;
  amount: number;
  notes: string;
}

const RequiredLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <div className="flex items-center gap-1">
    <Label htmlFor={htmlFor}>{children}</Label>
    <span className="text-red-500">*</span>
  </div>
);

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<DBExpenseEntry[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<DBExpenseEntry[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expenseToDelete, setExpenseToDelete] = useState<DBExpenseEntry | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [dateRangeDisplay, setDateRangeDisplay] = useState<string>('');
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: formatDateForInput(new Date()),
    category: '',
    description: '',
    amount: 0,
    notes: ''
  });

  // Calculate expenses summary based on filtered expenses
  const expensesSummary = React.useMemo(() => {
    // Group expenses by category and calculate total for each
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
      const category = expense.category;
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Find category with highest total
    let highestCategory = {
      name: '',
      amount: 0,
      percentage: 0
    };

    // Calculate total expenses first
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate average monthly expenses
    const dates = filteredExpenses.map(expense => 
      typeof expense.date === 'string' 
        ? new Date(expense.date) 
        : new Date((expense.date as FirestoreTimestamp).seconds * 1000)
    );
    
    let monthlyAverage = 0;
    if (dates.length > 0) {
      const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
      const latest = new Date(Math.max(...dates.map(d => d.getTime())));
      const monthDiff = (latest.getFullYear() - earliest.getFullYear()) * 12 + 
                       (latest.getMonth() - earliest.getMonth()) + 1;
      monthlyAverage = totalExpenses / Math.max(1, monthDiff);
    }

    Object.entries(categoryTotals).forEach(([category, total]) => {
      if (total > highestCategory.amount) {
        highestCategory = {
          name: category,
          amount: total,
          percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
        };
      }
    });

    // Calculate Facebook ads spending
    const facebookAdsTotal = filteredExpenses
      .filter(expense => expense.category.toLowerCase().includes('facebook') || 
                        expense.category.toLowerCase().includes('fb') ||
                        expense.category.toLowerCase().includes('meta'))
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      totalExpenses,
      monthlyAverage,
      highestCategory,
      facebookAds: {
        amount: facebookAdsTotal,
        percentage: totalExpenses > 0 ? (facebookAdsTotal / totalExpenses) * 100 : 0
      }
    };
  }, [filteredExpenses]);

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, []);

  useEffect(() => {
    loadData();
  }, [showDeleted]);

  useEffect(() => {
    if (expenses.length > 0) {
      filterExpenses();
    }
  }, [expenses, dateRange, activeFilter]);

  useEffect(() => {
    updateDateRangeDisplay();
  }, [filteredExpenses, activeFilter, dateRange]);

  const filterExpenses = () => {
    let filtered = [...expenses];
    
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(expense => {
        const expenseDate = typeof expense.date === 'string' 
          ? new Date(expense.date) 
          : new Date((expense.date as FirestoreTimestamp).seconds * 1000);
        return expenseDate >= dateRange.from && expenseDate <= dateRange.to;
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
          setFilteredExpenses(filtered);
          return;
      }

      filtered = filtered.filter(expense => {
        const expenseDate = typeof expense.date === 'string' 
          ? new Date(expense.date) 
          : new Date((expense.date as FirestoreTimestamp).seconds * 1000);
        return expenseDate >= fromDate && expenseDate <= today;
      });
    }

    setFilteredExpenses(filtered);
  };

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const data = await getExpenses();
      // Sort expenses by date (most recent first)
      const sortedExpenses = data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      setExpenses(sortedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses', {
        dismissible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getExpenseCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories', {
        dismissible: true
      });
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const expensesData = await (showDeleted ? getDeletedExpenses() : getExpenses());
      // Sort expenses by date (most recent first)
      const sortedExpenses = expensesData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      setExpenses(sortedExpenses);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load expenses data', {
        dismissible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name: keyof ExpenseFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCategory = async (categoryName: string) => {
    if (!categoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await addExpenseCategory({ name: categoryName.trim() });
      await loadCategories();
      handleInputChange('category', categoryName.trim());
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category', {
        dismissible: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredFields = {
      date: 'Date',
      category: 'Category',
      description: 'Description',
      amount: 'Amount'
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

    if (Number(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0', {
        dismissible: true
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense(formData);
      await loadData();
      setFormData({
        date: formatDateForInput(new Date()),
        category: '',
        description: '',
        amount: 0,
        notes: ''
      });
      toast.success('Expense added successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense', {
        dismissible: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expense: DBExpenseEntry) => {
    if (!expense.id) return;
    
    try {
      await deleteExpense(expense.id);
      await loadData();
      toast.success('Expense entry deleted successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense entry', {
        dismissible: true
      });
    } finally {
      setExpenseToDelete(null);
    }
  };

  const handleRestore = async (expense: DBExpenseEntry) => {
    if (!expense.id) return;
    
    try {
      setIsRestoring(true);
      await restoreExpense(expense.id);
      await loadData();
      toast.success('Expense entry restored successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error restoring expense:', error);
      toast.error('Failed to restore expense entry', {
        dismissible: true
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const updateDateRangeDisplay = () => {
    if (filteredExpenses.length === 0) {
      setDateRangeDisplay('No data to display');
      return;
    }

    // Get the earliest and latest dates from filtered data
    const dates = filteredExpenses.map(expense => 
      typeof expense.date === 'string' 
        ? new Date(expense.date) 
        : new Date((expense.date as FirestoreTimestamp).seconds * 1000)
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
            <h1 className="text-2xl font-bold">Expenses</h1>
            <p className="text-muted-foreground">Track and manage your business expenses</p>
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

        {/* Expenses Summary Section */}
        <div className="grid grid-cols-4 gap-4 mt-4 mb-6">
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Total Expenses</h3>
            <p className="text-2xl font-bold mt-1">৳{expensesSummary.totalExpenses.toFixed(2)}</p>
          </div>
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Average</h3>
            <p className="text-2xl font-bold mt-1">৳{expensesSummary.monthlyAverage.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">Per month</p>
          </div>
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Highest Spending</h3>
            <p className="text-2xl font-bold mt-1">৳{expensesSummary.highestCategory.amount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {expensesSummary.highestCategory.name 
                ? `${expensesSummary.highestCategory.name} (${expensesSummary.highestCategory.percentage.toFixed(1)}% of total)`
                : 'No expenses'}
            </p>
          </div>
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground">Facebook Ads</h3>
            <p className="text-2xl font-bold mt-1">৳{expensesSummary.facebookAds.amount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {expensesSummary.facebookAds.amount > 0 
                ? `${expensesSummary.facebookAds.percentage.toFixed(1)}% of total`
                : 'No ad expenses'}
            </p>
          </div>
        </div>

        <div className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[180px]">Category</TableHead>
                <TableHead className="w-[200px]">Description</TableHead>
                <TableHead className="w-[120px]">Amount</TableHead>
                <TableHead className="w-[200px]">Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading expenses data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {showDeleted ? 'No deleted expenses entries' : 'No expenses entries yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className={cn(expense.isDeleted && "bg-muted/50")}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>৳{expense.amount.toFixed(2)}</TableCell>
                    <TableCell>{expense.notes}</TableCell>
                    <TableCell>
                      {showDeleted ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(expense)}
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
                          disabled={isRestoring}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpenseToDelete(expense)}
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
            <h2 className="text-lg font-semibold mb-4">New Expense Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <RequiredLabel htmlFor="date">Date</RequiredLabel>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <RequiredLabel htmlFor="category">Category</RequiredLabel>
                  <CategorySelect
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    categories={categories}
                    onAddCategory={handleAddCategory}
                    placeholder="Select category"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <RequiredLabel htmlFor="description">Description</RequiredLabel>
                  <Input
                    id="description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter description"
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <RequiredLabel htmlFor="amount">Amount</RequiredLabel>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                    placeholder="৳0.00"
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    type="text"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Notes"
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
        open={expenseToDelete !== null} 
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move this expense entry to the deleted records.
              You can restore it later from the deleted records view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => expenseToDelete && handleDelete(expenseToDelete)}
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

export default ExpensesPage; 