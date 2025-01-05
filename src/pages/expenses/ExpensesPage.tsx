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

interface ExpenseEntry {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  notes: string;
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

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [newExpense, setNewExpense] = useState<Partial<ExpenseEntry>>({
    date: formatDate(new Date())
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewExpense(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'date') {
        updated.date = formatDate(new Date(value));
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.category && newExpense.description && newExpense.amount) {
      const expenseEntry: ExpenseEntry = {
        id: Date.now().toString(),
        date: newExpense.date || formatDate(new Date()),
        category: newExpense.category,
        description: newExpense.description,
        amount: Number(newExpense.amount),
        notes: newExpense.notes || ''
      };
      setExpenses(prev => [...prev, expenseEntry]);
      setNewExpense({ date: formatDate(new Date()) });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground mt-2">Record and track your business expenses</p>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">New Expense Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-4 items-end">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={dateToInputValue(new Date(newExpense.date || new Date()))}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={newExpense.category || ''}
                onChange={handleInputChange}
                required
                placeholder="e.g., Utilities, Rent"
              />
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={newExpense.description || ''}
                onChange={handleInputChange}
                required
                placeholder="Brief description of expense"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={newExpense.amount || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                value={newExpense.notes || ''}
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
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[250px]">Description</TableHead>
              <TableHead className="text-right w-[120px]">Amount</TableHead>
              <TableHead className="w-[250px]">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.date}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell className="text-right">৳{expense.amount.toFixed(2)}</TableCell>
                <TableCell>{expense.notes}</TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No expense entries yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ExpensesPage; 