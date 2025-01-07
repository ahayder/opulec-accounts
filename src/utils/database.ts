import { collection, addDoc, getDocs, query, orderBy, Timestamp, updateDoc, doc, where, getDoc } from 'firebase/firestore';
import { db } from '@/main';
import dayjs from 'dayjs';

export interface SaleEntry {
  id?: string;
  date: string;
  product: string;
  order_number: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
  gender?: string;
  color?: string;
  dialColor?: string;
  isDeleted?: boolean;
}

export interface PurchaseEntry {
  id?: string;
  date: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
  supplier?: string;
  gender?: string;
  color?: string;
  dialColor?: string;
  isDeleted?: boolean;
}

export interface ExpenseEntry {
  id?: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  notes?: string;
  isDeleted?: boolean;
}

export interface ExpenseCategory {
  id?: string;
  name: string;
  createdAt?: Date;
}

export interface AssetEntry {
  id: string;
  name: string;
  purchaseDate: string;
  cost: number;
  usefulLife: number;
  lastUpdated?: Timestamp;
  note?: string;
}

export interface InvestmentEntry {
  id?: string;
  date: string;
  investor: string;
  amount: number;
  note: string;
}

export interface InventoryEntry {
  id?: string;
  product: string;
  quantities: {
    [key: string]: number; // key format: "gender|color|dialColor"
  };
  lastUpdated: Timestamp;
}

export interface Category {
  id?: string;
  name: string;
  createdAt?: Date;
}

// Helper function to format date
const formatDate = (date: Date): string => {
  return dayjs(date).format('DD-MMM-YYYY');
};

// Sales functions
export const addSale = async (sale: Omit<SaleEntry, 'id'>) => {
  try {
    // Normalize the product name
    const normalizedProduct = sale.product.trim();
    
    if (!normalizedProduct) {
      throw new Error('Product name is required');
    }

    // Add the sale document
    const docRef = await addDoc(collection(db, 'sales'), {
      ...sale,
      product: normalizedProduct,
      date: sale.date,
      createdAt: Timestamp.now(),
      isDeleted: false
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
};

export const getSales = async (): Promise<SaleEntry[]> => {
  try {
    const q = query(collection(db, 'sales'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          product: data.product,
          order_number: data.order_number,
          quantity: data.quantity,
          price: data.price,
          total: data.total,
          notes: data.notes,
          gender: data.gender,
          color: data.color,
          dialColor: data.dialColor,
          isDeleted: data.isDeleted
        } as SaleEntry;
      })
      .filter(sale => !sale.isDeleted); // Filter out deleted sales in memory
  } catch (error) {
    console.error('Error getting sales:', error);
    throw error;
  }
};

export const getDeletedSales = async (): Promise<SaleEntry[]> => {
  try {
    console.log('Fetching deleted sales...');
    const q = query(
      collection(db, 'sales'), 
      where('isDeleted', '==', true)
    );
    const querySnapshot = await getDocs(q);
    console.log('Found deleted sales:', querySnapshot.docs.length);
    console.log('Deleted sales data:', querySnapshot.docs.map(doc => doc.data()));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const date = data.date instanceof Timestamp ? formatDate(data.date.toDate()) : data.date;
      return {
        id: doc.id,
        date,
        product: data.product,
        order_number: data.order_number,
        quantity: data.quantity,
        price: data.price,
        total: data.total,
        notes: data.notes,
        gender: data.gender,
        color: data.color,
        dialColor: data.dialColor,
        isDeleted: data.isDeleted
      } as SaleEntry;
    });
  } catch (error) {
    console.error('Error getting deleted sales:', error);
    throw error;
  }
};

