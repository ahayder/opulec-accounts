import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOutIcon, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarItem {
  title: string;
  icon?: string;
  path: string;
}

interface SidebarProps {
  items: SidebarItem[];
}

const SidebarContent = ({ items, className }: SidebarProps & { className?: string }) => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-6 border-b">
        <h2 className="text-2xl font-semibold tracking-tight">Opulec Accounts</h2>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {items.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={index}>
                <Button
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    'w-full justify-start text-base',
                    'flex items-center gap-3'
                  )}
                >
                  <Link to={item.path}>
                    {item.icon && <span className="text-xl">{item.icon}</span>}
                    <span>{item.title}</span>
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-base text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={logout}
        >
          <LogOutIcon className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="p-2 md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent items={items} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-background border-r">
        <SidebarContent items={items} />
      </aside>
    </>
  );
};

export default Sidebar; 