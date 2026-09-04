import React from 'react';
import { SignInButton } from '@clerk/clerk-react';
import { KeyRound, ExternalLink, Database, ArrowRight } from 'lucide-react';

export const SetupBanner: React.FC = () => {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const isPlaceholder =
    !clerkKey ||
    clerkKey.includes('REPLACE_WITH') ||
    clerkKey === 'pk_test_...';

  if (!isPlaceholder) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 p-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <KeyRound size={20} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900">
              Clerk Authentication Keys Needed
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              To enable multi-user authentication so each user only sees their own tasks and events, paste your Clerk API keys into:
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <code className="px-2 py-0.5 bg-amber-100/80 text-amber-900 rounded-md text-xs font-mono">
                frontend/.env (VITE_CLERK_PUBLISHABLE_KEY)
              </code>
              <code className="px-2 py-0.5 bg-amber-100/80 text-amber-900 rounded-md text-xs font-mono">
                backend/.env (CLERK_SECRET_KEY)
              </code>
            </div>
          </div>
        </div>

        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>Open Clerk Dashboard</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
};

export const WelcomeHero: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
        <Database size={13} />
        PostgreSQL & Express Backend • React & TypeScript • Clerk Auth
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
        All Your Tasks, Events & Focus Blocks{' '}
        <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600">
          on One Interactive Calendar
        </span>
      </h1>
      <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mt-4 mb-8">
        Organize todos with due dates, schedule upcoming meetings, and chunk your daily focus time with Pomodoro-ready blocks. Everything is securely isolated to your account.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-left mt-10">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl mb-2">☑️</div>
          <h3 className="text-base font-semibold text-slate-800">Tasks & Due Dates</h3>
          <p className="text-xs text-slate-500 mt-1">
            Priorities, deadlines, overdue alerts, and completion tracking.
          </p>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl mb-2">🎪</div>
          <h3 className="text-base font-semibold text-slate-800">Upcoming Events</h3>
          <p className="text-xs text-slate-500 mt-1">
            Track meetings and deadlines with custom colors and locations.
          </p>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl mb-2">⚡</div>
          <h3 className="text-base font-semibold text-slate-800">Time Chunking</h3>
          <p className="text-xs text-slate-500 mt-1">
            Protect blocks of deep work and track daily focused minutes.
          </p>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center">
        <SignInButton mode="modal">
          <button className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer">
            <span>Get Started</span>
            <ArrowRight size={16} />
          </button>
        </SignInButton>
      </div>
    </div>
  );
};