// Purchases functions
export const addPurchase = async (purchase: Omit<PurchaseEntry, 'id'>) => {
  try {
    // Normalize the product name
    const normalizedProduct = purchase.product.trim();
    
    if (!normalizedProduct) {
      throw new Error('Product name is required');
    }

    // Add the purchase document
    const docRef = await addDoc(collection(db, 'purchases'), {
      ...purchase,
      product: normalizedProduct,
      date: purchase.date,
      createdAt: Timestamp.now(),
      isDeleted: false
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding purchase:', error);
    throw error;
  }
};

export const getPurchases = async (): Promise<PurchaseEntry[]> => {
  try {
    const q = query(collection(db, 'purchases'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          product: data.product,
          quantity: data.quantity,
          price: data.price,
          total: data.total,
          notes: data.notes,
          supplier: data.supplier,
          gender: data.gender,
          color: data.color,
          dialColor: data.dialColor,
          isDeleted: data.isDeleted
        } as PurchaseEntry;
      })
      .filter(purchase => !purchase.isDeleted); // Filter out deleted purchases in memory
  } catch (error) {
    console.error('Error getting purchases:', error);
    throw error;
  }
};

// Expenses functions
export const addExpense = async (expense: Omit<ExpenseEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expense,
      date: expense.date, // Store as string to be consistent
      createdAt: Timestamp.now(),
      isDeleted: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const getExpenses = async (): Promise<ExpenseEntry[]> => {
  try {
    console.log('Fetching expenses...');
    const q = query(
      collection(db, 'expenses'),
      where('isDeleted', '==', false)
    );
    const querySnapshot = await getDocs(q);
    console.log('Found expenses:', querySnapshot.docs.length);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date,
        category: data.category,
        description: data.description,
        amount: data.amount,
        notes: data.notes,
        isDeleted: data.isDeleted
      } as ExpenseEntry;
    });
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    const expenseDoc = await getDoc(expenseRef);
    
    if (!expenseDoc.exists()) {
      throw new Error('Expense not found');
    }
    
    // Soft delete the expense
    await updateDoc(expenseRef, {
      isDeleted: true,
      deletedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Expense Categories functions
export const addExpenseCategory = async (category: Omit<ExpenseCategory, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'expenseCategories'), {
      ...category,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense category:', error);
    throw error;
  }
};

export const getExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  try {
    const q = query(collection(db, 'expenseCategories'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting expense categories:', error);
    throw error;
  }
};

// Assets functions
export const addAsset = async (asset: Omit<AssetEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'assets'), {
      ...asset,
      purchaseDate: Timestamp.fromDate(dayjs(asset.purchaseDate, 'DD-MMM-YYYY').toDate()),
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding asset:', error);
    throw error;
  }
};

export const getAssets = async (): Promise<AssetEntry[]> => {
  try {
    const q = query(collection(db, 'assets'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const purchaseDate = data.purchaseDate instanceof Timestamp ? formatDate(data.purchaseDate.toDate()) : data.purchaseDate;
      return {
        id: doc.id,
        name: data.name,
        purchaseDate,
        cost: data.cost,
        usefulLife: data.usefulLife,
        lastUpdated: data.lastUpdated
      } as AssetEntry;
    });
  } catch (error) {
    console.error('Error getting assets:', error);
    throw error;
  }
};

export const updateAssetDepreciation = async (assetId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'assets', assetId);
    await updateDoc(docRef, {
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating asset depreciation:', error);
    throw error;
  }
};

// Investments functions
export const addInvestment = async (investment: Omit<InvestmentEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'investments'), {
      ...investment,
      date: Timestamp.fromDate(dayjs(investment.date, 'DD-MMM-YYYY').toDate()),
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
};

export const getInvestments = async (): Promise<InvestmentEntry[]> => {
  try {
    const q = query(collection(db, 'investments'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const date = data.date instanceof Timestamp ? formatDate(data.date.toDate()) : data.date;
      return {
        id: doc.id,
        date,
        investor: data.investor,
        amount: data.amount,
        note: data.note
      } as InvestmentEntry;
    });
  } catch (error) {
    console.error('Error getting investments:', error);
    throw error;
  }
};

// Product Categories functions
export const addProductCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'productCategories'), {
      ...category,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product category:', error);
    throw error;
  }
};

export const getProductCategories = async (): Promise<Category[]> => {
  try {
    const q = query(collection(db, 'productCategories'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting product categories:', error);
    throw error;
  }
};

// Supplier Categories functions
export const addSupplierCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'supplierCategories'), {
      ...category,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding supplier category:', error);
    throw error;
  }
};

export const getSupplierCategories = async (): Promise<Category[]> => {
  try {
    const q = query(collection(db, 'supplierCategories'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting supplier categories:', error);
    throw error;
  }
};

// Color Categories functions
export const addColorCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'colorCategories'), {
      ...category,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding color category:', error);
    throw error;
  }
};

