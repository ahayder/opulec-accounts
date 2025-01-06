import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addInvestment, getInvestments, type InvestmentEntry } from '@/utils/database';
import { useBusiness } from '@/contexts/BusinessContext';
import { toast } from 'sonner';

interface InvestmentFormData {
  date: string;
  investor: string;
  amount: number;
  note: string;
}

const InvestmentsPage = () => {
  const { currentBusiness } = useBusiness();
  const [investments, setInvestments] = useState<InvestmentEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<InvestmentFormData>({
    date: new Date().toISOString().split('T')[0],
    investor: '',
    amount: 0,
    note: ''
  });

  useEffect(() => {
    if (currentBusiness) {
      loadInvestments();
    }
  }, [currentBusiness]);

  const loadInvestments = async () => {
    if (!currentBusiness) return;
    
    try {
      const data = await getInvestments(currentBusiness.id);
      setInvestments(data);
    } catch (error) {
      console.error('Error loading investments:', error);
      toast.error('Failed to load investments');
    }
  };

  const handleInputChange = (name: keyof InvestmentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) {
      toast.error('Please select a business first');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addInvestment(currentBusiness.id, formData);
      await loadInvestments();
      setFormData({
        date: new Date().toISOString().split('T')[0],
        investor: '',
        amount: 0,
        note: ''
      });
      toast.success('Investment added successfully');
    } catch (error) {
      console.error('Error adding investment:', error);
      toast.error('Failed to add investment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="h-16 border-b flex items-center">
        <div>
          <h1 className="text-2xl font-bold">Investments</h1>
          <p className="text-muted-foreground">Track and manage your investment records</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">New Investment Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="investor">Investor</Label>
              <Input
                id="investor"
                type="text"
                value={formData.investor}
                onChange={(e) => handleInputChange('investor', e.target.value)}
                placeholder="Enter investor name"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                placeholder="৳0.00"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                type="text"
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder="Enter note"
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
                {isSubmitting ? 'Adding...' : 'Add Investment'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {investments.map((investment) => (
              <tr key={investment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(investment.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{investment.investor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  ৳{investment.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{investment.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestmentsPage; 