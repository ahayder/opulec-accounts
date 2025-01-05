import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
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
}

export interface PurchaseEntry {
  id?: string;
  date: string;
  product: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
}

export interface ExpenseEntry {
  id?: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  notes?: string;
}

export interface ExpenseCategory {
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
    const docRef = await addDoc(collection(db, 'sales'), {
      ...sale,
      date: Timestamp.fromDate(dayjs(sale.date, 'DD-MMM-YYYY').toDate()),
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
};

export const getSales = async (): Promise<SaleEntry[]> => {
  try {
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Timestamp to formatted date string if it's a Timestamp
      const date = data.date instanceof Timestamp ? formatDate(data.date.toDate()) : data.date;
      return {
        id: doc.id,
        date,
        product: data.product,
        order_number: data.order_number,
        quantity: data.quantity,
        price: data.price,
        total: data.total,
        notes: data.notes
      } as SaleEntry;
    });
  } catch (error) {
    console.error('Error getting sales:', error);
    throw error;
  }
};

// Purchases functions
export const addPurchase = async (purchase: Omit<PurchaseEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'purchases'), {
      ...purchase,
      date: Timestamp.fromDate(dayjs(purchase.date, 'DD-MMM-YYYY').toDate()),
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding purchase:', error);
    throw error;
  }
};

export const getPurchases = async (): Promise<PurchaseEntry[]> => {
  try {
    const q = query(collection(db, 'purchases'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Timestamp to formatted date string if it's a Timestamp
      const date = data.date instanceof Timestamp ? formatDate(data.date.toDate()) : data.date;
      return {
        id: doc.id,
        date,
        product: data.product,
        quantity: data.quantity,
        price: data.price,
        total: data.total,
        notes: data.notes
      } as PurchaseEntry;
    });
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
      date: Timestamp.fromDate(dayjs(expense.date, 'DD-MMM-YYYY').toDate()),
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const getExpenses = async (): Promise<ExpenseEntry[]> => {
  try {
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Timestamp to formatted date string if it's a Timestamp
      const date = data.date instanceof Timestamp ? formatDate(data.date.toDate()) : data.date;
      return {
        id: doc.id,
        date,
        category: data.category,
        description: data.description,
        amount: data.amount,
        notes: data.notes
      } as ExpenseEntry;
    });
  } catch (error) {
    console.error('Error getting expenses:', error);
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