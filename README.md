# Econia Frontend

## Prequesites

### 1 - Ensure that you clone the Github repositoty with SSH

> *SKIP this part if you've already use SSH*

Open Terminal and run the following commands:

```bash
git remote set-url origin git@github.com:econia-labs/econia-frontend.git
```

### 2 - Pull the TradingView submodule

> *NOTE: Skip this part if you do not want to show the trading chart*

The [TradingView](https://github.com/tradingview/charting_library) repository is the submodule of this repository which is used for displaying the trading chart of a specific martket and initialized at `src/frontend/public/static`.

In order to make this repository to be able to use the `TradingView`, run the following commands in your terminal:

```bash
git submodule init
git submodule update
```

In essence, adding the `TradingView` as a submodule is that you are cloning the `TradingView` repository and build it into static files. Therefore, you need to have the access rights to the `TradingView` repository.

Moreover, the submodule path is set up to use SSH protocol with the `github.com` hostname so that you need to manage your SSH keys to make sure that you are using the correct configuration.

#### If you have not had any SSH keys

Follow this [guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) to generate one




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

| Variable                                 | Meaning                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_ECONIA_ADDR`                | The Econia address                                                                     |
| `NEXT_PUBLIC_FAUCET_ADDR`                | The Econia faucet address                                                              |
| `NEXT_PUBLIC_NETWORK_NAME`               | The network name (for example, testnet)                                                |
| `NEXT_PUBLIC_API_URL`                    | The Econia REST API URL                                                                |
| `NEXT_PUBLIC_RPC_NODE_URL`               | Aptos RPC url                                                                          |
| `GITHUB_ACCESS_TOKEN`                    | Access token for GitHub account with TradingView repo access (only required in Vercel) |
| `NEXT_PUBLIC_UNCONNECTED_NOTICE_MESSAGE` | Message that show in modal when user have not connected wallet yet                     |
| `NEXT_PUBLIC_READ_ONLY`                  | Config read only mode, 1 OR 0                                                          |
| `NEXT_PUBLIC_READ_ONLY_MESSAGE`          | Error message when user attempt do a require sign operator                             |

### Generating a `GITHUB_ACCESS_TOKEN`

To generate a `GITHUB_ACCESS_TOKEN`:

1. Go to https://github.com/settings/tokens/new
1. Provide a descriptive `note`.
1. In `Expiration` selection box, choose `No expiration`
1. In the `Select scopes` section, click on `repo - Full control of private repositories` to select all repository-related options.
1. Click `Generate token`
1. Copy the generated token to your Vercel environment variables and name it `GITHUB_ACCESS_TOKEN`
