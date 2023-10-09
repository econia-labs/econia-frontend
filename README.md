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

- Run the development server:

```bash
npm run dev
```

## Deploying on Vercel

### Environment

To deploy on Vercel, you'll need to set up the following environment variables:

| Variable                   | Meaning                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_ECONIA_ADDR`  | The Econia address                                                                    |
| `NEXT_PUBLIC_FAUCET_ADDR`  | The Econia faucet address                                                             |
| `NEXT_PUBLIC_NETWORK_NAME` | The network name ex: testnet                                                          |
| `NEXT_PUBLIC_API_URL`      | The Econia restfull backend url                                                       |
| `NEXT_PUBLIC_API_URL`      | The Econia websocket backend url                                                      |
| `NEXT_PUBLIC_WS_URL`       | The Econia backend url                                                                |
| `GITHUB_ACCESS_TOKEN`      | Access token for GitHub account with TradingView repo access (Only require in vercel) |

### Generating a `GITHUB_ACCESS_TOKEN`

To generate a GITHUB_ACCESS_TOKEN, follow these steps:

- Go to https://github.com/settings/tokens/new
- Provide a descriptive `note`.
- In `Expiration` selection box, chooes `No expiration`
- In the `Select scopes` section, click on `repo - Full control of private repositories` to select all repository-related options.
- Click `Generate token`
- Copy the generated token a replace the `GITHUB_ACCESS_TOKEN` environment variable in vercel with this token.
