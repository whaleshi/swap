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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <HeroUINavbar
      maxWidth="full"
      position="sticky"
      className="border-b border-default-200/50"
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

        {/* Mobile menu - only show theme settings button, wallet goes in menu */}
        <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
          <ThemeSettingsButton />
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />
        </NavbarContent>
      </div>

      {/* Mobile Menu */}
      <NavbarMenu>
        <div className="mt-2 flex flex-col gap-2">
          <NavbarMenuItem>
            <div className="w-full">
              <p className="text-sm font-medium text-default-600 mb-2">钱包连接</p>
              <div className="w-full">
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
                      <div className="flex flex-col gap-2 w-full">
                        {(() => {
                          if (!connected) {
                            return (
                              <Button
                                onPress={openConnectModal}
                                color="primary"
                                className="w-full justify-start"
                                size="md"
                              >
                                连接钱包
                              </Button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <Button
                                onPress={openChainModal}
                                color="warning"
                                className="w-full justify-start"
                                size="md"
                              >
                                切换网络
                              </Button>
                            );
                          }

                          return (
                            <div className="flex flex-col gap-2 w-full">
                              <Button
                                onPress={openChainModal}
                                variant="flat"
                                className="w-full justify-start"
                                size="md"
                                startContent={
                                  chain.hasIcon && (
                                    <div
                                      style={{
                                        background: chain.iconBackground,
                                        width: 20,
                                        height: 20,
                                        borderRadius: 999,
                                        overflow: 'hidden',
                                        marginRight: 4,
                                      }}
                                    >
                                      {chain.iconUrl && (
                                        <img
                                          alt={chain.name ?? 'Chain icon'}
                                          src={chain.iconUrl}
                                          style={{ width: 20, height: 20 }}
                                        />
                                      )}
                                    </div>
                                  )
                                }
                              >
                                {chain.name}
                              </Button>
                              <Button
                                onPress={openAccountModal}
                                variant="flat"
                                className="w-full justify-start"
                                size="md"
                              >
                                {account.displayName}
                                <span className="text-xs text-default-400 ml-2">
                                  {account.displayBalance ? ` (${account.displayBalance})` : ''}
                                </span>
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
