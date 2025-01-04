import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  title: string;
  icon?: string;
  path: string;
}

interface SidebarProps {
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const location = useLocation();

  return (
    <aside className="min-h-screen w-64 bg-background border-r">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-semibold tracking-tight">Opulec Accounts</h2>
      </div>
      <nav className="p-4">
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
    </aside>
  );
};

export default Sidebar; 