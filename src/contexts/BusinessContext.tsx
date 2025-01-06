import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/main';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface Business {
  id: string;
  name: string;
  currency: string;
  ownerId: string;
  createdAt: Date;
  isDefault?: boolean;
}

interface BusinessContextType {
  currentBusiness: Business | null;
  businesses: Business[];
  setCurrentBusiness: (business: Business) => void;
  addBusiness: (name: string, currency: string, isDefault?: boolean) => Promise<void>;
  renameBusiness: (businessId: string, newName: string) => Promise<void>;
  setDefaultBusiness: (businessId: string) => Promise<void>;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const createDefaultBusiness = async (userId: string) => {
    try {
      // Check if a business with this name already exists
      const q = query(
        collection(db, 'businesses'), 
        where('ownerId', '==', userId),
        where('name', '==', 'My Business')
      );
      const existingBusiness = await getDocs(q);
      
      if (!existingBusiness.empty) {
        const business = {
          id: existingBusiness.docs[0].id,
          ...existingBusiness.docs[0].data(),
          createdAt: existingBusiness.docs[0].data().createdAt?.toDate() || new Date(),
        } as Business;
        setBusinesses([business]);
        setCurrentBusiness(business);
        return;
      }

      const docRef = await addDoc(collection(db, 'businesses'), {
        name: 'My Business',
        currency: 'BDT',
        ownerId: userId,
        createdAt: new Date(),
        isDefault: true
      });

      const newBusiness = {
        id: docRef.id,
        name: 'My Business',
        currency: 'BDT',
        ownerId: userId,
        createdAt: new Date(),
        isDefault: true
      };

      setBusinesses([newBusiness]);
      setCurrentBusiness(newBusiness);
      toast.success('Default business created');
    } catch (error) {
      console.error('Error creating default business:', error);
      toast.error('Failed to create default business');
    }
  };

  const renameBusiness = async (businessId: string, newName: string) => {
    if (!user) return;

    try {
      const businessRef = doc(db, 'businesses', businessId);
      await updateDoc(businessRef, { name: newName });

      // Update local state
      setBusinesses(prev => prev.map(b => 
        b.id === businessId ? { ...b, name: newName } : b
      ));

      // Update current business if it's the one being renamed
      if (currentBusiness?.id === businessId) {
        setCurrentBusiness(prev => prev ? { ...prev, name: newName } : null);
      }

      toast.success('Business renamed successfully');
    } catch (error) {
      console.error('Error renaming business:', error);
      toast.error('Failed to rename business');
      throw error;
    }
  };

  const setDefaultBusiness = async (businessId: string) => {
    if (!user) return;

    try {
      // First, remove default from all businesses
      const businessesRef = collection(db, 'businesses');
      const q = query(businessesRef, where('ownerId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      // Update all businesses to not be default
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isDefault: doc.id === businessId })
      );
      await Promise.all(updatePromises);

      // Update local state
      setBusinesses(prev => prev.map(b => ({
        ...b,
        isDefault: b.id === businessId
      })));

      toast.success('Default business updated');
    } catch (error) {
      console.error('Error setting default business:', error);
      toast.error('Failed to update default business');
      throw error;
    }
  };

  useEffect(() => {
    if (!user) {
      setBusinesses([]);
      setCurrentBusiness(null);
      setIsLoading(false);
      return;
    }

    const fetchBusinesses = async () => {
      try {
        const q = query(collection(db, 'businesses'), where('ownerId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const businessList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Business[];

        // Remove any duplicates by ID
        const uniqueBusinesses = businessList.filter((business, index, self) =>
          index === self.findIndex((b) => b.id === business.id)
        );

        setBusinesses(uniqueBusinesses);
        
        // If no businesses exist, create a default one
        if (uniqueBusinesses.length === 0) {
          await createDefaultBusiness(user.uid);
        } else {
          // Set default or first business as current
          const defaultBusiness = uniqueBusinesses.find(b => b.isDefault) || uniqueBusinesses[0];
          setCurrentBusiness(defaultBusiness);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        setIsLoading(false);
        toast.error('Failed to fetch businesses');
      }
    };

    fetchBusinesses();
  }, [user]);

  const addBusiness = async (name: string, currency: string, isDefault: boolean = false) => {
    if (!user) return;

    try {
      const docRef = await addDoc(collection(db, 'businesses'), {
        name,
        currency,
        ownerId: user.uid,
        createdAt: new Date(),
        isDefault
      });

      const newBusiness = {
        id: docRef.id,
        name,
        currency,
        ownerId: user.uid,
        createdAt: new Date(),
        isDefault
      };

      // If this is set as default, update other businesses to not be default
      if (isDefault) {
        setBusinesses(prev => prev.map(b => ({
          ...b,
          isDefault: false
        })));
      }

      setBusinesses(prev => [...prev, newBusiness]);
      
      // If this is the first business or set as default, make it current
      if (businesses.length === 0 || isDefault) {
        setCurrentBusiness(newBusiness);
      }

      toast.success('Business added successfully');
    } catch (error) {
      console.error('Error adding business:', error);
      toast.error('Failed to add business');
      throw error;
    }
  };

  return (
    <BusinessContext.Provider 
      value={{ 
        currentBusiness, 
        businesses, 
        setCurrentBusiness, 
        addBusiness,
        renameBusiness,
        setDefaultBusiness,
        isLoading 
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
} 