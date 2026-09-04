import React from 'react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/clerk-react';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Zap,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

export type TabType = 'calendar' | 'todos' | 'events' | 'timeChunks';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  counts: {
    todos: number;
    events: number;
    timeChunks: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  counts,
}) => {
  const { user } = useUser();

  const navTabs = [
    {
      id: 'calendar' as TabType,
      label: 'Calendar View',
      icon: CalendarIcon,
      badge: null,
    },
    {
      id: 'todos' as TabType,
      label: 'Tasks & Due Dates',
      icon: CheckSquare,
      badge: counts.todos,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'events' as TabType,
      label: 'Upcoming Events',
      icon: CalendarDays,
      badge: counts.events,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'timeChunks' as TabType,
      label: 'Time Chunking',
      icon: Zap,
      badge: counts.timeChunks,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight block leading-tight">
                CTTU
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block leading-tight">
                Calendar, Todo, Time Chunk, Upcoming Events
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                    }
                  />
                  <span>{tab.label}</span>
                  {tab.badge !== null && tab.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center gap-3">
            <SignedIn>
              <div className="flex items-center gap-2.5 pl-2">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.fullName || user?.firstName || 'User'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {user?.primaryEmailAddress?.emailAddress}
                  </div>
                </div>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: 'w-9 h-9 ring-2 ring-indigo-500/20',
                    },
                  }}
                />
              </div>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors">
                  Sign In with Clerk
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2.5 border-t border-slate-100 gap-1 scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
