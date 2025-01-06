import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface GenderSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const GenderSelect: React.FC<GenderSelectProps> = ({
  value,
  onValueChange,
  disabled = false
}) => {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      className="flex gap-4"
      disabled={disabled}
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="Men" id="men" />
        <Label htmlFor="men">Men</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="Women" id="women" />
        <Label htmlFor="women">Women</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="Unisex" id="unisex" />
        <Label htmlFor="unisex">Unisex</Label>
      </div>
    </RadioGroup>
  );
};

export default GenderSelect; 