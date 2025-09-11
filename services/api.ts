import { getApiEndpoint, supportsSwap } from '@/config/networks';
import { readContract, getBalance, writeContract } from '@wagmi/core';
import { config } from '@/config/wagmi';
import { encodeFunctionData, parseAbi, decodeFunctionResult, parseUnits, formatUnits } from 'viem';
import { MULTICALL3_ADDRESS, MULTICALL3_ABI } from '@/config/multicall';
import { getSwapContractConfig, SWAP_FUNCTIONS, getDeadline } from '@/config/swap';

export interface CoinListItem {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  icon?: string;
  isNative?: boolean;
  price?: number;
  marketCap?: number;
  priceChange24h?: number;
  balance?: number;
}

// API 服务类
export class SwapApiService {
  private chainId: number;
  private apiEndpoint: string | null;

  constructor(chainId: number) {
    this.chainId = chainId;
    this.apiEndpoint = getApiEndpoint(chainId);
  }

  // 检查是否支持API调用
  isSupported(): boolean {
    return supportsSwap(this.chainId) && !!this.apiEndpoint;
  }

  // 获取代币列表
  async getCoinList(keyword?: string, filterType?: number): Promise<CoinListItem[]> {
    console.log('getCoinList called for chainId:', this.chainId);
    console.log('API endpoint:', this.apiEndpoint);
    console.log('Supports swap:', supportsSwap(this.chainId));
    console.log('Is supported:', this.isSupported());
    
    if (!this.isSupported()) {
      console.log('API not supported, returning fallback token list');
      // 返回静态代币列表作为回退
      return this.getFallbackTokenList();
    }

    try {
      const formData = new FormData();
      formData.append('user_addr', '');
      formData.append('page', '1');
      formData.append('page_size', '100');
      formData.append('sort_type', '3');
      formData.append('keyword', keyword || '');
      formData.append('filter_type', (filterType || 0).toString());

      const response = await fetch(`${this.apiEndpoint}/v1/mood/coin_list`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Coin list fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('API Response:', data); // 调试日志
      
      // 根据API响应格式处理数据
      if (data.data && data.data.list) {
        console.log('Coin list:', data.data.list); // 调试日志
        
        const apiTokens = data.data.list.map((coin: any, index: number) => {
          console.log(`Token ${index}:`, {
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            mint: coin.mint,
            icon: coin.img_url || coin.image_url
          });
          
          return {
            id: coin.id.toString(),
            symbol: coin.symbol,
            name: coin.name,
            decimals: 18, // 根据API数据，看起来都是18位精度
            address: coin.mint, // 使用mint字段作为合约地址
            icon: coin.img_url || coin.image_url,
            isNative: false, // 这些都是代币，不是原生币
            price: coin.price_usd_f || 0, // 使用USD价格
            marketCap: coin.market_cap_f || 0,
            priceChange24h: coin.price_change_24h_f || 0,
          };
        });

        console.log('Processed apiTokens:', apiTokens);

        // 根据网络确定M代币地址
        const mTokenAddress = this.chainId === 2818 
          ? '0x13345d9e5a0ce52f08c8667dd1dbd60de0f46868' // Morph 主网
          : '0x9f79650d31ee7efa6fa5a45ca19b4bf7276d6868'; // Morph 测试网

        // 筛选API代币：找到M代币并去重
        const mTokenFromApi = apiTokens.find((token: CoinListItem) => 
          token.symbol.toLowerCase() === 'm' && 
          token.address.toLowerCase() === mTokenAddress.toLowerCase()
        );

        // 过滤掉API中的M代币，避免重复
        const otherTokens = apiTokens.filter((token: CoinListItem) => 
          !(token.symbol.toLowerCase() === 'm' && 
            token.address.toLowerCase() === mTokenAddress.toLowerCase())
        );

        // 手动添加配置的代币
        const configuredTokens = [];
        
        // 添加BGB代币 - 根据网络使用不同地址
        const bgbToken: CoinListItem = {
          id: 'bgb',
          symbol: 'BGB',
          name: 'BGB',
          decimals: 18,
          address: this.chainId === 2818 
            ? '0x55d1f1879969bdbB9960d269974564C58DBc3238' // Morph 主网
            : '0x1670F6eb896191C385C5609C78eD8C9fD8514f56', // Morph 测试网
          icon: '/bgb.png',
          isNative: false,
          price: 4.98,
          marketCap: 0,
          priceChange24h: 0,
        };
        configuredTokens.push(bgbToken);

        // 添加M代币（优先使用API数据，如果没有则使用默认配置）
        const mToken: CoinListItem = mTokenFromApi || {
          id: 'm',
          symbol: 'M',
          name: 'Mood',
          decimals: 18,
          address: mTokenAddress,
          icon: 'https://newgame.mypinata.cloud/ipfs/QmdvUMNAU7yNAfceRtTcxnpTbripyucJEF6unkwnouLAgR',
          isNative: false,
          price: 1,
          marketCap: 0,
          priceChange24h: 0,
        };
        configuredTokens.push(mToken);

        console.log('Final token list:', [...configuredTokens, ...otherTokens]);
        return [...configuredTokens, ...otherTokens];
      }
      
      return this.getFallbackTokenList();
    } catch (error) {
      console.error('Error fetching coin list:', error);
      return this.getFallbackTokenList();
    }
  }

  // 回退代币列表
  private getFallbackTokenList(): CoinListItem[] {
    // 根据网络返回默认代币列表
    if (this.chainId === 2818) { // Morph 主网
      return [
        {
          id: 'bgb',
          symbol: 'BGB',
          name: 'BGB',
          decimals: 18,
          address: '0x55d1f1879969bdbB9960d269974564C58DBc3238',
          icon: '/bgb.png',
          isNative: false,
          price: 4.98,
        },
        {
          id: 'm',
          symbol: 'M',
          name: 'Mood',
          decimals: 18,
          address: '0x13345d9e5a0ce52f08c8667dd1dbd60de0f46868',
          icon: 'https://newgame.mypinata.cloud/ipfs/QmdvUMNAU7yNAfceRtTcxnpTbripyucJEF6unkwnouLAgR',
          isNative: false,
          price: 1,
        },
      ];
    } else if (this.chainId === 2810) { // Morph 测试网
      return [
        {
          id: 'bgb',
          symbol: 'BGB',
          name: 'BGB',
          decimals: 18,
          address: '0x1670F6eb896191C385C5609C78eD8C9fD8514f56',
          icon: '/bgb.png',
          isNative: false,
          price: 4.98,
        },
        {
          id: 'm',
          symbol: 'M',
          name: 'Mood',
          decimals: 18,
          address: '0x9f79650d31ee7efa6fa5a45ca19b4bf7276d6868',
          icon: 'https://newgame.mypinata.cloud/ipfs/QmdvUMNAU7yNAfceRtTcxnpTbripyucJEF6unkwnouLAgR',
          isNative: false,
          price: 1,
        },
      ];
    }
    
    return [];
  }

  // 获取单个代币余额
  async getTokenBalance(userAddress: string, token: CoinListItem): Promise<number> {
    if (!userAddress) return 0;

    try {
      if (token.isNative) {
        // 原生代币使用getBalance
        const balance = await getBalance(config, {
          address: userAddress as `0x${string}`,
          chainId: this.chainId,
        });
        return Number(balance.value) / Math.pow(10, balance.decimals);
      } else {
        // ERC20代币使用合约调用
        const balance = await readContract(config, {
          address: token.address as `0x${string}`,
          abi: parseAbi(['function balanceOf(address owner) view returns (uint256)']),
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`],
          chainId: this.chainId,
        });
        return Number(balance) / Math.pow(10, token.decimals);
      }
    } catch (error) {
      console.error(`Failed to read balance for ${token.symbol}:`, error);
      return 0;
    }
  }

  // 使用Multicall3批量获取代币余额（保留，但现在只用于获取选中的代币）
  async getTokenBalances(userAddress: string, tokens: CoinListItem[]): Promise<CoinListItem[]> {
    if (!userAddress) return tokens;

    try {
      const erc20Tokens = tokens.filter(token => !token.isNative);
      const nativeTokens = tokens.filter(token => token.isNative);
      
      // 并行获取ERC20代币余额和原生代币余额
      const [erc20Results, nativeBalances] = await Promise.all([
        // ERC20代币使用multicall3
        erc20Tokens.length > 0 ? this.getERC20BalancesWithMulticall3(userAddress, erc20Tokens) : [],
        // 原生代币使用getBalance
        Promise.all(nativeTokens.map(token => this.getNativeBalance(userAddress, token)))
      ]);

      console.log('ERC20 results:', erc20Results);
      console.log('Native balances:', nativeBalances);

      // 合并结果
      const allResults = [...erc20Results, ...nativeBalances];
      
      // 根据原始代币顺序返回结果
      const updatedTokens = tokens.map(token => {
        const result = allResults.find(r => r.id === token.id);
        return result || { ...token, balance: 0 };
      });

      return updatedTokens;
    } catch (error) {
      console.error('Error reading token balances:', error);
      // 出错时返回原始代币列表，余额为0
      return tokens.map(token => ({ ...token, balance: 0 }));
    }
  }

  // 使用Multicall3获取ERC20代币余额
  private async getERC20BalancesWithMulticall3(userAddress: string, erc20Tokens: CoinListItem[]): Promise<CoinListItem[]> {
    if (erc20Tokens.length === 0) return [];

    try {
      const balanceOfAbi = parseAbi(['function balanceOf(address owner) view returns (uint256)']);
      
      // 构建multicall调用数据
      const calls = erc20Tokens.map(token => {
        console.log(`Preparing call for ${token.symbol} at address: ${token.address}`);
        return {
          target: token.address as `0x${string}`,
          allowFailure: true,
          callData: encodeFunctionData({
            abi: balanceOfAbi,
            functionName: 'balanceOf',
            args: [userAddress as `0x${string}`],
          }),
        };
      });

      console.log('Multicall3 calls for', erc20Tokens.length, 'tokens');
      console.log('Call targets:', calls.map(call => call.target));

      // 调用multicall3合约
      const results = await readContract(config, {
        address: MULTICALL3_ADDRESS as `0x${string}`,
        abi: MULTICALL3_ABI,
        functionName: 'aggregate3',
        args: [calls],
        chainId: this.chainId,
      }) as { success: boolean; returnData: `0x${string}` }[];

      console.log('Multicall3 results:', results);

      // 解析结果
      return erc20Tokens.map((token, index) => {
        const result = results[index];
        
        console.log(`Processing result for ${token.symbol} (${token.address}):`, {
          success: result.success,
          returnData: result.returnData,
          index: index
        });
        
        if (result.success && result.returnData !== '0x') {
          try {
            const balance = decodeFunctionResult({
              abi: balanceOfAbi,
              functionName: 'balanceOf',
              data: result.returnData,
            }) as bigint;

            const formattedBalance = Number(balance) / Math.pow(10, token.decimals);
            console.log(`Multicall3 balance for ${token.symbol} (${token.address}): ${formattedBalance} (raw: ${balance.toString()})`);
            return { ...token, balance: formattedBalance };
          } catch (decodeError) {
            console.error(`Failed to decode balance for ${token.symbol}:`, decodeError);
            return { ...token, balance: 0 };
          }
        } else {
          console.error(`Multicall3 failed for ${token.symbol}:`, result);
          return { ...token, balance: 0 };
        }
      });

    } catch (error) {
      console.error('Multicall3 failed, falling back to individual calls:', error);
      return await this.getERC20BalancesIndividually(userAddress, erc20Tokens);
    }
  }

  // 单独调用获取ERC20代币余额（multicall失败时的回退方案）
  private async getERC20BalancesIndividually(userAddress: string, erc20Tokens: CoinListItem[]): Promise<CoinListItem[]> {
    console.log('Fetching balances individually for', erc20Tokens.length, 'ERC20 tokens');
    
    const balancePromises = erc20Tokens.map(async (token) => {
      try {
        const balance = await readContract(config, {
          address: token.address as `0x${string}`,
          abi: parseAbi(['function balanceOf(address owner) view returns (uint256)']),
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`],
          chainId: this.chainId,
        });

        const formattedBalance = Number(balance) / Math.pow(10, token.decimals);
        console.log(`Individual balance for ${token.symbol}:`, formattedBalance);
        return { ...token, balance: formattedBalance };

      } catch (error) {
        console.error(`Failed to read individual balance for ${token.symbol}:`, error);
        return { ...token, balance: 0 };
      }
    });

