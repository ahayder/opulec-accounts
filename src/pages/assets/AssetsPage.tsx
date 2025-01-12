import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAsset, getAssets, type AssetEntry } from '@/utils/database';
import { Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { formatDateForInput } from "@/utils/dateFormat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSidebar } from '@/contexts/SidebarContext';

const RequiredLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <div className="flex items-center gap-1">
    <Label htmlFor={htmlFor}>{children}</Label>
    <span className="text-red-500">*</span>
  </div>
);

const AssetsPage = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<Omit<AssetEntry, 'id'>>({
    name: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    cost: 0,
    usefulLife: 0,
    note: ''
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      const data = await getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast.error('Failed to load assets', {
        dismissible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name: keyof Omit<AssetEntry, 'id'>, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredFields = {
      name: 'Asset Name',
      purchaseDate: 'Purchase Date',
      cost: 'Cost',
      usefulLife: 'Useful Life'
    } as const;

    const missingFields = Object.entries(requiredFields).filter(
      ([key]) => !formData[key as keyof typeof requiredFields]
    ).map(([, label]) => label);

    if (missingFields.length > 0) {
      toast.error(`Required fields missing: ${missingFields.join(', ')}`, {
        dismissible: true
      });
      return;
    }

    if (Number(formData.cost) <= 0) {
      toast.error('Cost must be greater than 0', {
        dismissible: true
      });
      return;
    }

    if (Number(formData.usefulLife) <= 0) {
      toast.error('Useful Life must be greater than 0', {
        dismissible: true
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addAsset(formData);
      await loadAssets();
      setFormData({
        name: '',
        purchaseDate: formatDateForInput(new Date()),
        cost: 0,
        usefulLife: 0,
        note: ''
      });
      toast.success('Asset added successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset', {
        dismissible: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full">
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out p-4 md:py-3 md:px-6 pt-6 overflow-auto",
          isSidebarOpen ? "pr-[400px]" : "pr-2"
        )}
      >
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Assets</h1>
            <p className="text-muted-foreground">Track and manage your business assets</p>
          </div>
        </div>

        <div className="border rounded-lg mt-4 w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[150px]">Category</TableHead>
                <TableHead className="w-[150px]">Purchase Price</TableHead>
                <TableHead className="w-[150px]">Current Value</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading assets data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No assets entries yet
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => {
                  const depreciationPerMonth = asset.cost / (asset.usefulLife * 12);
                  const purchaseDate = new Date(asset.purchaseDate);
                  const today = new Date();
                  const monthsElapsed = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                                     (today.getMonth() - purchaseDate.getMonth());
                  const accumulatedDepreciation = Math.min(
                    depreciationPerMonth * monthsElapsed,
                    asset.cost
                  );
                  const netBookValue = asset.cost - accumulatedDepreciation;

                  return (
                    <TableRow key={asset.id}>
                      <TableCell>{new Date(asset.purchaseDate).toLocaleDateString()}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>{asset.usefulLife} years</TableCell>
                      <TableCell>৳{asset.cost.toFixed(2)}</TableCell>
                      <TableCell>৳{netBookValue.toFixed(2)}</TableCell>
                      <TableCell>{asset.note || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div 
        className={cn(
          "fixed right-0 top-0 h-full transition-all duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "translate-x-[calc(100%-16px)]"
        )}
      >
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-10 w-10 absolute -left-5 top-[68px] z-10 rounded-full bg-background border shadow-md hover:bg-accent",
            !isSidebarOpen && "rotate-180"
          )}
          onClick={toggleSidebar}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        <div className="w-[400px] border-l bg-background h-full overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">New Asset Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <RequiredLabel htmlFor="name">Asset Name</RequiredLabel>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter asset name"
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <RequiredLabel htmlFor="purchaseDate">Purchase Date</RequiredLabel>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <RequiredLabel htmlFor="cost">Cost</RequiredLabel>
                  <Input
                    id="cost"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', parseFloat(e.target.value))}
                    placeholder="৳0.00"
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <RequiredLabel htmlFor="usefulLife">Useful Life (Years)</RequiredLabel>
                  <Input
                    id="usefulLife"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.usefulLife}
                    onChange={(e) => handleInputChange('usefulLife', parseInt(e.target.value))}
                    placeholder="1"
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Input
                    id="note"
                    type="text"
                    value={formData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    placeholder="Add a note..."
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="flex justify-end">
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
        </div>
      </div>
    </div>
  );
};

export default AssetsPage; 