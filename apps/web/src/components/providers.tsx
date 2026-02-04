"use client";

import { Provider } from 'react-redux';
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { store } from '@/store';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster richColors />
      </ThemeProvider>
    </Provider>
  );
}
