import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addExpense, getExpenses, addExpenseCategory, getExpenseCategories, type ExpenseEntry as DBExpenseEntry, type ExpenseCategory } from '@/utils/database';
import { Loader2, Plus } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';

interface ExpenseFormData {
  date: string;
  category: string;
  description: string;
  amount: number;
  notes: string;
}

const ExpensesPage = () => {
  const { currentBusiness } = useBusiness();
  const [expenses, setExpenses] = useState<DBExpenseEntry[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: 0,
    notes: ''
  });

  useEffect(() => {
    if (currentBusiness) {
      loadExpenses();
    }
    loadCategories();
  }, [currentBusiness]);

  const loadExpenses = async () => {
    if (!currentBusiness) return;
    
    try {
      const data = await getExpenses(currentBusiness.id);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getExpenseCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
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
      setNewCategory('');
      handleInputChange('category', categoryName.trim());
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) {
      toast.error('Please select a business first');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addExpense(currentBusiness.id, formData);
      await loadExpenses();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        amount: 0,
        notes: ''
      });
      toast.success('Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && newCategory) {
      e.preventDefault();
      handleAddCategory(newCategory);
      setOpen(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="h-16 border-b flex items-center">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your business expenses</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">New Expense Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-2">
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
            <div className="md:col-span-3">
              <Label htmlFor="category">Category</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={isSubmitting}
                  >
                    {formData.category
                      ? categories.find((category) => category.name === formData.category)?.name
                      : "Select category..."}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search or add category..." 
                      value={newCategory}
                      onValueChange={setNewCategory}
                      onKeyDown={handleKeyDown}
                    />
                    <CommandList>
                      <CommandEmpty className="py-6 text-center text-sm">
                        {newCategory && (
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <Plus className="h-4 w-4" />
                            <span>Press Enter to add "{newCategory}"</span>
                          </div>
                        )}
                        {!newCategory && "No categories found"}
                      </CommandEmpty>
                      <CommandGroup>
                        {categories
                          .filter(category => 
                            category.name.toLowerCase().includes(newCategory.toLowerCase())
                          )
                          .map((category) => (
                            <CommandItem
                              key={category.id}
                              onSelect={() => {
                                handleInputChange('category', category.name);
                                setOpen(false);
                              }}
                              className="flex items-center justify-between"
                            >
                              <span>{category.name}</span>
                              {formData.category === category.name && (
                                <CheckIcon className="ml-2 h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="md:col-span-3">
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
            <div className="md:col-span-2">
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
            <div className="md:col-span-2">
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
          <div className="mt-4 flex justify-end">
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense, index) => (
              <tr key={expense.id || index}>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{expense.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">{expense.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">৳{expense.amount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{expense.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesPage; 