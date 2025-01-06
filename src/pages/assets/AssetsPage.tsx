import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAsset, getAssets, type AssetEntry } from '@/utils/database';
import { Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AssetsPage = () => {
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [formData, setFormData] = useState<Omit<AssetEntry, 'id'>>({
    name: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    cost: 0,
    usefulLife: 0
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
      toast.error('Failed to load assets');
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
    setIsSubmitting(true);
    try {
      await addAsset(formData);
      await loadAssets();
      setFormData({
        name: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        cost: 0,
        usefulLife: 0
      });
      toast.success('Asset added successfully');
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full">
      <div 
        className={cn(
          "transition-all duration-300 ease-in-out p-4 md:p-8 pt-6 overflow-auto",
          isSidebarOpen ? "pr-[400px]" : "pr-2"
        )}
      >
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Assets</h1>
            <p className="text-muted-foreground">Track and manage your business assets</p>
          </div>
        </div>

        <div className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Name</TableHead>
                <TableHead className="w-[120px]">Purchase Date</TableHead>
                <TableHead className="text-right w-[120px]">Cost</TableHead>
                <TableHead className="text-right w-[120px]">Useful Life</TableHead>
                <TableHead className="text-right w-[120px]">Depreciation/Month</TableHead>
                <TableHead className="text-right w-[120px]">Net Book Value</TableHead>
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
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>{new Date(asset.purchaseDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">৳{asset.cost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{asset.usefulLife} years</TableCell>
                      <TableCell className="text-right">৳{depreciationPerMonth.toFixed(2)}</TableCell>
                      <TableCell className="text-right">৳{netBookValue.toFixed(2)}</TableCell>
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
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        <div className="w-[400px] border-l bg-background h-full overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">New Asset Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter asset name"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', parseFloat(e.target.value))}
                    placeholder="৳0.00"
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="usefulLife">Useful Life (Years)</Label>
                  <Input
                    id="usefulLife"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.usefulLife}
                    onChange={(e) => handleInputChange('usefulLife', parseInt(e.target.value))}
                    placeholder="1"
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