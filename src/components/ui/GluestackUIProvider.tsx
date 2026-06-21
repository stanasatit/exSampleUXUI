import type { PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';

type ColorMode = 'dark' | 'light';

const GluestackUIContext = createContext<{ colorMode: ColorMode }>({
  colorMode: 'light',
});

type GluestackUIProviderProps = PropsWithChildren<{
  colorMode?: ColorMode;
}>;

export function GluestackUIProvider({
  children,
  colorMode = 'light',
}: GluestackUIProviderProps) {
  return (
    <GluestackUIContext.Provider value={{ colorMode }}>
      {children}
    </GluestackUIContext.Provider>
  );
}

export function useGluestackUI() {
  return useContext(GluestackUIContext);
}
