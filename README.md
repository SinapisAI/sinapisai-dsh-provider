# SinapisAI Provider for DeepSeek Harness

Use SinapisAI Router and other available SinapisAI models directly in
DeepSeek Harness.

[简体中文](README.zh-CN.md)

## Features

- Registers the native `sinapisai` provider and sets `sinapisai/router` as the
  Harness default model.
- Keeps the SinapisAI API endpoint and OpenAI-compatible protocol built in.
- Stores API keys in the Harness credential store rather than plugin config.
- Synchronizes available chat models with search by model ID or name.
- Synchronizes context windows, maximum output capacities, and image-input
  support from the model directory.
- Supports streaming responses and tool calls.
- Records the actual routed model only when the service returns it; model names
  are never guessed.
- Keeps Router and saved models available if model synchronization is
  temporarily unavailable.

## Install

Install DeepSeek Harness and the package manager used by `dsh plugin` if they
are not already available:

```powershell
npm install --global @deepseek-ai/dsh pnpm
```

Install the published package and start Harness:

```powershell
dsh plugin --profile web add @sinapisai/dsh-provider
dsh web
```

Before the npm package is published, install directly from GitHub:

```powershell
dsh plugin --profile web add github:SinapisAI/sinapisai-dsh-provider
dsh web
```

Open `http://127.0.0.1:3080`, then:

1. Open **Settings -> SinapisAI**.
2. Enter the API key.
3. Select **Load or refresh models**.
4. Search and select the models you need.
5. Save.

The model selector exposes `SinapisAI / sinapisai/router` and the selected
models.

## Installation in mainland China

If access to the default npm registry is slow, configure an npm mirror before
installing:

```powershell
npm config set registry https://registry.npmmirror.com
dsh plugin --profile web add @sinapisai/dsh-provider
```

## Uninstall

```powershell
dsh plugin --profile web remove @sinapisai/dsh-provider
```

Restart Harness after installation or removal.

## Troubleshooting

During installation, pnpm may report missing `@deepseek-ai/*` peer
dependencies. Harness deliberately resolves those peers from its own
installation instead of installing duplicate framework instances into each
profile. If the command ends with `Done`, do not install the listed peers
manually.

If port 3080 is occupied, locate and stop the previous process:

```powershell
Get-NetTCPConnection -LocalPort 3080 -State Listen |
  Select-Object LocalAddress,LocalPort,OwningProcess
Stop-Process -Id <OwningProcess>
```

Startup does not wait for model-directory synchronization. Synchronization
requests time out after 15 seconds and results are cached in memory for five
minutes. Router and saved models remain available when synchronization fails.

## Development

```powershell
corepack pnpm install
corepack pnpm check
corepack pnpm pack:check
```

Link this checkout into an installed Harness profile:

```powershell
dsh plugin --profile web add C:\path\to\sinapisai-dsh-provider
```

No DeepSeek Harness source modification is required. Never commit an API key.
