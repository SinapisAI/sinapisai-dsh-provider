# SinapisAI Model Provider Plugin for DeepSeek Harness

This is a community plugin for DeepSeek Harness. It lets you use SinapisAI
Router and other SinapisAI models directly in DeepSeek Harness.
SinapisAI is an LLM API platform with an OpenAI-compatible interface and
intelligent model routing. Visit the [SinapisAI website](https://mio.sinapisai.com)
to learn more and get started.

[简体中文](README.zh-CN.md)

## Highlights

### Automatic best-model routing

The plugin uses `sinapisai/router` by default. Router is not a fixed model. It
is SinapisAI's intelligent routing model: the service selects a suitable actual
model for each task from the models currently available. Users do not need to
switch models repeatedly for coding, analysis, tool use, or other workloads.

### Other features

- Registers the native `sinapisai` provider and makes `sinapisai/router` the
  Harness default model.
- Includes the SinapisAI API endpoint and OpenAI-compatible protocol.
- Stores the API key in the Harness credential store rather than plugin config.
- Loads available chat models with search by model ID or name.
- Synchronizes context windows, maximum output capacities, and image-input
  support.
- Supports streaming responses and tool calls.
- Keeps Router and saved models available if the model list is temporarily
  unavailable.

## Install

If you run DeepSeek Harness through the official npx workflow:

```powershell
corepack enable
npx -y --package @deepseek-ai/dsh dsh plugin --profile web add github:SinapisAI/sinapisai-dsh-provider
npx -y @deepseek-ai/dsh web
```

If a global `dsh` command is already available:

```powershell
dsh plugin --profile web add github:SinapisAI/sinapisai-dsh-provider
dsh web
```

The current release installs directly from GitHub. Cloning the repository and
building it manually are not required. If Harness is already running, stop and
restart it after installation.

## Use

Start Harness and open `http://127.0.0.1:3080`:

1. Open **Settings -> SinapisAI**.
2. Enter your SinapisAI API key.
3. Select **Load or refresh models**.
4. Use the default `sinapisai/router`, or search for and select other models.
5. Save the settings.

The model selector will show SinapisAI Router and the models you selected.

## Update

Run the installation command again, then restart Harness.

## Uninstall

For npx users:

```powershell
npx -y --package @deepseek-ai/dsh dsh plugin --profile web remove @sinapisai/dsh-provider
```

For global `dsh` users:

```powershell
dsh plugin --profile web remove @sinapisai/dsh-provider
```

Restart Harness after uninstalling the plugin.
