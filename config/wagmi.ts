import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { getSupportedChains, networks } from './networks';
import type { Chain } from 'viem';

const supportedChains = getSupportedChains();

export const config = getDefaultConfig({
  appName: 'Swap DApp',
  projectId: 'YOUR_PROJECT_ID', // 需要替换为真实的WalletConnect Project ID
  chains: supportedChains as unknown as readonly [Chain, ...Chain[]],
  ssr: true,
});