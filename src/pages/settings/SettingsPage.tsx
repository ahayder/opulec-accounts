import React, { useState, useEffect } from 'react';
import { getExpenseCategories, type ExpenseCategory } from '@/utils/database';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/main';

const SettingsPage = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getExpenseCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleDeleteCategory = async (category: ExpenseCategory) => {
    try {
      if (!category.id) return;
      await deleteDoc(doc(db, 'expenseCategories', category.id));
      await loadCategories();
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="h-16 border-b flex items-center">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your application preferences</p>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories found</p>
              ) : (
                <div className="grid gap-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-2 rounded-md border"
                    >
                      <span>{category.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCategoryToDelete(category)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog 
        open={categoryToDelete !== null} 
        onOpenChange={() => setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{categoryToDelete?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
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

export default SettingsPage; 