import {
  useWallet,
  type Wallet,
  type WalletName,
  WalletReadyState,
} from "@aptos-labs/wallet-adapter-react";
import {
  createContext,
  type MouseEventHandler,
  type PropsWithChildren,
  type ReactElement,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

import { ArrowIcon } from "@/components/icons/ArrowIcon";
import MartianIcon from "@/components/icons/MartianIcon";
import NightlyIcon from "@/components/icons/NightlyIcon";
import PetraIcon from "@/components/icons/PetraIcon";
import PontemIcon from "@/components/icons/PontemIcon";
import RiseIcon from "@/components/icons/RiseIcon";
import { BaseModal } from "@/components/modals/BaseModal";

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

// This should only show up if the wallet extension isn't installed.
const PlaceholderWalletItem: React.FC<
  {
    url: string;
    className?: string;
  } & PropsWithChildren
> = ({ url, className, children }) => (
  <a href={url} className={className} target="_blank" rel="noreferrer">
    {children}
  </a>
);

let t: NodeJS.Timeout | null = null;
const AutoConnect = () => {
  const { account, connect } = useWallet();
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
  }, [account]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

const WalletItemClassName =
  "relative flex h-[45px] w-full items-center p-4 text-neutral-600 ring-1 ring-neutral-600 " +
  "transition-all hover:text-blue hover:ring-blue [&:hover>.arrow-wrapper]:bg-blue [&:hover>.arrow-wrapper]:ring-blue " +
  "[&:hover>div>.arrow]:-rotate-45";
const WalletIconClassName =
  "ml-2 font-jost text-base font-medium text-neutral-500";
const ArrowDivClassName =
  "arrow-wrapper absolute bottom-0 right-0 p-[7px] ring-1 ring-neutral-600 transition-all";

const AIP62Wallets: readonly [string, string][] = [
  [
    "Nightly",
    "https://chromewebstore.google.com/detail/nightly/fiikommddbeccaoicoejoniammnalkfa?hl=en",
  ],
];

export const WALLET_ICON: { [key: string]: ReactElement } = {
  petra: <PetraIcon />,
  pontem: <PontemIcon />,
  martian: <MartianIcon />,
  rise: <RiseIcon />,
  nightly: <NightlyIcon />,
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
        showCloseButton={true}
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
            {/* Wallet modal items for non AIP-62 wallets. */}
            {wallets?.map((wallet) => (
              <WalletItem
                wallet={wallet}
                key={wallet.name}
                className={WalletItemClassName}
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
                {WALLET_ICON[wallet.name.toLowerCase()]}
                <p className={WalletIconClassName}>
                  {wallet.readyState === WalletReadyState.NotDetected
                    ? `Install ${wallet.name} Wallet`
                    : `${wallet.name} Wallet`}
                </p>
                <div className={ArrowDivClassName}>
                  <ArrowIcon className="arrow transition-all" />
                </div>
              </WalletItem>
            ))}
            {/* Wallet modal placeholders for select AIP-62 wallets that aren't installed. */}
            {AIP62Wallets.map(
              ([name, url]) =>
                !wallets?.map((w) => String(w.name)).includes(name) && (
                  <PlaceholderWalletItem
                    key={`placeholder-item-${name}`}
                    url={url}
                    className={WalletItemClassName}
                  >
                    {WALLET_ICON[name.toLowerCase()]}
                    <p className={WalletIconClassName}>
                      {`Install ${name} Wallet`}
                    </p>
                    <div className={ArrowDivClassName}>
                      <ArrowIcon className="arrow transition-all" />
                    </div>
                  </PlaceholderWalletItem>
                ),
            )}
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