export const getColorCategories = async (): Promise<Category[]> => {
  try {
    const q = query(collection(db, 'colorCategories'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting color categories:', error);
    throw error;
  }
};

// Dial Color Categories functions
export const addDialColorCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'dialColorCategories'), {
      ...category,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding dial color category:', error);
    throw error;
  }
};

export const getDialColorCategories = async (): Promise<Category[]> => {
  try {
    const q = query(collection(db, 'dialColorCategories'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting dial color categories:', error);
    throw error;
  }
};

export const deleteSale = async (saleId: string): Promise<void> => {
  try {
    const saleRef = doc(db, 'sales', saleId);
    const saleDoc = await getDoc(saleRef);
    
    if (!saleDoc.exists()) {
      throw new Error('Sale not found');
    }
    
    // Soft delete the sale document
    await updateDoc(saleRef, {
      isDeleted: true,
      deletedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting sale:', error);
    throw error;
  }
};

export const deletePurchase = async (purchaseId: string): Promise<void> => {
  try {
    const purchaseRef = doc(db, 'purchases', purchaseId);
    const purchaseDoc = await getDoc(purchaseRef);
    
    if (!purchaseDoc.exists()) {
      throw new Error('Purchase not found');
    }
    
    // Soft delete the purchase document
    await updateDoc(purchaseRef, {
      isDeleted: true,
      deletedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    throw error;
  }
};

// Functions to get deleted records
export const getDeletedPurchases = async (): Promise<PurchaseEntry[]> => {
  try {
    // Simplified query without composite index
    const q = query(
      collection(db, 'purchases'),
      where('isDeleted', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const date = data.date instanceof Timestamp ? formatDate(data.date.toDate()) : data.date;
      return {
        id: doc.id,
        date,
        product: data.product,
        quantity: data.quantity,
        price: data.price,
        total: data.total,
        notes: data.notes,
        supplier: data.supplier,
        gender: data.gender,
        color: data.color,
        dialColor: data.dialColor,
        isDeleted: data.isDeleted
      } as PurchaseEntry;
    });
  } catch (error) {
    console.error('Error getting deleted purchases:', error);
    throw error;
  }
};

export const getDeletedExpenses = async (): Promise<ExpenseEntry[]> => {
  try {
    console.log('Fetching deleted expenses...');
    const q = query(
      collection(db, 'expenses'),
      where('isDeleted', '==', true)
    );
    const querySnapshot = await getDocs(q);
    console.log('Found deleted expenses:', querySnapshot.docs.length);
    console.log('Deleted expenses data:', querySnapshot.docs.map(doc => doc.data()));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date,
        category: data.category,
        description: data.description,
        amount: data.amount,
        notes: data.notes,
        isDeleted: data.isDeleted
      } as ExpenseEntry;
    });
  } catch (error) {
    console.error('Error getting deleted expenses:', error);
    throw error;
  }
};

// Functions to restore deleted records
export const restoreSale = async (saleId: string): Promise<void> => {
  try {
    const saleRef = doc(db, 'sales', saleId);
    const saleDoc = await getDoc(saleRef);
    
    if (!saleDoc.exists()) {
      throw new Error('Sale not found');
    }
    
    // Restore the sale document
    await updateDoc(saleRef, {
      isDeleted: false,
      deletedAt: null,
      restoredAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error restoring sale:', error);
    throw error;
  }
};

export const restorePurchase = async (purchaseId: string): Promise<void> => {
  try {
    const purchaseRef = doc(db, 'purchases', purchaseId);
    const purchaseDoc = await getDoc(purchaseRef);
    
    if (!purchaseDoc.exists()) {
      throw new Error('Purchase not found');
    }
    
    // Restore the purchase document
    await updateDoc(purchaseRef, {
      isDeleted: false,
      deletedAt: null,
      restoredAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error restoring purchase:', error);
    throw error;
  }
};

export const restoreExpense = async (expenseId: string): Promise<void> => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    const expenseDoc = await getDoc(expenseRef);
    
    if (!expenseDoc.exists()) {
      throw new Error('Expense not found');
    }
    
    // Restore the expense
    await updateDoc(expenseRef, {
      isDeleted: false,
      deletedAt: null,
      restoredAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error restoring expense:', error);
    throw error;
  }
}; 