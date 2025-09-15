import UniswapV2ABI from "@/abi/UniswapV2.json";

// Swap合约配置
export const SWAP_CONTRACT_CONFIG = {
    // 测试网合约地址
    testnet: {
        address: "0x73265ce577783A4Ae11cC4d58817a3b26B685863" as `0x${string}`,
        abi: UniswapV2ABI,
    },
    // 主网合约地址
    mainnet: {
        address: "0x3ab6F687F8C2EcA42f0Eb6dE5a8BF8deE077A7C2" as `0x${string}`,
        abi: UniswapV2ABI,
    },
} as const;

// 根据链ID获取swap合约配置
export const getSwapContractConfig = (chainId: number) => {
    // X Layer (196) 单独使用新地址，其它主网继续使用 mainnet 配置
    if (chainId === 196) {
        return {
            address: "0x236e11ce039cE0DD079cB356056C9127f65586F9" as `0x${string}`,
            abi: UniswapV2ABI,
        } as const;
    }

    // Morph测试网 (2810) 和 BSC测试网 (97) 使用测试网配置
    const isTestnet = chainId === 2810 || chainId === 97;
    return isTestnet ? SWAP_CONTRACT_CONFIG.testnet : SWAP_CONTRACT_CONFIG.mainnet;
};

// Swap合约函数名称常量
export const SWAP_FUNCTIONS = {
    // 获取输出数量
    GET_AMOUNTS_OUT: "getAmountsOut",
    GET_AMOUNTS_IN: "getAmountsIn",

    // 代币换代币
    SWAP_EXACT_TOKENS_FOR_TOKENS: "swapExactTokensForTokens",

    // ETH换代币
    SWAP_EXACT_ETH_FOR_TOKENS: "swapExactETHForTokens",

    // 代币换ETH
    SWAP_EXACT_TOKENS_FOR_ETH: "swapExactTokensForETH",

    // 获取单个输出数量
    GET_AMOUNT_OUT: "getAmountOut",
    GET_AMOUNT_IN: "getAmountIn",
} as const;

// 计算deadline (当前时间 + 20分钟)
export const getDeadline = () => {
    return Math.floor(Date.now() / 1000) + 60 * 20;
};
