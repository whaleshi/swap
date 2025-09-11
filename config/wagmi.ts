import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { getSupportedChains, networks } from './networks';

const supportedChains = getSupportedChains();

export const config = getDefaultConfig({
  appName: 'Swap DApp',
  projectId: 'YOUR_PROJECT_ID', // 需要替换为真实的WalletConnect Project ID
  chains: supportedChains,
  initialChain: networks.morphTestnet, // 默认连接到Morph测试链
  ssr: true,
});