import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { Plus } from 'lucide-react';
import { Category } from '@/utils/database';

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  categories: Category[];
  onAddCategory?: (name: string) => Promise<void>;
  placeholder: string;
  disabled?: boolean;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onValueChange,
  categories,
  onAddCategory,
  placeholder,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && inputValue && onAddCategory) {
      e.preventDefault();
      await onAddCategory(inputValue);
      onValueChange(inputValue);
      setInputValue('');
      setOpen(false);
    }
  };

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setInputValue('');
    setOpen(false);
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || placeholder}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start" sideOffset={4}>
        <Command shouldFilter={false} className="w-full">
          <CommandInput 
            placeholder={onAddCategory ? `Search or add ${placeholder.toLowerCase()}...` : `Search ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-sm">
              {inputValue && onAddCategory && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Plus className="h-4 w-4" />
                  <span>Press Enter to add "{inputValue}"</span>
                </div>
              )}
              {!inputValue && filteredCategories.length === 0 && `No ${placeholder.toLowerCase()} found`}
            </CommandEmpty>
            <CommandGroup className="p-0">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => handleSelect(category.name)}
                  role="button"
                  tabIndex={0}
                >
                  <span>{category.name}</span>
                  {value === category.name && (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </div>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CategorySelect; 