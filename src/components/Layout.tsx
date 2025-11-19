import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Home, Camera, Heart, TrendingUp, Settings, Sun, Moon, Monitor, LogOut } from 'lucide-react';
import { NutriFitLogo } from '@/components/NutriFitLogo';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navigation = () => {
  const location = useLocation();
  const { setTheme, theme } = useTheme();
  const { signOut, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/meals', icon: Camera, label: 'Meals' },
    { path: '/mood', icon: Heart, label: 'Mood' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bg-card border-t border-border lg:border-r lg:border-t-0 lg:h-screen lg:w-64 fixed bottom-0 left-0 right-0 lg:relative z-40">
      <div className="flex lg:flex-col justify-around lg:justify-start lg:p-4 h-16 lg:h-full">
        {/* Logo/Brand - Hidden on mobile */}
        <div className="hidden lg:flex items-center mb-8">
          <NutriFitLogo size="md" />
        </div>

        {/* Navigation Items */}
        <div className="contents lg:block lg:space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start p-2 lg:px-4 lg:py-3 rounded-lg transition-all duration-200 ${
                isActive(path)
                  ? 'text-primary bg-primary-light'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs lg:text-sm lg:ml-3 mt-1 lg:mt-0">{label}</span>
            </Link>
          ))}
        </div>

        {/* Theme Toggle - Desktop only */}
        <div className="hidden lg:block mt-auto space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                {theme === 'light' && <Sun size={16} />}
                {theme === 'dark' && <Moon size={16} />}
                {theme === 'system' && <Monitor size={16} />}
                <span className="ml-2 capitalize">{theme}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun size={16} className="mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon size={16} className="mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor size={16} className="mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="pt-2 border-t border-border">
            <div className="px-2 mb-2 text-xs text-muted-foreground truncate">
              {user?.email}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start" 
              onClick={signOut}
            >
              <LogOut size={16} />
              <span className="ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="flex flex-col lg:flex-row">
        <Navigation />
        <main className="flex-1 pb-16 lg:pb-0 px-4 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};