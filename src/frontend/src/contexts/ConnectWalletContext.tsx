import {
  useWallet,
  type Wallet,
  WalletReadyState,
  WalletName,
} from "@aptos-labs/wallet-adapter-react";
import Image from "next/image";
import {
  createContext,
  type MouseEventHandler,
  type PropsWithChildren,
  useContext,
  useState,
  useEffect,
  ReactElement,
} from "react";
import { toast } from "react-toastify";

import { BaseModal } from "@/components/modals/BaseModal";
import { ArrowIcon } from "@/components/icons/ArrowIcon";
import PetraIcon from "@/components/icons/PetraIcon";
import PontemIcon from "@/components/icons/PontemIcon";
import MartianIcon from "@/components/icons/MartianIcon";
import RiseIcon from "@/components/icons/RiseIcon";

export type ConnectWalletContextState = {
  connectWallet: () => void;
};

export const ConnectWalletContext = createContext<
  ConnectWalletContextState | undefined
>(undefined);

const WalletItem: React.FC<
  {
    wallet: Wallet;
    className?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
  } & PropsWithChildren
> = ({ wallet, className, onClick, children }) =>
  wallet.readyState === WalletReadyState.NotDetected ? (
    <a href={wallet.url} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
let t: NodeJS.Timeout | null = null;
const AutoConnect = () => {
  const { account, connect, ...res } = useWallet();
  useEffect(() => {
    if (!account && localStorage.getItem("AptosWalletName")) {
      const f = async () => {
        try {
          await connect(localStorage.getItem("AptosWalletName") as WalletName);
        } catch (error) {
          if (t) {
            clearInterval(t);
          }
        }
      };
      f();
      t = setInterval(f, 100);
    } else if (t) {
      clearInterval(t);
    }
    return () => {
      if (t) {
        clearInterval(t);
      }
    };
  }, [account]);

  return null;
};
export const WALLET_ICON: { [key: string]: ReactElement } = {
  petra: <PetraIcon />,
  pontem: <PontemIcon />,
  martian: <MartianIcon />,
  rise: <RiseIcon />,
};
export function ConnectWalletContextProvider({ children }: PropsWithChildren) {
  const { connect, wallets } = useWallet();
  const [open, setOpen] = useState<boolean>(false);
  const value: ConnectWalletContextState = {
    connectWallet: () => setOpen(true),
  };

  return (
    <ConnectWalletContext.Provider value={value}>
      <AutoConnect />
      {children}
      <BaseModal
        className="md:w-[600px]"
        isOpen={open}
        onClose={() => setOpen(false)}
        onBack={() => setOpen(false)}
      >
        <div className="px-[46px] py-[25.5px]">
          <h2 className="text-center font-jost text-3xl font-bold text-white">
            Connect a Wallet
          </h2>
          <p className="mt-4 text-center font-roboto-mono text-sm font-light leading-[30px] text-white">
            In order to use this site you must connect a wallet and allow the
            site to access your account.
          </p>
          <div className="mt-8 flex flex-col gap-4">
            {wallets.map((wallet) => (
              <WalletItem
                wallet={wallet}
                key={wallet.name}
                className="relative flex h-[45px] w-full items-center p-4 text-neutral-600 ring-1 ring-neutral-600 transition-all hover:text-blue hover:ring-blue [&:hover>.arrow-wrapper]:bg-blue [&:hover>.arrow-wrapper]:ring-blue [&:hover>div>.arrow]:-rotate-45"
                onClick={() => {
                  try {
                    connect(wallet.name);
                  } catch (e) {
                    if (e instanceof Error) {
                      toast.error(e.message);
                    }
                  } finally {
                    setOpen(false);
                  }
                }}
              >
                {/* <Image
                  src={wallet.icon}
                  height={36}
                  width={36}
                  alt={`${wallet.name} Wallet Icon`}
                /> */}
                {WALLET_ICON[wallet.name.toLowerCase()]}
                <p className="ml-2 font-jost text-base font-medium text-neutral-500">
                  {wallet.readyState === WalletReadyState.NotDetected
                    ? `Install ${wallet.name} Wallet`
                    : `${wallet.name} Wallet`}
                </p>
                <div className="arrow-wrapper absolute bottom-0 right-0 p-[7px] ring-1 ring-neutral-600 transition-all">
                  <ArrowIcon className="arrow transition-all" />
                </div>
              </WalletItem>
            ))}
          </div>
        </div>
      </BaseModal>
    </ConnectWalletContext.Provider>
  );
}

export const useConnectWallet = (): ConnectWalletContextState => {
  const context = useContext(ConnectWalletContext);
  if (context == null) {
    throw new Error(
      "useAccountContext must be used within a AccountContextProvider.",
    );
  }
  return context;
};
