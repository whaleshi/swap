"use client";

import { FC, useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@heroui/modal";
import { ArrowDownIcon } from "@/components/icons";
import { useAccount, useChainId } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/config/wagmi';
import { getNetworkInfo, getNetworkTokens, isTestnet, supportsSwap, getApiEndpoint } from '@/config/networks';
import { createSwapApi, SwapApiService } from '@/services/api';
import toast from 'react-hot-toast';

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: number;
  price: number;
  address?: string;
  decimals: number;
  isNative: boolean;
}

interface ModernSwapInterfaceProps {
  onToggleChart?: () => void;
  onRefreshData?: () => void;
}

export const ModernSwapInterface: FC<ModernSwapInterfaceProps> = ({
  onToggleChart,
  onRefreshData
}) => {
  const { isConnected, address } = useAccount();
  const walletChainId = useChainId();
  // 如果钱包未连接，默认使用Morph测试网
  const chainId = isConnected ? walletChainId : 2810; // 2810 是 Morph Testnet
  const [tokens, setTokens] = useState<Token[]>([]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [isSelectingFrom, setIsSelectingFrom] = useState(false);
  const [slippage, setSlippage] = useState<number>(5.0);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [swapApi, setSwapApi] = useState<SwapApiService | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [lastQuoteTime, setLastQuoteTime] = useState<number>(0);
  const [, forceUpdate] = useState({});

  // 更新选中代币的余额
  const updateTokenBalances = async (fromToken: Token | null, toToken: Token | null) => {
    if (!address || !isConnected || !swapApi) return;

    try {
      const promises = [];
      
      if (fromToken) {
        promises.push(
          swapApi.getTokenBalance(address, fromToken).then(balance => {
            setFromToken(prev => prev ? { ...prev, balance } : null);
            console.log(`Updated fromToken balance for ${fromToken.symbol}: ${balance}`);
          })
        );
      }
      
      if (toToken) {
        promises.push(
          swapApi.getTokenBalance(address, toToken).then(balance => {
            setToToken(prev => prev ? { ...prev, balance } : null);
            console.log(`Updated toToken balance for ${toToken.symbol}: ${balance}`);
          })
        );
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error updating token balances:', error);
    }
  };

  // 初始化API服务
  useEffect(() => {
    if (chainId) {
      const api = createSwapApi(chainId);
      setSwapApi(api);
    }
  }, [chainId]);

  // 根据当前网络加载代币
  useEffect(() => {
    if (chainId && swapApi) {
      const loadTokensAndPrices = async () => {
        try {
          // 从API获取代币列表
          const coinList = await swapApi.getCoinList();
          
          console.log('Component received coinList:', coinList);
          console.log('CoinList length:', coinList.length);
          
          if (coinList.length === 0) {
            // 如果API没有返回代币，使用静态配置
            const networkTokens = getNetworkTokens(chainId);
            const tokenSymbols = Object.keys(networkTokens);
            
            const tokenList: Token[] = Object.values(networkTokens).map(token => ({
              ...token,
              balance: Math.random() * 1000,
              price: token.isNative ? (token.symbol === 'ETH' ? 2800 : token.symbol === 'OKB' ? 45 : 400) : 1,
            }));
            
            setTokens(tokenList);
            
            if (tokenList.length >= 2) {
              setFromToken(tokenList[0]);
              setToToken(tokenList[1]);
              
              // 如果钱包已连接，更新初始代币余额
              if (address && isConnected && swapApi) {
                updateTokenBalances(tokenList[0], tokenList[1]);
              }
            } else if (tokenList.length === 1) {
              setFromToken(tokenList[0]);
              setToToken(null);
              
              // 如果钱包已连接，更新初始代币余额
              if (address && isConnected && swapApi) {
                updateTokenBalances(tokenList[0], null);
              }
            }
            return;
          }

          // 构建代币列表
          let tokenList: Token[] = coinList.map(coin => {
            return {
              symbol: coin.symbol,
              name: coin.name,
              icon: coin.icon || (coin.isNative ? '🔷' : '💎'),
              balance: 0, // 初始化为0，稍后读取真实余额
              price: coin.price || (coin.isNative ? 2800 : 1), // 使用API价格
              address: coin.address,
              decimals: coin.decimals,
              isNative: coin.isNative || false,
            };
          });

          console.log('Constructed tokenList:', tokenList);
          console.log('Setting tokens to:', tokenList);

          // 暂时移除余额读取功能
          // if (address && isConnected && swapApi) {
          //   console.log('Reading token balances for address:', address);
          //   const tokensWithBalances = await swapApi.getTokenBalances(address, tokenList);
          //   tokenList = tokensWithBalances.map(coin => ({
          //     symbol: coin.symbol,
          //     name: coin.name,
          //     icon: coin.icon || (coin.isNative ? '🔷' : '💎'),
          //     balance: coin.balance || 0,
          //     price: coin.price || (coin.isNative ? 2800 : 1),
          //     address: coin.address,
          //     decimals: coin.decimals,
          //     isNative: coin.isNative || false,
          //   }));
          //   console.log('Tokens with balances:', tokenList);
          // }
          
          setTokens(tokenList);
          setAllTokens(tokenList);
          setFilteredTokens(tokenList);
          
          // 设置默认代币
          if (tokenList.length >= 2) {
            setFromToken(tokenList[0]);
            setToToken(tokenList[1]);
            
            // 如果钱包已连接，更新初始代币余额
            if (address && isConnected && swapApi) {
              updateTokenBalances(tokenList[0], tokenList[1]);
            }
          } else if (tokenList.length === 1) {
            setFromToken(tokenList[0]);
            setToToken(null);
            
            // 如果钱包已连接，更新初始代币余额
            if (address && isConnected && swapApi) {
              updateTokenBalances(tokenList[0], null);
            }
          }
        } catch (error) {
          console.error('Error loading tokens:', error);
          // 出错时使用静态配置
          const networkTokens = getNetworkTokens(chainId);
          const tokenList: Token[] = Object.values(networkTokens).map(token => ({
            ...token,
            balance: Math.random() * 1000,
            price: token.isNative ? (token.symbol === 'ETH' ? 2800 : 400) : 1,
          }));
          
          setTokens(tokenList);
          setAllTokens(tokenList);
          setFilteredTokens(tokenList);
        }
      };

      loadTokensAndPrices();
    }
  }, [chainId, swapApi, address, isConnected]);

  // 监听钱包连接状态变化，更新当前选中代币余额
  useEffect(() => {
    if (address && isConnected && swapApi && (fromToken || toToken)) {
      updateTokenBalances(fromToken, toToken);
    }
  }, [address, isConnected, swapApi]);

  // 定时自动刷新报价 - 每10秒刷新一次
  useEffect(() => {
    if (!fromAmount || !fromToken || !toToken) return;

    const interval = setInterval(() => {
      console.log('Auto refreshing quote...');
      refreshQuote();
    }, 10000); // 10秒刷新一次

    return () => clearInterval(interval);
  }, [fromAmount, fromToken, toToken, swapApi]);

  // 定时更新报价时间显示 - 每秒更新一次
  useEffect(() => {
    if (!lastQuoteTime) return;

    const interval = setInterval(() => {
      // 强制重新渲染来更新时间显示
      forceUpdate({}); 
    }, 1000);

    return () => clearInterval(interval);
  }, [lastQuoteTime]);

  // 搜索代币（结合交换规则）
  useEffect(() => {
    // 获取基于交换规则的可用代币
    const availableTokens = getAvailableTokens(isSelectingFrom, fromToken, toToken);
    
    if (!searchKeyword) {
      setFilteredTokens(availableTokens);
    } else {
      const filtered = availableTokens.filter(token => 
        token.symbol.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        token.name.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      setFilteredTokens(filtered);
    }
  }, [searchKeyword, allTokens, isSelectingFrom, fromToken, toToken]);

  // 获取当前网络信息
  const networkInfo = chainId ? getNetworkInfo(chainId) : null;

  const calculateSwapAmount = async (amount: string, from: Token | null, to: Token | null): Promise<string> => {
    if (!amount || isNaN(Number(amount)) || !from || !to || !swapApi) return "";
    
    try {
      // 使用合约获取真实报价
      const amounts = await swapApi.getAmountsOut(amount, from, to);
      if (amounts.length >= 2) {
        setLastQuoteTime(Date.now()); // 更新最后报价时间
        return Number(amounts[1]).toFixed(6);
      }
    } catch (error) {
      console.error('Error getting swap quote:', error);
    }
    
    // 回退到简单价格计算
    const fromValue = Number(amount) * from.price;
    const toValue = fromValue / to.price;
    return toValue.toFixed(6);
  };

  // 自动刷新报价
  const refreshQuote = async () => {
    if (fromAmount && fromToken && toToken && swapApi) {
      try {
        const quote = await calculateSwapAmount(fromAmount, fromToken, toToken);
        if (quote && quote !== "0.000000") {
          setToAmount(quote);
        }
      } catch (error) {
        console.error('Error refreshing quote:', error);
      }
    }
  };

  const handleFromAmountChange = async (value: string) => {
    // 只允许正数和小数
    if (value === "" || (/^\d*\.?\d*$/.test(value) && Number(value) >= 0)) {
      setFromAmount(value);
      if (value) {
        const result = await calculateSwapAmount(value, fromToken, toToken);
        setToAmount(result);
      } else {
        setToAmount("");
      }
    }
  };

  const handleToAmountChange = async (value: string) => {
    // 只允许正数和小数
    if (value === "" || (/^\d*\.?\d*$/.test(value) && Number(value) >= 0)) {
      setToAmount(value);
      if (value) {
        // 反向计算from数量
        const result = await calculateSwapAmount(value, toToken, fromToken);
        setFromAmount(result);
      } else {
        setFromAmount("");
      }
    }
  };

  const handleTokenSwap = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleTokenSelect = async (token: Token) => {
    if (isSelectingFrom) {
      setFromToken(token);
      // 如果钱包已连接，更新余额
      if (address && isConnected && swapApi) {
        try {
          const apiToken = { ...token, balance: token.balance };
          const balance = await swapApi.getTokenBalance(address, apiToken);
          setFromToken({ ...token, balance });
          console.log(`Updated fromToken balance for ${token.symbol}: ${balance}`);
        } catch (error) {
          console.error('Error updating fromToken balance:', error);
        }
      }
    } else {
      setToToken(token);
      // 如果钱包已连接，更新余额  
      if (address && isConnected && swapApi) {
        try {
          const apiToken = { ...token, balance: token.balance };
          const balance = await swapApi.getTokenBalance(address, apiToken);
          setToToken({ ...token, balance });
          console.log(`Updated toToken balance for ${token.symbol}: ${balance}`);
        } catch (error) {
          console.error('Error updating toToken balance:', error);
        }
      }
    }
    onClose();
  };

  // 根据交换规则筛选可用代币
  const getAvailableTokens = (isSelectingFrom: boolean, currentFromToken: Token | null, currentToToken: Token | null): Token[] => {
    if (isSelectingFrom) {
      // 选择from代币时，如果to侧没有选择代币，显示所有代币
      if (!currentToToken) {
        return allTokens;
      }
      
      // 如果to侧有代币，根据to代币筛选from可选项
      if (currentToToken.symbol.toLowerCase() === 'bgb') {
        // 如果to是BGB，from只能选择M
        return allTokens.filter(token => token.symbol.toLowerCase() === 'm');
      } else if (currentToToken.symbol.toLowerCase() === 'm') {
        // 如果to是M，from可以选择所有其他代币（但不能选M）
        return allTokens.filter(token => token.symbol.toLowerCase() !== 'm');
      } else {
        // 如果to是其他代币，from只能选择M
        return allTokens.filter(token => token.symbol.toLowerCase() === 'm');
      }
    } else {
      // 选择to代币时，如果from侧没有选择代币，显示所有代币
      if (!currentFromToken) {
        return allTokens;
      }
      
      // 如果from侧有代币，根据from代币筛选to可选项
      if (currentFromToken.symbol.toLowerCase() === 'bgb') {
        // 如果from是BGB，to只能选择M
        return allTokens.filter(token => token.symbol.toLowerCase() === 'm');
      } else if (currentFromToken.symbol.toLowerCase() === 'm') {
        // 如果from是M，to可以选择所有其他代币（但不能选M）
        return allTokens.filter(token => token.symbol.toLowerCase() !== 'm');
      } else {
        // 如果from是其他代币，to只能选择M
        return allTokens.filter(token => token.symbol.toLowerCase() === 'm');
      }
    }
  };

  const openTokenSelector = (isFrom: boolean) => {
    setIsSelectingFrom(isFrom);
    setSearchKeyword(""); // 清空搜索
    
    // 根据交换规则更新可选代币列表
    const availableTokens = getAvailableTokens(isFrom, fromToken, toToken);
    setFilteredTokens(availableTokens);
    
    onOpen();
  };

  const getExchangeRate = () => {
    if (fromToken && toToken) {
      const rate = fromToken.price / toToken.price;
      return `1 ${fromToken.symbol} ≈ ${rate.toFixed(6)} ${toToken.symbol}`;
    }
    return "";
  };

  // 格式化报价时间
  const getQuoteAge = () => {
    if (!lastQuoteTime) return "";
    const now = Date.now();
    const ageInSeconds = Math.floor((now - lastQuoteTime) / 1000);
    
    if (ageInSeconds < 5) return "刚刚更新";
    if (ageInSeconds < 60) return `${ageInSeconds}秒前`;
    const ageInMinutes = Math.floor(ageInSeconds / 60);
    if (ageInMinutes < 60) return `${ageInMinutes}分钟前`;
    return "需要刷新";
  };

  // 刷新余额数据
  const refreshBalances = async () => {
    if (!address || !isConnected || !swapApi) return;

    try {
      setIsLoading(true);
      
      // 重新读取余额
      const tokensWithBalances = await swapApi.getTokenBalances(address, allTokens);
      const updatedTokens = tokensWithBalances.map(coin => ({
        symbol: coin.symbol,
        name: coin.name,
        icon: coin.icon || (coin.isNative ? '🔷' : '💎'),
        balance: coin.balance || 0,
        price: coin.price || (coin.isNative ? 2800 : 1),
        address: coin.address,
        decimals: coin.decimals,
        isNative: coin.isNative || false,
      }));

      setTokens(updatedTokens);
      setAllTokens(updatedTokens);
      setFilteredTokens(updatedTokens);

      // 更新当前选中的代币余额
      if (fromToken) {
        const updatedFromToken = updatedTokens.find(t => t.symbol === fromToken.symbol);
        if (updatedFromToken) setFromToken(updatedFromToken);
      }
      if (toToken) {
        const updatedToToken = updatedTokens.find(t => t.symbol === toToken.symbol);
        if (updatedToToken) setToToken(updatedToToken);
      }

      console.log("Balances refreshed");
    } catch (error) {
      console.error("Failed to refresh balances:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // 执行交换
  const handleSwap = async () => {
    // 检查是否连接钱包
    if (!isConnected || !address) {
      toast.error('❌ 请先连接钱包', {
        duration: 3000,
      });
      return;
    }

    if (!fromToken || !toToken || !fromAmount || !swapApi) {
      console.log('Missing required data for swap');
      toast.error('❌ 交换参数不完整', {
        duration: 3000,
      });
      return;
    }

    // 先获取最新余额
    console.log('Refreshing token balance before swap...');
    try {
      const latestBalance = await swapApi.getTokenBalance(address, fromToken);
      console.log(`Latest balance for ${fromToken.symbol}: ${latestBalance}`);
      
      // 更新fromToken余额
      setFromToken(prev => prev ? { ...prev, balance: latestBalance } : null);
      
      // 检查余额是否足够
      const requiredAmount = Number(fromAmount);
      const availableBalance = latestBalance;
      
      console.log('Balance check:', {
        requiredAmount,
        availableBalance,
        token: fromToken.symbol,
        hasSufficientBalance: availableBalance >= requiredAmount
      });

      if (availableBalance < requiredAmount) {
        toast.error(`❌ ${fromToken.symbol} 余额不足\n需要: ${requiredAmount.toFixed(4)}\n可用: ${availableBalance.toFixed(4)}`, {
          duration: 3000,
        });
        return;
      }
    } catch (balanceError) {
      console.error('Error checking balance:', balanceError);
      toast.error('❌ 无法获取余额信息，请重试', {
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // 显示开始交换的toast
      const swapToastId = toast.loading('正在准备交换...', {
        duration: Infinity,
      });
      
      // 验证代币地址
      if (!fromToken.address || !toToken.address) {
        toast.dismiss(swapToastId);
        throw new Error('代币地址无效');
      }

      console.log('Starting real swap:', {
        from: `${fromToken.symbol} (${fromToken.address})`,
        to: `${toToken.symbol} (${toToken.address})`,
        amount: fromAmount,
        slippage,
        userAddress: address
      });

      // 1. 检查是否需要授权（仅对ERC20代币）
      if (!fromToken.isNative) {
        toast.loading('检查代币授权...', {
          id: swapToastId,
        });
        
        console.log('Checking token allowance...');
        const allowance = await swapApi.checkTokenAllowance(fromToken.address!, address);
        const allowanceFormatted = Number(allowance) / Math.pow(10, fromToken.decimals);
        
        console.log(`Current allowance: ${allowanceFormatted}, Required: ${fromAmount}`);
        
        if (allowanceFormatted < Number(fromAmount)) {
          console.log('Insufficient allowance, requesting approval...');
          
          toast.loading('请求代币授权...', {
            id: swapToastId,
          });
          
          // 请求授权
          const approveTxHash = await swapApi.approveToken(fromToken.address!, fromToken.decimals);
          console.log('Approve transaction submitted:', approveTxHash);
          
          // 关闭loading toast
          toast.dismiss(swapToastId);
          
          // 显示授权交易提交的toast
          const shortApproveHash = `${approveTxHash.slice(0, 6)}...${approveTxHash.slice(-6)}`;
          toast.success(`授权交易已提交！\n交易哈希: ${shortApproveHash}`, {
            duration: 3000,
          });
          
          toast.loading('请等待授权交易确认后再次尝试交换...', {
            duration: 3000,
          });
          return;
        }
      }

      // 2. 计算最小输出数量（考虑滑点）
      toast.loading('获取交换报价...', {
        id: swapToastId,
      });
      
      console.log('Getting swap quote...');
      const amounts = await swapApi.getAmountsOut(fromAmount, fromToken, toToken);
      if (amounts.length < 2 || Number(amounts[1]) === 0) {
        toast.dismiss(swapToastId);
        throw new Error(`无法获取交换报价，可能没有足够的流动性或交易对不存在\n返回的数量: ${amounts.join(', ')}`);
      }
      
      const expectedOutput = amounts[1];
      // 增加额外的滑点buffer来确保交易成功
      const effectiveSlippage = slippage + 1; // 增加1%的buffer
      const minOutputWithSlippage = (Number(expectedOutput) * (1 - effectiveSlippage / 100)).toString();
      
      console.log(`Expected output: ${expectedOutput}, Min output with slippage: ${minOutputWithSlippage}`);
      console.log('Slippage calculation details:', {
        expectedOutputNumber: Number(expectedOutput),
        userSlippagePercent: slippage,
        effectiveSlippagePercent: effectiveSlippage,
        slippageFactor: (1 - effectiveSlippage / 100),
        minOutputCalculated: Number(expectedOutput) * (1 - effectiveSlippage / 100),
        minOutputWithSlippage
      });

      // 3. 执行交换
      toast.loading('正在提交交易...', {
        id: swapToastId,
      });
      
      console.log('Executing swap transaction...');
      
      // 打印swap参数
      console.log('=== Swap Parameters ===');
      console.log('From Token:', {
        symbol: fromToken.symbol,
        address: fromToken.address,
        decimals: fromToken.decimals,
        balance: fromToken.balance
      });
      console.log('To Token:', {
        symbol: toToken.symbol,
        address: toToken.address,
        decimals: toToken.decimals,
        balance: toToken.balance
      });
      console.log('Amount In:', fromAmount);
      console.log('Min Output (with slippage):', minOutputWithSlippage);
      console.log('Expected Output:', expectedOutput);
      console.log('User Address:', address);
      console.log('Slippage:', slippage + '%');
      console.log('Chain ID:', chainId);
      console.log('======================');

      let swapTxHash: string;
      try {
        swapTxHash = await swapApi.swapTokens(
          fromAmount,
          minOutputWithSlippage,
          fromToken,
          toToken,
          address,
          slippage
        );
        console.log('Swap transaction submitted:', swapTxHash);
      } catch (swapError: any) {
        console.error('Swap transaction failed:', swapError);
        
        // 关闭loading toast
        toast.dismiss(swapToastId);
        
        // 抛出错误到外层catch处理
        throw swapError;
      }
      
      // 关闭loading toast
      toast.dismiss(swapToastId);
      
      // 显示交易提交成功的toast
      const shortSwapHash = `${swapTxHash.slice(0, 6)}...${swapTxHash.slice(-6)}`;
      toast.success(`交换交易已提交！\n交易哈希: ${shortSwapHash}`, {
        duration: 3000,
      });
      
      // 显示等待确认的loading toast
      const confirmToastId = toast.loading('等待交易确认中...', {
        duration: Infinity, // 不自动消失，等待交易确认
      });
      
      // 4. 等待交易确认
      try {
        console.log('Waiting for transaction confirmation...');
        const receipt = await waitForTransactionReceipt(config, {
          hash: swapTxHash as `0x${string}`,
          chainId: chainId,
        });
        
        // 关闭等待确认的toast
        toast.dismiss(confirmToastId);
        
        console.log('Transaction confirmed:', receipt);
        
        if (receipt.status === 'success') {
          toast.success(`🎉 交换成功！\n交易哈希: ${shortSwapHash}`, {
            duration: 3000,
          });
          
          // 更新余额
          if (fromToken && toToken) {
            updateTokenBalances(fromToken, toToken);
          }
        } else {
          toast.error(`❌ 交易失败\n交易哈希: ${shortSwapHash}`, {
            duration: 3000,
          });
        }
      } catch (confirmError: any) {
        // 关闭等待确认的toast
        toast.dismiss(confirmToastId);
        
        console.error('Transaction confirmation failed:', confirmError);
        toast.error(`⚠️ 交易确认超时或失败\n交易哈希: ${shortSwapHash}\n请手动检查交易状态`, {
          duration: 3000,
        });
      }
      
      // 清空输入
      setFromAmount("");
      setToAmount("");
      
      console.log('Swap process completed');
    } catch (error: any) {
      console.error('Swap failed - Full error:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      console.error('Error code:', error?.code);
      console.error('Error reason:', error?.reason);
      
      // 关闭可能存在的loading toast
      toast.dismiss();
      
      // 显示用户友好的错误消息
      let errorMessage = '交换失败';
      let toastType: 'error' | 'warning' = 'error';
      
      const errorStr = String(error?.message || error?.reason || error || '').toLowerCase();
      
      if (errorStr.includes('user rejected') || errorStr.includes('user denied') || errorStr.includes('rejected')) {
        errorMessage = '用户取消了交易';
        toastType = 'warning';
      } else if (errorStr.includes('insufficient funds') || errorStr.includes('insufficient balance')) {
        errorMessage = '余额不足';
      } else if (errorStr.includes('slippage') || errorStr.includes('price impact') || errorStr.includes('insufficient_output_amount')) {
        errorMessage = '滑点过高，请增加滑点设置或减少交易金额';
      } else if (errorStr.includes('流动性') || errorStr.includes('liquidity')) {
        errorMessage = '交易对流动性不足';
      } else if (errorStr.includes('gas') || errorStr.includes('fee')) {
        errorMessage = 'Gas费用不足';
      } else if (errorStr.includes('allowance') || errorStr.includes('approval')) {
        errorMessage = '代币授权不足，请重新授权';
      } else if (errorStr.includes('deadline')) {
        errorMessage = '交易超时，请重试';
      }
      
      console.log('Showing error toast:', errorMessage);
      
      if (toastType === 'error') {
        toast.error(`❌ ${errorMessage}${error?.message ? `\n详细: ${error.message.substring(0, 80)}...` : ''}`, {
          duration: 3000,
        });
      } else {
        toast(`⚠️ ${errorMessage}`, {
          duration: 3000,
          style: {
            background: 'rgb(255, 243, 205)',
            color: 'rgb(180, 83, 9)',
            border: '1px solid rgb(251, 191, 36)',
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


  // 如果网络不支持，显示网络切换提示
  if (!networkInfo) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-background/60 backdrop-blur-xl border border-default-200/50 shadow-2xl">
          <CardBody className="p-8 text-center">
            <div className="mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto text-warning">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">不支持的网络</h3>
            <p className="text-default-500 mb-4">请切换到支持的网络：Morph、X Layer 或测试网</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // 如果网络不支持交换功能
  if (networkInfo && !supportsSwap(chainId)) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-background/60 backdrop-blur-xl border border-default-200/50 shadow-2xl">
          <CardBody className="p-8 text-center">
            <div className="mb-4">
              <span className="text-6xl">{networkInfo.icon}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{networkInfo.name}</h3>
            <p className="text-default-500 mb-4">该网络暂不支持交换功能</p>
            <p className="text-sm text-default-400">
              请切换到 Morph 主网或 Morph 测试网以使用交换功能
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Swap</h1>
            {networkInfo && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm">{networkInfo.icon}</span>
                <span className="text-sm text-default-600">{networkInfo.name}</span>
                {networkInfo.isTestnet && (
                  <Chip size="sm" variant="flat" color="warning" className="text-xs">测试网</Chip>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={onToggleChart}
              className="bg-default-100 hover:bg-default-200 border border-default-300 hover:border-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 12l4-4 4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={refreshBalances}
              isLoading={isLoading}
              className="bg-default-100 hover:bg-default-200 border border-default-300 hover:border-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M23 4v6l-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              onPress={() => setShowSlippageSettings(!showSlippageSettings)}
              className="bg-default-100 hover:bg-default-200 border border-default-300 hover:border-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </Button>
          </div>
        </div>

        {/* Slippage Settings Panel */}
        {showSlippageSettings && (
          <Card className="mb-4 bg-background/60 backdrop-blur-xl border border-default-200/50">
            <CardBody className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">滑点设置</h3>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setShowSlippageSettings(false)}
                  className="text-default-400 hover:text-default-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={slippage === 3.0 ? "solid" : "flat"}
                    color={slippage === 3.0 ? "primary" : "default"}
                    onPress={() => setSlippage(3.0)}
                    className="flex-1"
                  >
                    3%
                  </Button>
                  <Button
                    size="sm"
                    variant={slippage === 5.0 ? "solid" : "flat"}
                    color={slippage === 5.0 ? "primary" : "default"}
                    onPress={() => setSlippage(5.0)}
                    className="flex-1"
                  >
                    5%
                  </Button>
                  <Button
                    size="sm"
                    variant={slippage === 10.0 ? "solid" : "flat"}
                    color={slippage === 10.0 ? "primary" : "default"}
                    onPress={() => setSlippage(10.0)}
                    className="flex-1"
                  >
                    10%
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-600 whitespace-nowrap">自定义:</span>
                  <Input
                    type="number"
                    placeholder="1.0"
                    value={![3.0, 5.0, 10.0].includes(slippage) ? slippage.toString() : ""}
                    onValueChange={(value) => {
                      const numValue = Number(value);
                      if (value === "" || (numValue >= 0 && numValue <= 50)) {
                        setSlippage(numValue || 5.0);
                      }
                    }}
                    size="sm"
                    min="0"
                    max="50"
                    step="0.1"
                    endContent={<span className="text-xs text-default-400">%</span>}
                    classNames={{
                      input: "text-sm",
                      inputWrapper: "h-8"
                    }}
                  />
                </div>
                
                <div className="h-6 flex items-center">
                  {slippage > 5 && (
                    <div className="text-xs text-warning flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      高滑点可能导致不利交易
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Swap Card */}
        <Card className="bg-background/60 backdrop-blur-xl border border-default-200/50 shadow-2xl">
          <CardBody className="p-6 space-y-1">
            
            {/* From Token */}
            <div className="relative">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-default-600">From</span>
                <span className="text-xs text-default-400">
                  Balance: {!isConnected ? '-' : (fromToken?.balance.toFixed(4) || '0.0000')} {fromToken?.symbol || ''}
                </span>
              </div>
              
              <div className="bg-default-100/50 backdrop-blur-sm rounded-2xl p-4 border border-default-200/30">
                <div className="flex items-start gap-3">
                  <Button
                    variant="flat"
                    onPress={() => openTokenSelector(true)}
                    className="bg-background/80 backdrop-blur-sm border border-default-300/50 hover:border-primary transition-all duration-200 min-w-[80px] h-10 shrink-0 mt-1"
                    isDisabled={!fromToken}
                  >
                    <div className="flex items-center gap-1.5">
                      {fromToken?.icon ? (
                        fromToken.icon.startsWith('http') || fromToken.icon.startsWith('/') ? (
                          <img 
                            src={fromToken.icon} 
                            alt={fromToken.symbol}
                            className="w-5 h-5 rounded-full object-cover"
                            onError={(e) => {
                              console.log('Image failed to load:', fromToken.icon);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.style.display = 'block';
                            }}
                          />
                        ) : (
                          <span className="text-base">{fromToken.icon}</span>
                        )
                      ) : (
                        <span className="text-base">?</span>
                      )}
                      <span className="text-base hidden">💎</span>
                      <div className="font-semibold text-xs">{fromToken?.symbol || 'Select'}</div>
                    </div>
                  </Button>
                  
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={fromAmount}
                      onValueChange={handleFromAmountChange}
                      variant="flat"
                      min="0"
                      step="any"
                      classNames={{
                        input: "text-2xl font-bold placeholder:text-default-300 bg-transparent caret-primary text-right leading-tight",
                        inputWrapper: "bg-transparent border-none shadow-none p-0 h-auto hover:bg-transparent focus:bg-transparent data-[hover=true]:bg-transparent"
                      }}
                    />
                    {fromAmount && fromToken && (
                      <div className="text-sm text-default-400 mt-0.5 text-right">
                        ≈ ${(Number(fromAmount) * fromToken.price).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 快捷输入按钮 */}
                {fromToken && isConnected && (
                  <div className="flex gap-2 mt-3 justify-end">
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleFromAmountChange((fromToken.balance * 0.25).toString())}
                      className="bg-default-200/50 hover:bg-primary/20 text-xs min-w-0 px-3 h-7"
                    >
                      25%
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleFromAmountChange((fromToken.balance * 0.5).toString())}
                      className="bg-default-200/50 hover:bg-primary/20 text-xs min-w-0 px-3 h-7"
                    >
                      50%
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleFromAmountChange((fromToken.balance * 0.75).toString())}
                      className="bg-default-200/50 hover:bg-primary/20 text-xs min-w-0 px-3 h-7"
                    >
                      75%
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleFromAmountChange(fromToken.balance.toString())}
                      className="bg-default-200/50 hover:bg-primary/20 text-xs min-w-0 px-3 h-7"
                    >
                      MAX
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center py-2">
              <Button
                isIconOnly
                variant="flat"
                onPress={handleTokenSwap}
                className="bg-default-100/50 hover:bg-default-200 border border-default-300/50 hover:border-default-400 transition-all duration-300 hover:scale-105 hover:rotate-90 w-12 h-12 rounded-full group"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-default-600 group-hover:text-primary transition-all duration-300">
                  <path d="M8 3L4 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 21l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 17H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>

            {/* To Token */}
            <div className="relative">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-default-600">To</span>
                <span className="text-xs text-default-400">
                  Balance: {!isConnected ? '-' : (toToken?.balance.toFixed(4) || '0.0000')} {toToken?.symbol || ''}
                </span>
              </div>
              
              <div className="bg-default-100/50 backdrop-blur-sm rounded-2xl p-4 border border-default-200/30">
                <div className="flex items-start gap-3">
                  <Button
                    variant="flat"
                    onPress={() => openTokenSelector(false)}
                    className="bg-background/80 backdrop-blur-sm border border-default-300/50 hover:border-primary transition-all duration-200 min-w-[80px] h-10 shrink-0 mt-1"
                    isDisabled={!toToken}
                  >
                    <div className="flex items-center gap-1.5">
                      {toToken?.icon ? (
                        toToken.icon.startsWith('http') || toToken.icon.startsWith('/') ? (
                          <img 
                            src={toToken.icon} 
                            alt={toToken.symbol}
                            className="w-5 h-5 rounded-full object-cover"
                            onError={(e) => {
                              console.log('Image failed to load:', toToken.icon);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.style.display = 'block';
                            }}
                          />
                        ) : (
                          <span className="text-base">{toToken.icon}</span>
                        )
                      ) : (
                        <span className="text-base">?</span>
                      )}
                      <span className="text-base hidden">💎</span>
                      <div className="font-semibold text-xs">{toToken?.symbol || 'Select'}</div>
                    </div>
                  </Button>
                  
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={toAmount}
                      onValueChange={handleToAmountChange}
                      variant="flat"
                      min="0"
                      step="any"
                      classNames={{
                        input: "text-2xl font-bold placeholder:text-default-300 bg-transparent caret-primary text-right leading-tight",
                        inputWrapper: "bg-transparent border-none shadow-none p-0 h-auto hover:bg-transparent focus:bg-transparent data-[hover=true]:bg-transparent"
                      }}
                    />
                    {toAmount && toToken && (
                      <div className="text-sm text-default-400 mt-0.5 text-right">
                        ≈ ${(Number(toAmount) * toToken.price).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Exchange Rate */}
            {fromAmount && toAmount && (
              <div className="flex justify-center py-3">
                <Chip 
                  variant="flat" 
                  size="sm" 
                  className="bg-default-100 text-primary border border-default-300"
                >
                  {getExchangeRate()}
                </Chip>
              </div>
            )}

            {/* Swap Action Button */}
            <div className="pt-4">
              <Button
                color="primary"
                size="lg"
                className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                isDisabled={(!isConnected && fromAmount && fromToken && toToken) ? false : (!fromAmount || Number(fromAmount) === 0 || !fromToken || !toToken || isLoading)}
                isLoading={isLoading}
                onPress={handleSwap}
              >
                {isLoading
                  ? "Processing..."
                  : !isConnected
                  ? "连接钱包"
                  : !fromToken || !toToken
                  ? "选择代币"
                  : !fromAmount || Number(fromAmount) === 0 
                  ? "输入数量" 
                  : `交换 ${fromToken.symbol} → ${toToken.symbol}`
                }
              </Button>
              
            </div>

            {/* Additional Info */}
            {fromAmount && toAmount && fromToken && toToken && (
              <div className="pt-4 space-y-2 text-xs text-default-500">
                <div className="flex justify-between">
                  <span>Price Impact</span>
                  <span className="text-success">{'<'}0.01%</span>
                </div>
                <div className="flex justify-between">
                  <span>Minimum received</span>
                  <span>{(Number(toAmount) * (1 - slippage / 100)).toFixed(6)} {toToken.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Slippage tolerance</span>
                  <span>{slippage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Network fee</span>
                  <span>~${networkInfo?.isTestnet ? '0.01' : '2.50'}</span>
                </div>
                {lastQuoteTime > 0 && (
                  <div className="flex justify-between">
                    <span>报价更新</span>
                    <span className={lastQuoteTime && (Date.now() - lastQuoteTime) > 30000 ? "text-warning" : "text-success"}>
                      {getQuoteAge()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Token Selection Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        placement="center"
        classNames={{
          base: "bg-background/95 backdrop-blur-xl",
          backdrop: "bg-black/50 backdrop-blur-sm"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Select a token</h3>
            <p className="text-sm text-default-500">Choose from the list below</p>
          </ModalHeader>
          <ModalBody className="pb-6">
            {/* 搜索框 */}
            <div className="mb-4">
              <Input
                placeholder="Search by name or symbol"
                value={searchKeyword}
                onValueChange={setSearchKeyword}
                variant="bordered"
                startContent={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-default-400">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                classNames={{
                  input: "text-sm",
                  inputWrapper: "h-10"
                }}
              />
            </div>
            
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredTokens.map((token) => (
                <Button
                  key={token.symbol}
                  variant="light"
                  onPress={() => handleTokenSelect(token)}
                  className="w-full justify-start p-4 h-auto hover:bg-default-100/80 transition-colors"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {token.icon ? (
                        token.icon.startsWith('http') || token.icon.startsWith('/') ? (
                          <img 
                            src={token.icon} 
                            alt={token.symbol}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              console.log('Image failed to load:', token.icon);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.style.display = 'block';
                            }}
                          />
                        ) : (
                          <span className="text-2xl">{token.icon}</span>
                        )
                      ) : (
                        <span className="text-2xl">💎</span>
                      )}
                      <span className="text-2xl hidden">💎</span>
                    </div>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-semibold text-base">{token.symbol}</span>
                      <span className="text-sm text-default-500">{token.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-medium">{!isConnected ? '-' : token.balance.toFixed(4)}</span>
                      <span className="text-sm text-default-500">
                        ${token.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Button>
              ))}
              
              {filteredTokens.length === 0 && (
                <div className="text-center py-8 text-default-500">
                  <div className="mb-2">😔</div>
                  <p>No tokens found</p>
                  <p className="text-sm">Try adjusting your search</p>
                </div>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};