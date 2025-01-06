import React, { useState, useEffect } from 'react';
import { 
  getExpenseCategories, 
  getProductCategories, 
  getSupplierCategories, 
  getColorCategories, 
  getDialColorCategories,
  type ExpenseCategory,
  type Category
} from '@/utils/database';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/main';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

interface CategoryToDelete {
  id: string;
  name: string;
  type: 'expense' | 'product' | 'supplier' | 'color' | 'dialColor';
}

const SettingsPage = () => {
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [supplierCategories, setSupplierCategories] = useState<Category[]>([]);
  const [colorCategories, setColorCategories] = useState<Category[]>([]);
  const [dialColorCategories, setDialColorCategories] = useState<Category[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryToDelete | null>(null);

  useEffect(() => {
    loadAllCategories();
  }, []);

  const loadAllCategories = async () => {
    try {
      const [expenses, products, suppliers, colors, dialColors] = await Promise.all([
        getExpenseCategories(),
        getProductCategories(),
        getSupplierCategories(),
        getColorCategories(),
        getDialColorCategories()
      ]);

      setExpenseCategories(expenses);
      setProductCategories(products);
      setSupplierCategories(suppliers);
      setColorCategories(colors);
      setDialColorCategories(dialColors);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const getCategoryCollectionName = (type: CategoryToDelete['type']) => {
    switch (type) {
      case 'expense': return 'expenseCategories';
      case 'product': return 'productCategories';
      case 'supplier': return 'supplierCategories';
      case 'color': return 'colorCategories';
      case 'dialColor': return 'dialColorCategories';
    }
  };

  const handleDeleteCategory = async (category: CategoryToDelete) => {
    try {
      const collectionName = getCategoryCollectionName(category.type);
      await deleteDoc(doc(db, collectionName, category.id));
      await loadAllCategories();
      setCategoryToDelete(null);
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const CategoryList = ({ 
    title, 
    categories, 
    type 
  }: { 
    title: string; 
    categories: (Category | ExpenseCategory)[]; 
    type: CategoryToDelete['type'];
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50" onClick={() => setIsOpen(!isOpen)}>
              <div className="flex items-center justify-between">
                <CardTitle>{title}</CardTitle>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "transform rotate-180"
                )} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
                          onClick={() => setCategoryToDelete({ 
                            id: category.id!, 
                            name: category.name,
                            type 
                          })}
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
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
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
        <CategoryList 
          title="Manage Expense Categories" 
          categories={expenseCategories} 
          type="expense" 
        />
        <CategoryList 
          title="Manage Product Categories" 
          categories={productCategories} 
          type="product" 
        />
        <CategoryList 
          title="Manage Supplier Categories" 
          categories={supplierCategories} 
          type="supplier" 
        />
        <CategoryList 
          title="Manage Color Categories" 
          categories={colorCategories} 
          type="color" 
        />
        <CategoryList 
          title="Manage Dial Color Categories" 
          categories={dialColorCategories} 
          type="dialColor" 
        />
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