'use client';
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useState } from "react";

import { siteConfig } from "@/config/site";
import { ThemeSettingsButton } from "@/components/theme-settings-button";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
  Logo,
} from "@/components/icons";

export const Navbar = () => {
  // 网络ID到本地图标的映射
  const chainLogoMap: Record<number, string> = {
    2818: '/morph.png',      // Morph 主网
    196: '/xlayer.png',      // X Layer 主网
    2810: '/morph.png',      // Morph Testnet（如有单独 testnet 图标可改）
    // 97: 不设置，bscTestnet 仍然用 chain.iconUrl
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <HeroUINavbar
      maxWidth="full"
      position="sticky"
      className="border-b border-default-200/50"
      classNames={{ wrapper: 'px-2' }}
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <div className="max-w-1440 mx-auto w-full flex justify-between items-center">
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <NavbarBrand as="li" className="gap-3 max-w-fit">
            <NextLink className="flex justify-start items-center gap-1" href="/">
              <Logo />
              <p className="font-bold text-inherit">SWAP</p>
            </NextLink>
          </NavbarBrand>
        </NavbarContent>

        {/* Desktop menu */}
        <NavbarContent
          className="hidden sm:flex basis-1/5 sm:basis-full"
          justify="end"
        >
          <NavbarItem className="hidden sm:flex gap-2">
            <ConnectButton />
            <ThemeSettingsButton />
          </NavbarItem>
        </NavbarContent>

        {/* Mobile header - 直接显示钱包和网络按钮，无 menu */}
        <NavbarContent className="sm:hidden basis-1 pl-4 gap-2" justify="end">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');
              return (
                <div className="flex items-center gap-2">
                  {/* 网络切换按钮，仅显示 logo */}
                  {connected && chain && (
                    <button
                      onClick={openChainModal}
                      className="flex items-center justify-center w-8 h-8 rounded-full border border-default-200 bg-default-100"
                      style={{ padding: 0 }}
                    >
                      <img
                        alt={chain.name ?? 'Chain icon'}
                        src={chainLogoMap[chain.id] || chain.iconUrl || '/vercel.svg'}
                        style={{ width: 24, height: 24, borderRadius: '50%' }}
                        onError={e => { e.currentTarget.src = chain.iconUrl || '/vercel.svg'; }}
                      />
                    </button>
                  )}
                  {/* 钱包连接/地址显示按钮 */}
                  {!connected ? (
                    <Button
                      onPress={openConnectModal}
                      color="primary"
                      className="px-3"
                      size="md"
                    >
                      连接钱包
                    </Button>
                  ) : (
                    <Button
                      onPress={openAccountModal}
                      variant="flat"
                      className="px-3 font-mono"
                      size="md"
                    >
                      {account.address.slice(0, 4)}...{account.address.slice(-4)}
                    </Button>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
          <ThemeSettingsButton />
        </NavbarContent>
      </div>

  {/* 移除移动端菜单，直接在 header 显示钱包和网络按钮 */}
    </HeroUINavbar>
  );
};
