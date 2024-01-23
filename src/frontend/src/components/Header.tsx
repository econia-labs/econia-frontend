import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, {
  type MouseEventHandler,
  type PropsWithChildren,
  useState,
} from "react";

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
        className={`cursor-pointer font-roboto-mono text-xl font-medium uppercase tracking-wide transition-all lg:text-lg ${
          active ? "text-neutral-100" : "text-neutral-500 hover:text-blue"
        } ${className ? className : ""}`}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`cursor-pointer font-roboto-mono text-xl font-medium  uppercase tracking-wide transition-all lg:text-lg ${
        active ? "text-neutral-100" : "text-neutral-500 hover:text-blue"
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
      <header className="hidden border-b border-neutral-600 lg:block">
        <nav className="flex items-center justify-between py-5 pl-[29.19px] pr-[20.02px]">
          <div className="my-auto flex  items-center gap-[29.95px]">
            <Link href={logoHref}>
              <Image
                className=""
                alt="Econia Logo"
                src="/econia.svg"
                width={117}
                height={19}
                priority
              />
            </Link>
            <div className="flex flex-1 items-center justify-center gap-6">
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
          </div>

          <div className="flex flex-1 justify-end">
            <ConnectedButton className="py-[7px]">
              <div className="flex items-center gap-4">
                {onDepositWithdrawClick && (
                  <Button
                    variant="secondary"
                    className="whitespace-nowrap px-[15px] pb-2 pt-[10px] uppercase !leading-[18px] tracking-[0.32px]"
                    onClick={onDepositWithdrawClick}
                  >
                    Deposit/Withdraw
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={onWalletButtonClick}
                  className="whitespace-nowrap px-[17.5px] pb-2 pt-[10px] uppercase !leading-[18px] tracking-[0.32px]"
                >
                  {shorten(account?.address)}
                </Button>
              </div>
            </ConnectedButton>
          </div>
        </nav>
      </header>
      <HeaderMobile
        logoHref={logoHref}
        onDepositWithdrawClick={onDepositWithdrawClick}
        onWalletButtonClick={onWalletButtonClick}
      />
    </>
  );
}
const SlidingMenu = ({
  isOpen,
  onWalletButtonClick,
  onDepositWithdrawClick,
}: {
  isOpen: boolean;
  toggleMenu: () => void;
  onWalletButtonClick?: MouseEventHandler<HTMLButtonElement>;
  onDepositWithdrawClick?: MouseEventHandler<HTMLButtonElement>;
}) => {
  const { account } = useWallet();
  const router = useRouter();

  return (
    <div
      className={`transition-width fixed right-0 top-16 z-30 flex h-full flex-col overflow-x-hidden bg-neutral-800 bg-noise pt-4 duration-300 ease-in-out ${
        isOpen ? "w-full" : "w-0"
      }`}
    >
      <div className="mb-8  flex flex-col  items-start justify-between gap-[23.68px] px-[29.28px]">
        <NavItem
          href="/market"
          active={router.pathname.startsWith("/market")}
          className=""
        >
          Trade
        </NavItem>
        <NavItem
          href="/faucet"
          active={router.pathname.startsWith("/faucet")}
          className=""
        >
          Faucet
        </NavItem>
        <NavItem
          href="https://econia.dev"
          className="flex items-center gap-1"
          external={true}
        >
          <p>Docs</p>
          <ArrowRightIcon className="inline-block h-3 w-3 -rotate-45" />
        </NavItem>
      </div>
      <div className="px-[29.28px]">
        <ConnectedButton className="w-[182px] py-[7px] uppercase leading-[22px]">
          <div className="flex flex-col gap-[29.37px]">
            <Button
              variant="primary"
              onClick={onWalletButtonClick}
              className="w-fit whitespace-nowrap py-[7px] !font-bold uppercase leading-[22px] tracking-[0.32px]"
            >
              {shorten(account?.address, 12)}
            </Button>
            {onDepositWithdrawClick && (
              <Button
                variant="secondary"
                className="h-9 w-[189px] whitespace-nowrap font-roboto-mono !text-base font-medium uppercase leading-[18px] tracking-[0.32px]"
                onClick={onDepositWithdrawClick}
              >
                Deposit/Withdraw
              </Button>
            )}
          </div>
        </ConnectedButton>
      </div>
    </div>
  );
};

const HeaderMobile = ({
  logoHref,
  onDepositWithdrawClick,
  onWalletButtonClick,
}: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    if (!isOpen) {
      window.scrollTo({
        behavior: "smooth",
        top: 0,
      });
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header
      className={`flex h-[76px] items-center justify-between border-b border-neutral-600 py-4 pl-[29.28px] pr-[30.85px] lg:hidden  ${
        isOpen && ""
      }`}
    >
      <div className="flex items-center">
        <Link
          href={logoHref}
          onClick={closeMenu}
          className="scale-101 hover:scale-96 transform transition duration-300"
        >
          <Image src="/econia.svg" alt="logo" width={117} height={19} />
        </Link>
      </div>

      <div className="flex h-[69px] items-center  gap-5">
        <div
          className="flex flex-col items-end gap-[8px] text-white"
          onClick={toggleMenu}
        >
          <OpenMenuIcon
            className={`transition duration-300 ease-in-out ${
              isOpen ? "translate-y-[6px] rotate-[135deg]" : ""
            }`}
          />
          <OpenMenuIcon
            className={`transition duration-300 ease-in-out ${
              isOpen ? "-translate-y-[6.5px] rotate-45" : ""
            }`}
          />
        </div>
      </div>

      <SlidingMenu
        isOpen={isOpen}
        toggleMenu={toggleMenu}
        onWalletButtonClick={onWalletButtonClick}
        onDepositWithdrawClick={onDepositWithdrawClick}
      />
    </header>
  );
};
