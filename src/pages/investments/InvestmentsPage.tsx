import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addInvestment, getInvestments, type InvestmentEntry } from '@/utils/database';
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

const InvestmentsPage = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [investments, setInvestments] = useState<InvestmentEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<Omit<InvestmentEntry, 'id'>>({
    date: formatDateForInput(new Date()),
    investor: '',
    amount: 0,
    note: ''
  });

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setIsLoading(true);
      const data = await getInvestments();
      setInvestments(data);
    } catch (error) {
      console.error('Error loading investments:', error);
      toast.error('Failed to load investments', {
        dismissible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name: keyof Omit<InvestmentEntry, 'id'>, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredFields = {
      date: 'Date',
      investor: 'Investor',
      amount: 'Amount'
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

    if (Number(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0', {
        dismissible: true
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addInvestment(formData);
      await loadInvestments();
      setFormData({
        date: formatDateForInput(new Date()),
        investor: '',
        amount: 0,
        note: ''
      });
      toast.success('Investment added successfully', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error adding investment:', error);
      toast.error('Failed to add investment', {
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
          "transition-all duration-300 ease-in-out p-4 md:p-8 pt-6 overflow-auto",
          isSidebarOpen ? "pr-[400px]" : "pr-2"
        )}
      >
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Investments</h1>
            <p className="text-muted-foreground">Track and manage your business investments</p>
          </div>
        </div>

        <div className="border rounded-lg mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[180px]">Name</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[120px]">Amount</TableHead>
                <TableHead className="w-[120px]">Return</TableHead>
                <TableHead className="w-[200px]">Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading investments data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : investments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No investments entries yet
                  </TableCell>
                </TableRow>
              ) : (
                investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell>{new Date(investment.date).toLocaleDateString()}</TableCell>
                    <TableCell>{investment.investor}</TableCell>
                    <TableCell className="text-right">৳{investment.amount.toFixed(2)}</TableCell>
                    <TableCell>{investment.note}</TableCell>
                  </TableRow>
                ))
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
            <h2 className="text-lg font-semibold mb-4">New Investment Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <RequiredLabel htmlFor="date">Date</RequiredLabel>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <RequiredLabel htmlFor="investor">Investor</RequiredLabel>
                  <Input
                    id="investor"
                    type="text"
                    value={formData.investor}
                    onChange={(e) => handleInputChange('investor', e.target.value)}
                    placeholder="Enter investor name"
                    className="w-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <RequiredLabel htmlFor="amount">Amount</RequiredLabel>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                    placeholder="৳0.00"
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
                    placeholder="Enter note"
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

export default InvestmentsPage; 