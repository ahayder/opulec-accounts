import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAsset, getAssets, updateAssetDepreciation, type AssetEntry } from '@/utils/database';

interface AssetFormData {
  name: string;
  purchaseDate: string;
  cost: number;
  usefulLife: number;
}

interface CalculatedAsset extends AssetEntry {
  depreciationPerMonth: number;
  accumulatedDepreciation: number;
  netBookValue: number;
}

const AssetsPage = () => {
  const [assets, setAssets] = useState<CalculatedAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    cost: 0,
    usefulLife: 1
  });

  useEffect(() => {
    loadAssetsAndUpdateDepreciation();
  }, []);

  const loadAssetsAndUpdateDepreciation = async () => {
    try {
      const data = await getAssets();
      
      // Check and update depreciation for each asset
      const now = new Date();
      for (const asset of data) {
        const lastUpdated = asset.lastUpdated?.toDate() || new Date(asset.purchaseDate);
        const monthsSinceUpdate = (now.getFullYear() - lastUpdated.getFullYear()) * 12 + 
                                (now.getMonth() - lastUpdated.getMonth());
        
        // If it's been a month or more since the last update
        if (monthsSinceUpdate >= 1) {
          await updateAssetDepreciation(asset.id);
        }
      }

      // Reload assets with updated values
      const updatedData = await getAssets();
      const calculatedAssets = updatedData.map(calculateDepreciation);
      setAssets(calculatedAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  const calculateDepreciation = (asset: AssetEntry): CalculatedAsset => {
    const purchaseDate = new Date(asset.purchaseDate);
    const today = new Date();
    
    // Calculate months elapsed since purchase
    const monthsElapsed = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                         (today.getMonth() - purchaseDate.getMonth());
    
    const depreciationPerMonth = asset.cost / (asset.usefulLife * 12);
    const accumulatedDepreciation = Math.min(
      depreciationPerMonth * monthsElapsed,
      asset.cost
    );
    const netBookValue = asset.cost - accumulatedDepreciation;

    return {
      ...asset,
      depreciationPerMonth,
      accumulatedDepreciation,
      netBookValue
    };
  };

  const handleInputChange = (name: keyof AssetFormData, value: string | number) => {
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
      await loadAssetsAndUpdateDepreciation();
      setFormData({
        name: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        cost: 0,
        usefulLife: 1
      });
    } catch (error) {
      console.error('Error adding asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Assets</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">New Asset Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-3">
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
            <div className="md:col-span-3">
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
            <div className="md:col-span-2">
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
            <div className="md:col-span-2">
              <Label htmlFor="usefulLife">Useful Life (Years)</Label>
              <Input
                id="usefulLife"
                type="number"
                min="1"
                step="1"
                value={formData.usefulLife}
                onChange={(e) => handleInputChange('usefulLife', parseInt(e.target.value))}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Asset'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Useful Life</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Depreciation/Month</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Accumulated Depreciation</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Book Value</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td className="px-6 py-4 whitespace-nowrap">{asset.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(asset.purchaseDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  ৳{asset.cost.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {asset.usefulLife} years
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  ৳{asset.depreciationPerMonth.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  ৳{asset.accumulatedDepreciation.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  ৳{asset.netBookValue.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetsPage; 