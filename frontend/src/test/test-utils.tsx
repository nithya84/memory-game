import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { UserPreferencesProvider } from '../contexts/UserPreferences';

// Mock providers for testing (Router is now handled in App.tsx)
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <UserPreferencesProvider>
      {children}
    </UserPreferencesProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };