import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, type MouseEventHandler, type PropsWithChildren, Fragment } from "react";

import { shorten } from "@/utils/formatter";

import { Button } from "./Button";
import { ConnectedButton } from "./ConnectedButton";
import OpenMenuIcon from "./icons/OpenMenuIcon";

const NavItem: React.FC<
  PropsWithChildren<{
    className?: string;
    href: string;
    active?: boolean;
    external?: boolean;
  }>
> = ({ className, href, active, external, children }) => {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`cursor-pointer font-roboto-mono text-xl md:text-lg font-medium uppercase tracking-wide transition-all ${active ? "text-neutral-100" : "text-neutral-500 hover:text-blue"
          } ${className ? className : ""}`}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`cursor-pointer font-roboto-mono text-xl md:text-lg  font-medium uppercase tracking-wide transition-all ${active ? "text-neutral-100" : "text-neutral-500 hover:text-blue"
        }`}
    >
      {children}
    </Link>
  );
};

const NavItemDivider: React.FC = () => {
  return (
    <p className="interact cursor-default font-roboto-mono text-xl font-medium uppercase tracking-wide text-neutral-600">
      /
    </p>
  );
};

type HeaderProps = {
  logoHref: string;
  onDepositWithdrawClick?: MouseEventHandler<HTMLButtonElement>;
  onWalletButtonClick?: MouseEventHandler<HTMLButtonElement>;
};