    return await Promise.all(balancePromises);
  }

  // 获取原生代币余额
  private async getNativeBalance(userAddress: string, token: CoinListItem): Promise<CoinListItem> {
    try {
      console.log(`Fetching native balance for ${token.symbol} on chain ${this.chainId}`);
      
      const balance = await getBalance(config, {
        address: userAddress as `0x${string}`,
        chainId: this.chainId,
      });

      const formattedBalance = Number(balance.value) / Math.pow(10, balance.decimals);
      console.log(`Native balance for ${token.symbol}:`, formattedBalance);
      
      return { ...token, balance: formattedBalance };
    } catch (error) {
      console.error(`Failed to read native balance for ${token.symbol}:`, error);
      return { ...token, balance: 0 };
    }
  }

  // 获取交换输出数量
  async getAmountsOut(amountIn: string, tokenIn: CoinListItem, tokenOut: CoinListItem): Promise<string[]> {
    try {
      const swapConfig = getSwapContractConfig(this.chainId);
      const amountInWei = parseUnits(amountIn, tokenIn.decimals);
      
      // 构建交换路径 - 可能需要通过WETH进行路由
      let path: `0x${string}`[];
      
      // 检查是否需要通过WETH路由
      if (tokenIn.isNative || tokenOut.isNative) {
        // 涉及原生币时，直接路径
        path = [tokenIn.address, tokenOut.address] as `0x${string}`[];
      } else {
        // 代币到代币可能需要通过WETH路由
        // 首先尝试直接路径
        path = [tokenIn.address, tokenOut.address] as `0x${string}`[];
      }
      
      console.log('Getting amounts out:', {
        amountIn: amountIn,
        amountInWei: amountInWei.toString(),
        path,
        tokenIn: `${tokenIn.symbol} (${tokenIn.decimals} decimals)`,
        tokenOut: `${tokenOut.symbol} (${tokenOut.decimals} decimals)`
      });

      const amounts = await readContract(config, {
        address: swapConfig.address,
        abi: swapConfig.abi,
        functionName: SWAP_FUNCTIONS.GET_AMOUNTS_OUT,
        args: [amountInWei, path],
        chainId: this.chainId,
      }) as bigint[];

      // 使用正确的decimals来格式化输出
      const result = amounts.map((amount, index) => {
        const decimals = index === 0 ? tokenIn.decimals : tokenOut.decimals;
        return formatUnits(amount, decimals);
      });
      
      console.log('Amounts out result:', result);
      
      return result;
    } catch (error) {
      console.error('Error getting amounts out:', error);
      return ['0', '0'];
    }
  }

  // 执行代币交换
  async swapTokens(
    amountIn: string,
    amountOutMin: string,
    tokenIn: CoinListItem,
    tokenOut: CoinListItem,
    userAddress: string,
    slippageTolerance: number = 0.5
  ): Promise<string> {
    try {
      const swapConfig = getSwapContractConfig(this.chainId);
      const amountInWei = parseUnits(amountIn, tokenIn.decimals);
      const amountOutMinWei = parseUnits(amountOutMin, tokenOut.decimals);
      const deadline = getDeadline();
      
      // 构建交换路径 - 使用与getAmountsOut相同的逻辑
      let path: `0x${string}`[];
      
      // 检查是否需要通过WETH路由
      if (tokenIn.isNative || tokenOut.isNative) {
        // 涉及原生币时，直接路径
        path = [tokenIn.address, tokenOut.address] as `0x${string}`[];
      } else {
        // 代币到代币可能需要通过WETH路由
        // 首先尝试直接路径
        path = [tokenIn.address, tokenOut.address] as `0x${string}`[];
      }
      
      console.log('Executing swap:', {
        amountIn: `${amountIn} ${tokenIn.symbol}`,
        amountInWei: amountInWei.toString(),
        amountOutMin: `${amountOutMin} ${tokenOut.symbol}`,
        amountOutMinWei: amountOutMinWei.toString(),
        path,
        deadline,
        userAddress
      });

      // 根据代币类型选择不同的交换函数
      let txHash: string;
      
      if (tokenIn.isNative) {
        // ETH换代币
        console.log('Swapping ETH for tokens');
        txHash = await writeContract(config, {
          address: swapConfig.address,
          abi: swapConfig.abi,
          functionName: SWAP_FUNCTIONS.SWAP_EXACT_ETH_FOR_TOKENS,
          args: [amountOutMinWei, path, userAddress as `0x${string}`, BigInt(deadline)],
          value: amountInWei,
          chainId: this.chainId,
        });
      } else if (tokenOut.isNative) {
        // 代币换ETH
        console.log('Swapping tokens for ETH');
        txHash = await writeContract(config, {
          address: swapConfig.address,
          abi: swapConfig.abi,
          functionName: SWAP_FUNCTIONS.SWAP_EXACT_TOKENS_FOR_ETH,
          args: [amountInWei, amountOutMinWei, path, userAddress as `0x${string}`, BigInt(deadline)],
          chainId: this.chainId,
        });
      } else {
        // 代币换代币
        console.log('Swapping tokens for tokens');
        txHash = await writeContract(config, {
          address: swapConfig.address,
          abi: swapConfig.abi,
          functionName: SWAP_FUNCTIONS.SWAP_EXACT_TOKENS_FOR_TOKENS,
          args: [amountInWei, amountOutMinWei, path, userAddress as `0x${string}`, BigInt(deadline)],
          chainId: this.chainId,
        });
      }

      console.log('Swap transaction hash:', txHash);
      return txHash;
    } catch (error: any) {
      console.error('Error executing swap - Full details:', {
        error,
        message: error?.message,
        code: error?.code,
        reason: error?.reason,
        details: error?.details,
        data: error?.data
      });
      
      // 确保错误被正确抛出
      throw new Error(error?.reason || error?.message || 'Swap transaction failed');
    }
  }

  // 检查代币授权
  async checkTokenAllowance(tokenAddress: string, userAddress: string): Promise<string> {
    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
      return '0'; // 原生代币不需要授权
    }

    try {
      const swapConfig = getSwapContractConfig(this.chainId);
      
      const allowance = await readContract(config, {
        address: tokenAddress as `0x${string}`,
        abi: parseAbi(['function allowance(address owner, address spender) view returns (uint256)']),
        functionName: 'allowance',
        args: [userAddress as `0x${string}`, swapConfig.address],
        chainId: this.chainId,
      }) as bigint;

      return allowance.toString();
    } catch (error) {
      console.error('Error checking token allowance:', error);
      return '0';
    }
  }

  // 授权代币
  async approveToken(tokenAddress: string, tokenDecimals: number = 18, amount?: string): Promise<string> {
    try {
      const swapConfig = getSwapContractConfig(this.chainId);
      
      // 默认授权无限大，如果指定了具体数量则使用具体数量
      const approveAmount = amount 
        ? parseUnits(amount, tokenDecimals)
        : BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'); // 2^256 - 1
      
      console.log('Approving token:', {
        tokenAddress,
        spender: swapConfig.address,
        amount: approveAmount.toString(),
        decimals: tokenDecimals
      });
      
      const txHash = await writeContract(config, {
        address: tokenAddress as `0x${string}`,
        abi: parseAbi(['function approve(address spender, uint256 amount) returns (bool)']),
        functionName: 'approve',
        args: [swapConfig.address, approveAmount],
        chainId: this.chainId,
      });

      console.log('Approve transaction hash:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  }

}

// 工厂函数
export const createSwapApi = (chainId: number) => {
  return new SwapApiService(chainId);
};