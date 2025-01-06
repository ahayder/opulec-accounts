import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon, 
  MinusIcon, 
  BackpackIcon, 
  GearIcon,
  ExitIcon,
  BarChartIcon,
  LayersIcon,
  RocketIcon
} from '@radix-ui/react-icons';
import BusinessSelector from './BusinessSelector';

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="h-screen w-64 border-r bg-background flex flex-col">
      <div className="h-16 border-b flex items-center px-6">
        <h1 className="text-xl font-bold">Opulec Accounts</h1>
      </div>
      
      <nav className="flex-1 p-3 space-y-1">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive 
                ? 'bg-secondary text-secondary-foreground' 
                : 'hover:bg-secondary/50'
            }`
          }
        >
          <HomeIcon className="h-4 w-4" />
          Dashboard
        </NavLink>
        
        <NavLink 
          to="/sales" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive 
                ? 'bg-secondary text-secondary-foreground' 
                : 'hover:bg-secondary/50'
            }`
          }
        >
          <BarChartIcon className="h-4 w-4" />
          Sales
        </NavLink>

        <NavLink 
          to="/purchases" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive 
                ? 'bg-secondary text-secondary-foreground' 
                : 'hover:bg-secondary/50'
            }`
          }
        >
          <BackpackIcon className="h-4 w-4" />
          Purchases
        </NavLink>

        <NavLink 
          to="/expenses" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive 
                ? 'bg-secondary text-secondary-foreground' 
                : 'hover:bg-secondary/50'
            }`
          }
        >
          <MinusIcon className="h-4 w-4" />
          Expenses
        </NavLink>

        <NavLink 
          to="/assets" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive 
                ? 'bg-secondary text-secondary-foreground' 
                : 'hover:bg-secondary/50'
            }`
          }
        >
          <LayersIcon className="h-4 w-4" />
          Assets
        </NavLink>

        <NavLink 
          to="/investments" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive 
                ? 'bg-secondary text-secondary-foreground' 
                : 'hover:bg-secondary/50'
            }`
          }
        >
          <RocketIcon className="h-4 w-4" />
          Investments
        </NavLink>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive 
                ? 'bg-secondary text-secondary-foreground' 
                : 'hover:bg-secondary/50'
            }`
          }
        >
          <GearIcon className="h-4 w-4" />
          Settings
        </NavLink>
      </nav>

      <div className="border-t p-3 space-y-2">
        <BusinessSelector />
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3" 
          onClick={logout}
        >
          <ExitIcon className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar; 