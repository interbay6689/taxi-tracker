import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Plus, FileText, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onQuickAdd?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onQuickAdd }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'דשבורד', path: '/dashboard' },
    { icon: BarChart3, label: 'אנליטיקה', path: '/analytics' },
    { icon: Plus, label: 'הוסף', path: '#', isCenter: true },
    { icon: FileText, label: 'דוחות', path: '/reports' },
    { icon: MoreHorizontal, label: 'עוד', path: '/settings' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          if (item.isCenter) {
            return (
              <button
                key={index}
                onClick={onQuickAdd}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform">
                  <item.icon className="h-6 w-6" />
                </div>
              </button>
            );
          }

          return (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center flex-1 py-2 transition-colors',
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
