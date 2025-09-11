"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { RainbowKitProvider, darkTheme, lightTheme, Theme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { config } from '@/config/wagmi';
import { useTheme } from 'next-themes';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

// Toast样式配置
const getToastStyles = (isDark: boolean) => ({
  default: {
    background: isDark ? 'rgb(31, 41, 55)' : 'rgb(255, 255, 255)',
    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
    border: isDark ? '1px solid rgb(75, 85, 99)' : '1px solid rgb(229, 231, 235)',
    borderRadius: '12px',
    boxShadow: isDark 
      ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
      : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    fontSize: '14px',
    padding: '16px',
    minWidth: '300px',
  },
  success: {
    background: isDark ? 'rgb(20, 83, 45)' : 'rgb(240, 253, 244)',
    color: isDark ? 'rgb(134, 239, 172)' : 'rgb(22, 163, 74)',
    border: isDark ? '1px solid rgb(34, 197, 94)' : '1px solid rgb(34, 197, 94)',
  },
  error: {
    background: isDark ? 'rgb(127, 29, 29)' : 'rgb(254, 242, 242)',
    color: isDark ? 'rgb(252, 165, 165)' : 'rgb(220, 38, 38)',
    border: isDark ? '1px solid rgb(239, 68, 68)' : '1px solid rgb(239, 68, 68)',
  },
  loading: {
    background: isDark ? 'rgb(30, 58, 138)' : 'rgb(239, 246, 255)',
    color: isDark ? 'rgb(147, 197, 253)' : 'rgb(59, 130, 246)',
    border: isDark ? '1px solid rgb(59, 130, 246)' : '1px solid rgb(59, 130, 246)',
  }
});

function RainbowKitWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [themeColor, setThemeColor] = React.useState('#3b82f6');
  
  // 获取当前主题色
  const getThemeColor = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const primaryColor = getComputedStyle(root).getPropertyValue('--theme-primary').trim();
      if (primaryColor) {
        // 将 RGB 值转换为十六进制
        const rgbValues = primaryColor.split(' ').map(val => parseInt(val.trim()));
        const hex = '#' + rgbValues.map(val => val.toString(16).padStart(2, '0')).join('');
        return hex;
      }
    }
    return '#3b82f6'; // 默认蓝色
  }, []);

  // 监听主题色变化
  React.useEffect(() => {
    const updateThemeColor = () => {
      setThemeColor(getThemeColor());
    };

    updateThemeColor();

    // 监听CSS变量变化
    const observer = new MutationObserver(updateThemeColor);
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    return () => observer.disconnect();
  }, [getThemeColor]);

  const customTheme = React.useMemo(() => {
    const baseTheme = theme === 'dark' ? darkTheme() : lightTheme();
    
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        accentColor: themeColor,
        accentColorForeground: '#ffffff',
        actionButtonBorder: themeColor,
        actionButtonBorderMobile: themeColor,
        connectButtonBackground: themeColor,
        connectButtonBackgroundError: '#ef4444',
        connectButtonInnerBackground: themeColor,
        connectButtonText: '#ffffff',
        connectButtonTextError: '#ffffff',
      },
      radii: {
        ...baseTheme.radii,
        actionButton: '12px',
        connectButton: '12px',
        menuButton: '12px',
        modal: '16px',
        modalMobile: '16px',
      },
    } satisfies Theme;
  }, [theme, themeColor]);

  const toastStyles = React.useMemo(() => getToastStyles(theme === 'dark'), [theme]);

  return (
    <RainbowKitProvider theme={customTheme}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: '',
          style: toastStyles.default,
          success: {
            style: {
              ...toastStyles.default,
              ...toastStyles.success,
            },
            iconTheme: {
              primary: 'rgb(34, 197, 94)',
              secondary: 'white',
            },
          },
          error: {
            style: {
              ...toastStyles.default,
              ...toastStyles.error,
            },
            iconTheme: {
              primary: 'rgb(239, 68, 68)',
              secondary: 'white',
            },
          },
          loading: {
            style: {
              ...toastStyles.default,
              ...toastStyles.loading,
            },
            iconTheme: {
              primary: 'rgb(59, 130, 246)',
              secondary: 'white',
            },
          },
        }}
      />
    </RainbowKitProvider>
  );
}

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider navigate={router.push}>
          <NextThemesProvider {...themeProps}>
            <RainbowKitWrapper>
              {children}
            </RainbowKitWrapper>
          </NextThemesProvider>
        </HeroUIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
