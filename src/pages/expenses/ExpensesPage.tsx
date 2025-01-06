import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addExpense, getExpenses, addExpenseCategory, getExpenseCategories, type ExpenseEntry as DBExpenseEntry, type ExpenseCategory, deleteExpense, getDeletedExpenses, restoreExpense } from '@/utils/database';
import { Loader2, ChevronRight, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
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

interface ExpenseFormData {
  date: string;
  category: string;
  description: string;
  amount: number;
  notes: string;
}

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<DBExpenseEntry[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expenseToDelete, setExpenseToDelete] = useState<DBExpenseEntry | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: 0,
    notes: ''
  });

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, []);

  useEffect(() => {
    loadData();
  }, [showDeleted]);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const data = await getExpenses();
      setExpenses(data);
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
      setExpenses(expensesData);
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
    setIsSubmitting(true);
    try {
      await addExpense(formData);
      await loadExpenses();
      setFormData({
        date: new Date().toISOString().split('T')[0],
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
      await loadExpenses();
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

        <div className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[150px]">Category</TableHead>
                <TableHead className="w-[200px]">Description</TableHead>
                <TableHead className="text-right w-[120px]">Amount</TableHead>
                <TableHead>Notes</TableHead>
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
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {showDeleted ? 'No deleted expenses entries' : 'No expenses entries yet'}
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id} className={cn(expense.isDeleted && "bg-muted/50")}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right">৳{expense.amount.toFixed(2)}</TableCell>
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
                  <Label htmlFor="category">Category</Label>
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
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter description"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                    placeholder="৳0.00"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
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
              This will permanently delete this expense entry.
              This action cannot be undone.
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