export function Header({
  logoHref,
  onDepositWithdrawClick,
  onWalletButtonClick,
}: HeaderProps) {
  const { account } = useWallet();
  const router = useRouter();

  return (
    <>
      <header className="border-b border-neutral-600 hidden md:block">
        <nav className="flex items-center justify-between px-8 py-4">
          <div className="my-auto flex flex-1 items-center">
            <Link href={logoHref}>
              <Image
                className=""
                alt="Econia Logo"
                src="/econia.svg"
                width={120}
                height={20}
                priority
              />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center gap-5">
            {/* TODO: Enable swap */}
            {/* <NavItem href="/swap" active={router.pathname.startsWith("/swap")}>
            Swap
          </NavItem>
          <NavItemDivider /> */}
            <NavItem
              href="/market"
              active={router.pathname.startsWith("/market")}
            >
              Trade
            </NavItem>
            <NavItemDivider />
            <NavItem
              href="/faucet"
              active={router.pathname.startsWith("/faucet")}
            >
              Faucet
            </NavItem>
            <NavItemDivider />
            <NavItem
              className="flex items-center gap-1"
              href="https://econia.dev"
              external
            >
              <p>Docs</p>
              <ArrowRightIcon className="inline-block h-3 w-3 -rotate-45" />
            </NavItem>
          </div>
          <div className="flex flex-1 justify-end">
            <ConnectedButton className="w-[156px] py-1">
              <div className="flex items-center gap-4">
                {onDepositWithdrawClick && (
                  <Button
                    variant="secondary"
                    className="whitespace-nowrap text-[16px]/6"
                    onClick={onDepositWithdrawClick}
                  >
                    Deposit / Withdraw
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={onWalletButtonClick}
                  className="whitespace-nowrap font-roboto-mono text-[16px]/6 !font-medium uppercase"
                >
                  {shorten(account?.address)}
                </Button>
              </div>
            </ConnectedButton>
          </div>
        </nav>
      </header>
      <HeaderMobile logoHref={logoHref} onDepositWithdrawClick={onDepositWithdrawClick} onWalletButtonClick={onWalletButtonClick} />
    </>

  );
}
const SlidingMenu = ({
  isOpen,
  toggleMenu,
  onWalletButtonClick
}: {
  isOpen: boolean;
  toggleMenu: () => void;
  onWalletButtonClick?: MouseEventHandler<HTMLButtonElement>;
}) => {
  const { account } = useWallet();
  const router = useRouter();

  return (
    <div
      className={`flex flex-col pt-4 z-30 fixed h-full top-16 right-0 bg-neutral-800 bg-noise overflow-x-hidden transition-width duration-300 ease-in-out ${isOpen ? "w-full" : "w-0"
        }`}
    >
      <div className="flex  px-6 flex-col  justify-between items-start gap-6 mb-8">
        {/* {menuList.map((item: MenuItem, index: number) => {
          return (
            <MenuItem
              item={item}
              key={index}
              responsive={true}
              toggleMenu={toggleMenu}
            />
          );
        })}
         */}
        <NavItem
          href="/market"
          active={router.pathname.startsWith("/market")}
        >
          Trade
        </NavItem>
        {/* <NavItemDivider /> */}
        <NavItem
          href="/faucet"
          active={router.pathname.startsWith("/faucet")}
        >
          Faucet
        </NavItem>
        {/* <NavItemDivider /> */}
        <NavItem
          className="flex items-center gap-1"
          href="https://econia.dev"
          external
        >
          <p>Docs</p>
          <ArrowRightIcon className="inline-block h-3 w-3 -rotate-45" />
        </NavItem>
      </div>
      <div className="px-6">
        <ConnectedButton className="w-[182px] leading-[22px] !font-roboto-mono !font-bold uppercase !text-base py-[6px]">
          <div className="flex items-center gap-4">
            {/* {onDepositWithdrawClick && (
              <Button
                variant="secondary"
                className="whitespace-nowrap text-[16px]/6"
                onClick={onDepositWithdrawClick}
              >
                Deposit / Withdraw
              </Button>
            )} */}
            <Button
              variant="primary"
              onClick={onWalletButtonClick}
              className="whitespace-nowrap font-roboto-mono leading-[22px] !font-bold uppercase !text-base py-[6px]"
            >
              {shorten(account?.address)}
            </Button>
          </div>
        </ConnectedButton>
      </div>
      {/* {account?.address ? <DisconnectWalletButton /> : <ConnectWalletButton />} */}
    </div>
  );
};


const HeaderMobile = ({
  logoHref,
  onDepositWithdrawClick,
  onWalletButtonClick,
}: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { account } = useWallet();
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="border-b border-neutral-600 md:hidden flex justify-between items-center py-4 px-6 h-[69px]">

      <div className="flex items-center">
        <Link
          href={logoHref}
          onClick={closeMenu}
          className="transition duration-300 transform scale-101 hover:scale-96"
        >
          <Image src="/econia.svg" alt="logo" width={117} height={19} />
        </Link>
      </div>

      {/* Connection buttons */}
      <div className="flex gap-4 items-center">
        {!isOpen && (
          <ConnectedButton className="w-[182px] leading-[22px] !font-roboto-mono !font-bold uppercase !text-base py-[6px]">
            <div className="flex items-center gap-4">
              {/* {onDepositWithdrawClick && (
            <Button
              variant="secondary"
              className="whitespace-nowrap text-[16px]/6"
              onClick={onDepositWithdrawClick}
            >
              Deposit / Withdraw
            </Button>
          )} */}
              <Button
                variant="primary"
                onClick={onWalletButtonClick}
                className="whitespace-nowrap font-roboto-mono leading-[22px] !font-bold uppercase !text-base py-[6px]"
              >
                {shorten(account?.address)}
              </Button>
            </div>
          </ConnectedButton>
        )}


        <div
          className="flex flex-col gap-[8px] items-end text-white"
          onClick={toggleMenu}
        >
          <OpenMenuIcon
            className={`transition duration-300 ease-in-out ${isOpen ? "rotate-[135deg] translate-y-[6px]" : ""
              }`}
          />
          <OpenMenuIcon
            className={`transition duration-300 ease-in-out ${isOpen ? "rotate-45 -translate-y-[6.5px]" : ""
              }`}
          />
        </div>
      </div>

      <SlidingMenu isOpen={isOpen} toggleMenu={toggleMenu} onWalletButtonClick={onWalletButtonClick} />
    </header>
  )
}
