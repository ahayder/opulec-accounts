import { collection, addDoc, getDocs, query, orderBy, Timestamp, updateDoc, doc, writeBatch, where, getDoc, deleteDoc } from 'firebase/firestore';
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

export interface InventoryEntry {
  id?: string;
  product: string;
  quantity: number;
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

    // Check inventory before proceeding
    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, where('product', '==', normalizedProduct));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`Product "${normalizedProduct}" not found in inventory`);
    }

    const inventoryDoc = querySnapshot.docs[0];
    const currentQuantity = inventoryDoc.data().quantity;

    if (currentQuantity < sale.quantity) {
      throw new Error(`Insufficient inventory for "${normalizedProduct}". Available: ${currentQuantity}, Requested: ${sale.quantity}`);
    }

    // Start a batch write
    const batch = writeBatch(db);

    // Add the sale document
    const saleRef = doc(collection(db, 'sales'));
    batch.set(saleRef, {
      ...sale,
      product: normalizedProduct,
      date: Timestamp.fromDate(dayjs(sale.date, 'DD-MMM-YYYY').toDate()),
      createdAt: Timestamp.now()
    });

    // Update inventory
    await updateInventory(normalizedProduct, -sale.quantity);

    // Commit the batch
    await batch.commit();
    return saleRef.id;
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
        dialColor: data.dialColor
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
    // Normalize the product name
    const normalizedProduct = purchase.product.trim();
    
    if (!normalizedProduct) {
      throw new Error('Product name is required');
    }

    // Start a batch write
    const batch = writeBatch(db);

    // Add the purchase document
    const purchaseRef = doc(collection(db, 'purchases'));
    batch.set(purchaseRef, {
      ...purchase,
      product: normalizedProduct,
      date: Timestamp.fromDate(dayjs(purchase.date, 'DD-MMM-YYYY').toDate()),
      createdAt: Timestamp.now()
    });

    // Update inventory
    await updateInventory(normalizedProduct, purchase.quantity);

    // Commit the batch
    await batch.commit();
    return purchaseRef.id;
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
        dialColor: data.dialColor
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

export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    const expenseDoc = await getDoc(expenseRef);
    
    if (!expenseDoc.exists()) {
      throw new Error('Expense not found');
    }
    
    await deleteDoc(expenseRef);
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

// Inventory functions
export const updateInventory = async (product: string, quantityChange: number): Promise<void> => {
  try {
    // Normalize the product name
    const normalizedProduct = product.trim();
    
    if (!normalizedProduct) {
      throw new Error('Product name is required');
    }

    const inventoryRef = collection(db, 'inventory');
    const q = query(inventoryRef, where('product', '==', normalizedProduct));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // If product doesn't exist in inventory and we're adding stock
      if (quantityChange > 0) {
        await addDoc(inventoryRef, {
          product: normalizedProduct,
          quantity: quantityChange,
          lastUpdated: Timestamp.now()
        });
      } else {
        throw new Error(`Product "${normalizedProduct}" not found in inventory`);
      }
    } else {
      // Update existing inventory
      const inventoryDoc = querySnapshot.docs[0];
      const currentQuantity = inventoryDoc.data().quantity;
      const newQuantity = currentQuantity + quantityChange;

      if (newQuantity < 0) {
        throw new Error(`Insufficient inventory for "${normalizedProduct}". Current stock: ${currentQuantity}`);
      }

      await updateDoc(doc(db, 'inventory', inventoryDoc.id), {
        quantity: newQuantity,
        lastUpdated: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

export const getInventory = async (): Promise<InventoryEntry[]> => {
  try {
    const q = query(collection(db, 'inventory'), orderBy('product', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      product: doc.data().product,
      quantity: doc.data().quantity,
      lastUpdated: doc.data().lastUpdated
    }));
  } catch (error) {
    console.error('Error getting inventory:', error);
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
    // Get the sale data first to update inventory
    const saleRef = doc(db, 'sales', saleId);
    const saleDoc = await getDoc(saleRef);
    
    if (!saleDoc.exists()) {
      throw new Error('Sale not found');
    }

    const saleData = saleDoc.data();
    
    // Start a batch write
    const batch = writeBatch(db);

    // Delete the sale document
    batch.delete(saleRef);

    // Update inventory (add back the quantity)
    await updateInventory(saleData.product, saleData.quantity);

    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error('Error deleting sale:', error);
    throw error;
  }
};

export const deletePurchase = async (purchaseId: string): Promise<void> => {
  try {
    // Get the purchase data first to update inventory
    const purchaseRef = doc(db, 'purchases', purchaseId);
    const purchaseDoc = await getDoc(purchaseRef);
    
    if (!purchaseDoc.exists()) {
      throw new Error('Purchase not found');
    }

    const purchaseData = purchaseDoc.data();
    
    // Start a batch write
    const batch = writeBatch(db);

    // Delete the purchase document
    batch.delete(purchaseRef);

    // Update inventory (subtract the quantity since we're removing the purchase)
    await updateInventory(purchaseData.product, -purchaseData.quantity);

    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error('Error deleting purchase:', error);
    throw error;
  }
}; 