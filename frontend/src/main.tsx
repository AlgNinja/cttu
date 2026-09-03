import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App';
import { SetupBanner, WelcomeHero } from './components/Common/SetupBanner';
import { ErrorBoundary } from './components/Common/ErrorBoundary';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const isKeyPlaceholder =
  !PUBLISHABLE_KEY ||
  PUBLISHABLE_KEY.includes('REPLACE_WITH') ||
  PUBLISHABLE_KEY === 'pk_test_...';

function Root() {
  if (isKeyPlaceholder) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
        <SetupBanner />
        <header className="bg-white border-b border-slate-200 py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-bold text-lg text-slate-900 tracking-tight">FocusFlow</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Awaiting Clerk Keys in .env
            </span>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <WelcomeHero />
        </main>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fallbackTitle="Application Root Error">
    <Root />
  </ErrorBoundary>
);
