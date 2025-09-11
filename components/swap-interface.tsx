"use client";

import { FC, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@heroui/modal";
import { ArrowDownIcon } from "@/components/icons";

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: number;
  price: number;
}

const tokens: Token[] = [
  { symbol: "ETH", name: "Ethereum", icon: "🟦", balance: 2.5, price: 2800 },
  { symbol: "USDC", name: "USD Coin", icon: "💙", balance: 5000, price: 1 },
  { symbol: "USDT", name: "Tether USD", icon: "💚", balance: 3000, price: 1 },
  { symbol: "BTC", name: "Bitcoin", icon: "🟠", balance: 0.1, price: 65000 },
  { symbol: "BNB", name: "BNB", icon: "🟡", balance: 10, price: 400 },
];

export const SwapInterface: FC = () => {
  const [fromToken, setFromToken] = useState<Token>(tokens[0]);
  const [toToken, setToToken] = useState<Token>(tokens[1]);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [isSelectingFrom, setIsSelectingFrom] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const calculateSwapAmount = (amount: string, from: Token, to: Token) => {
    if (!amount || isNaN(Number(amount))) return "";
    const fromValue = Number(amount) * from.price;
    const toValue = fromValue / to.price;
    return toValue.toFixed(6);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setToAmount(calculateSwapAmount(value, fromToken, toToken));
  };

  const handleTokenSwap = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleTokenSelect = (token: Token) => {
    if (isSelectingFrom) {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    onClose();
  };

  const openTokenSelector = (isFrom: boolean) => {
    setIsSelectingFrom(isFrom);
    onOpen();
  };

  const getExchangeRate = () => {
    if (fromToken && toToken) {
      const rate = fromToken.price / toToken.price;
      return `1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`;
    }
    return "";
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="flex flex-col gap-2 pb-4 bg-gradient-to-r from-primary/5 to-secondary/5">
          <h2 className="text-xl font-semibold text-center">代币交换</h2>
          <p className="text-sm text-default-500 text-center">
            快速安全地交换您的数字资产
          </p>
        </CardHeader>

        <CardBody className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-default-600">支付</span>
              <span className="text-sm text-default-500">
                余额: {fromToken.balance} {fromToken.symbol}
              </span>
            </div>
            <Card className="bg-default-50 border border-default-200">
              <CardBody className="p-4">
                <div className="flex justify-between items-center">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onValueChange={handleFromAmountChange}
                    variant="flat"
                    className="flex-1"
                    classNames={{
                      input: "text-xl font-semibold",
                      inputWrapper: "border-none shadow-none bg-transparent"
                    }}
                  />
                  <Button
                    variant="flat"
                    onPress={() => openTokenSelector(true)}
                    className="ml-2 min-w-[120px] bg-background border border-default-300 hover:border-primary"
                  >
                    <span className="text-lg mr-2">{fromToken.icon}</span>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{fromToken.symbol}</span>
                    </div>
                  </Button>
                </div>
                {fromAmount && (
                  <div className="mt-2 text-sm text-default-500">
                    ≈ ${(Number(fromAmount) * fromToken.price).toFixed(2)}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              isIconOnly
              variant="bordered"
              onPress={handleTokenSwap}
              className="rotate-0 hover:rotate-180 transition-transform duration-300 bg-background border-2 border-primary/20 hover:border-primary/50 shadow-md"
            >
              <ArrowDownIcon size={20} />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-default-600">接收</span>
              <span className="text-sm text-default-500">
                余额: {toToken.balance} {toToken.symbol}
              </span>
            </div>
            <Card className="bg-default-50 border border-default-200">
              <CardBody className="p-4">
                <div className="flex justify-between items-center">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={toAmount}
                    isReadOnly
                    variant="flat"
                    className="flex-1"
                    classNames={{
                      input: "text-xl font-semibold",
                      inputWrapper: "border-none shadow-none bg-transparent"
                    }}
                  />
                  <Button
                    variant="flat"
                    onPress={() => openTokenSelector(false)}
                    className="ml-2 min-w-[120px] bg-background border border-default-300 hover:border-primary"
                  >
                    <span className="text-lg mr-2">{toToken.icon}</span>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{toToken.symbol}</span>
                    </div>
                  </Button>
                </div>
                {toAmount && (
                  <div className="mt-2 text-sm text-default-500">
                    ≈ ${(Number(toAmount) * toToken.price).toFixed(2)}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Exchange Rate */}
          {fromAmount && toAmount && (
            <div className="text-center">
              <Chip variant="flat" size="sm" className="bg-primary/10 text-primary">
                {getExchangeRate()}
              </Chip>
            </div>
          )}

          <Divider />

          {/* Swap Button */}
          <Button
            color="primary"
            size="lg"
            className="w-full font-semibold text-lg h-14 shadow-lg"
            isDisabled={!fromAmount || Number(fromAmount) === 0}
          >
            {!fromAmount || Number(fromAmount) === 0 
              ? "输入金额" 
              : `交换 ${fromToken.symbol} 到 ${toToken.symbol}`
            }
          </Button>
        </CardBody>
      </Card>

      {/* Token Selection Modal */}
      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          <ModalHeader>
            选择代币
          </ModalHeader>
          <ModalBody className="pb-6">
            <div className="space-y-2">
              {tokens.map((token) => (
                <Button
                  key={token.symbol}
                  variant="light"
                  onPress={() => handleTokenSelect(token)}
                  className="w-full justify-start p-4 h-auto"
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{token.icon}</span>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium">{token.symbol}</span>
                      <span className="text-sm text-default-500">{token.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm">{token.balance}</span>
                      <span className="text-xs text-default-500">
                        ${token.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};