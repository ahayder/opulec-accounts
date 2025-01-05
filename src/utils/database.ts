import { collection, addDoc, getDocs, Timestamp, DocumentData } from 'firebase/firestore';
import { db } from '../main';

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

function convertFirestoreDate(data: DocumentData) {
  try {
    if (data.date && data.date instanceof Timestamp) {
      return {
        ...data,
        date: data.date.toDate().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      };
    }
    return data;
  } catch (error) {
    console.error('Error converting date:', error);
    return data;
  }
}

// Sales functions
export async function getSales() {
  try {
    const salesRef = collection(db, 'sales');
    const querySnapshot = await getDocs(salesRef);
    
    return querySnapshot.docs.map(doc => {
      const data = convertFirestoreDate(doc.data());
      return {
        id: doc.id,
        ...data
      };
    }) as SaleEntry[];
  } catch (error) {
    console.error('Error getting sales:', error);
    return [];
  }
}

export async function addSale(sale: Omit<SaleEntry, 'id'>) {
  try {
    const salesRef = collection(db, 'sales');
    const saleData = {
      ...sale,
      date: Timestamp.fromDate(new Date(sale.date)),
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(salesRef, saleData);
    return {
      id: docRef.id,
      ...sale
    };
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
}

// Purchases functions
export async function getPurchases() {
  try {
    const purchasesRef = collection(db, 'purchases');
    const querySnapshot = await getDocs(purchasesRef);
    
    return querySnapshot.docs.map(doc => {
      const data = convertFirestoreDate(doc.data());
      return {
        id: doc.id,
        ...data
      };
    }) as PurchaseEntry[];
  } catch (error) {
    console.error('Error getting purchases:', error);
    return [];
  }
}

export async function addPurchase(purchase: Omit<PurchaseEntry, 'id'>) {
  try {
    const purchasesRef = collection(db, 'purchases');
    const purchaseData = {
      ...purchase,
      date: Timestamp.fromDate(new Date(purchase.date)),
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(purchasesRef, purchaseData);
    return {
      id: docRef.id,
      ...purchase
    };
  } catch (error) {
    console.error('Error adding purchase:', error);
    throw error;
  }
}

// Expenses functions
export async function getExpenses() {
  try {
    const expensesRef = collection(db, 'expenses');
    const querySnapshot = await getDocs(expensesRef);
    
    return querySnapshot.docs.map(doc => {
      const data = convertFirestoreDate(doc.data());
      return {
        id: doc.id,
        ...data
      };
    }) as ExpenseEntry[];
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
}

export async function addExpense(expense: Omit<ExpenseEntry, 'id'>) {
  try {
    const expensesRef = collection(db, 'expenses');
    const expenseData = {
      ...expense,
      date: Timestamp.fromDate(new Date(expense.date)),
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(expensesRef, expenseData);
    return {
      id: docRef.id,
      ...expense
    };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
} 