# Econia Frontend

## Getting Started

The [TradingView repository](https://github.com/tradingview/charting_library) is included as a submodule within this repository at `src/frontend/public/static`. Please note that it is a private repo, so you need to use a GitHub account with access to the TradingView repo.

- Pull the TradingView Submodule

To run the project, you need to pull the TradingView repository by running the following commands:

```bash
git submodule init # only the first time
git submodule update # only the first time
```

- Navigate to the Frontend Folder

```bash
cd src/frontend
```

- Install dependencies

```bash
pnpm i # pnpm is required
```

Copy .env.example file

```bash
cp -R .env.example .env.local
```

- Run the development server:

```bash
npm run dev
```

## Deploying on Vercel

### Environment

To deploy on Vercel, you'll need to set up the following environment variables:

| Variable                   | Meaning                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_ECONIA_ADDR`  | The Econia address                                                                     |
| `NEXT_PUBLIC_FAUCET_ADDR`  | The Econia faucet address                                                              |
| `NEXT_PUBLIC_NETWORK_NAME` | The network name (for example, testnet)                                                |
| `NEXT_PUBLIC_API_URL`      | The Econia REST API URL                                                                |
| `NEXT_PUBLIC_WS_URL`       | The Econia WebSockets API URL                                                          |
| `GITHUB_ACCESS_TOKEN`      | Access token for GitHub account with TradingView repo access (only required in Vercel) |

### Generating a `GITHUB_ACCESS_TOKEN`

To generate a `GITHUB_ACCESS_TOKEN`:

1. Go to https://github.com/settings/tokens/new
1. Provide a descriptive `note`.
1. In `Expiration` selection box, choose `No expiration`
1. In the `Select scopes` section, click on `repo - Full control of private repositories` to select all repository-related options.
1. Click `Generate token`
1. Copy the generated token to your Vercel environment variables and name it `GITHUB_ACCESS_TOKEN`
