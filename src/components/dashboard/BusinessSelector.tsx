import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBusiness } from '@/contexts/BusinessContext';
import { PlusIcon, HomeIcon, Pencil1Icon, StarFilledIcon } from '@radix-ui/react-icons';
import { cn } from "@/lib/utils";

const BusinessSelector = () => {
  const { currentBusiness, businesses, setCurrentBusiness, addBusiness, renameBusiness, setDefaultBusiness } = useBusiness();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessCurrency, setNewBusinessCurrency] = useState('BDT');
  const [renameValue, setRenameValue] = useState('');

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBusiness(newBusinessName, newBusinessCurrency);
      setNewBusinessName('');
      setNewBusinessCurrency('BDT');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding business:', error);
    }
  };

  const handleRenameBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    
    try {
      await renameBusiness(currentBusiness.id, renameValue);
      setRenameValue('');
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error('Error renaming business:', error);
    }
  };

  const handleSetDefault = async (businessId: string) => {
    try {
      await setDefaultBusiness(businessId);
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error('Error setting default business:', error);
    }
  };

  return (
    <div className="px-3 py-2">
      <div className="mb-2 px-2 flex items-center justify-between">
        <Label className="text-xs font-medium">BUSINESS</Label>
        <div className="flex items-center gap-1">
          {currentBusiness && (
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <Pencil1Icon className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Business</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRenameBusiness} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="renameBusiness">Business Name</Label>
                    <Input
                      id="renameBusiness"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      placeholder={currentBusiness.name}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Default Status</Label>
                    <div className="flex items-center gap-2">
                      {currentBusiness.isDefault ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <StarFilledIcon className="h-4 w-4 text-yellow-400" />
                          This is your default business
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleSetDefault(currentBusiness.id)}
                        >
                          Make This Business Default
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4">
                <PlusIcon className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Business</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBusiness} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    placeholder="Enter business name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={newBusinessCurrency} onValueChange={setNewBusinessCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Add Business</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Select 
        value={currentBusiness?.id} 
        onValueChange={(value) => {
          const selected = businesses.find(b => b.id === value);
          if (selected) setCurrentBusiness(selected);
        }}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <HomeIcon className="h-4 w-4" />
            <SelectValue placeholder="Select business" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {businesses.map((business) => (
            <SelectItem 
              key={business.id} 
              value={business.id}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <StarFilledIcon 
                  className={cn(
                    "h-4 w-4",
                    business.isDefault ? "text-yellow-400" : "text-muted-foreground"
                  )}
                />
                <span>{business.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BusinessSelector; 