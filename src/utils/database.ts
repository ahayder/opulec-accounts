import { collection, addDoc, getDocs, query, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore';
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

export interface AssetEntry {
  id: string;
  name: string;
  purchaseDate: string;
  cost: number;
  usefulLife: number;
  lastUpdated?: Timestamp;
}

export interface InvestmentEntry {
  id?: string;
  date: string;
  investor: string;
  amount: number;
  note: string;
}

// Helper function to format date
const formatDate = (date: Date): string => {
  return dayjs(date).format('DD-MMM-YYYY');
};

// Sales functions
export const addSale = async (businessId: string, sale: Omit<SaleEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, `businesses/${businessId}/sales`), {
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

export const getSales = async (businessId: string): Promise<SaleEntry[]> => {
  try {
    const q = query(collection(db, `businesses/${businessId}/sales`), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
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
        notes: data.notes
      } as SaleEntry;
    });
  } catch (error) {
    console.error('Error getting sales:', error);
    throw error;
  }
};

// Purchases functions
export const addPurchase = async (businessId: string, purchase: Omit<PurchaseEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, `businesses/${businessId}/purchases`), {
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

export const getPurchases = async (businessId: string): Promise<PurchaseEntry[]> => {
  try {
    const q = query(collection(db, `businesses/${businessId}/purchases`), orderBy('createdAt', 'desc'));
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
        notes: data.notes
      } as PurchaseEntry;
    });
  } catch (error) {
    console.error('Error getting purchases:', error);
    throw error;
  }
};

// Expenses functions
export const addExpense = async (businessId: string, expense: Omit<ExpenseEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, `businesses/${businessId}/expenses`), {
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

export const getExpenses = async (businessId: string): Promise<ExpenseEntry[]> => {
  try {
    const q = query(collection(db, `businesses/${businessId}/expenses`), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
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

// Assets functions
export const addAsset = async (businessId: string, asset: Omit<AssetEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, `businesses/${businessId}/assets`), {
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

export const getAssets = async (businessId: string): Promise<AssetEntry[]> => {
  try {
    const q = query(collection(db, `businesses/${businessId}/assets`), orderBy('createdAt', 'desc'));
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

export const updateAssetDepreciation = async (businessId: string, assetId: string): Promise<void> => {
  try {
    const docRef = doc(db, `businesses/${businessId}/assets`, assetId);
    await updateDoc(docRef, {
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating asset depreciation:', error);
    throw error;
  }
};

// Investments functions
export const addInvestment = async (businessId: string, investment: Omit<InvestmentEntry, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, `businesses/${businessId}/investments`), {
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

export const getInvestments = async (businessId: string): Promise<InvestmentEntry[]> => {
  try {
    const q = query(collection(db, `businesses/${businessId}/investments`), orderBy('createdAt', 'desc'));
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