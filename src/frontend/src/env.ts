if (process.env.NEXT_PUBLIC_API_URL == null) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
} else if (process.env.NEXT_PUBLIC_RPC_NODE_URL == null) {
  throw new Error("NEXT_PUBLIC_RPC_NODE_URL is not set");
} else if (process.env.NEXT_PUBLIC_ECONIA_ADDR == null) {
  throw new Error("NEXT_PUBLIC_ECONIA_ADDR is not set");
} else if (process.env.NEXT_PUBLIC_FAUCET_ADDR == null) {
  throw new Error("NEXT_PUBLIC_FAUCET_ADDR is not set");
} else if (process.env.NEXT_PUBLIC_NETWORK_NAME == null) {
  throw new Error("NEXT_PUBLIC_NETWORK_NAME is not set");
} else if (process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS == null) {
  console.warn("NEXT_PUBLIC_INTEGRATOR_ADDRESS is not set. Defaulting to 0x1.");
  process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS = "0x1";
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const RPC_NODE_URL = process.env.NEXT_PUBLIC_RPC_NODE_URL;
export const ECONIA_ADDR = process.env.NEXT_PUBLIC_ECONIA_ADDR;
export const FAUCET_ADDR = process.env.NEXT_PUBLIC_FAUCET_ADDR;
export const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME;

export const AUDIT_ADDR = process.env.NEXT_PUBLIC_AUDIT_ONLY_ADDR;
export const UNCONNECTED_NOTICE_MESSAGE =
  process.env.NEXT_PUBLIC_UNCONNECTED_NOTICE_MESSAGE;
export const READ_ONLY_MODE = Number(process.env.NEXT_PUBLIC_READ_ONLY);
export const READ_ONLY_MESSAGE = String(
  process.env.NEXT_PUBLIC_READ_ONLY_MESSAGE,
);

export const DEFAULT_MARKET_ID = Number(
  process.env.NEXT_PUBLIC_DEFAULT_MARKET_ID,
);

export const INTEGRATOR_ADDRESS =
  process.env.NEXT_PUBLIC_INTEGRATOR_ADDRESS ?? "0x1";
