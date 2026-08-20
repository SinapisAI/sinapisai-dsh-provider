# SinapisAI 模型提供方插件

这是一个适用于 DeepSeek Harness 的社区插件，可以在 DeepSeek Harness 中直接使用
SinapisAI Router 和其他 SinapisAI 模型。
SinapisAI 是提供 OpenAI 兼容接口和智能模型路由能力的大模型 API 服务平台。
访问 [SinapisAI 官网](https://mio.sinapisai.com) 了解服务并开始使用。

[English](README.md)

## 特色

### Router 自动择优路由

插件默认使用 `sinapisai/router`。Router 不是一个固定模型，而是 SinapisAI
提供的智能路由模型：服务端会根据当前任务，在可用模型中自动选择更合适的实际模型。
用户不需要为编程、分析、工具调用或其他任务反复手动切换模型。

### 其他功能

- 注册原生 `sinapisai` Provider，并把 `sinapisai/router` 设为 Harness 默认模型。
- 内置 SinapisAI API 地址和 OpenAI 兼容协议。
- API Key 保存在 Harness 凭据库中，不会写入插件配置文件。
- 获取可用的对话模型，并支持按模型名称或模型标识搜索。
- 同步模型的上下文窗口、最大输出能力和图片输入能力。
- 支持流式输出和工具调用。
- 模型列表暂时无法获取时，Router 和已经保存的模型仍可继续使用。

## 安装

安装插件前，请先确保终端可以运行 `pnpm`。如果尚未安装，请参考
[pnpm 官方安装说明](https://pnpm.io/installation)。

如果你通过官方的 npx 方式运行 DeepSeek Harness：

```powershell
pnpm --version
npx -y --package @deepseek-ai/dsh dsh plugin --profile web add github:SinapisAI/sinapisai-dsh-provider
npx -y @deepseek-ai/dsh web
```

如果系统中已经有全局 `dsh` 命令：

```powershell
dsh plugin --profile web add github:SinapisAI/sinapisai-dsh-provider
dsh web
```

当前版本直接从 GitHub 安装，不需要克隆仓库或手工编译。安装后如果 Harness
正在运行，请先停止再重新启动。

## 使用

启动 Harness 后打开 `http://127.0.0.1:3080`：

1. 进入 **设置 -> SinapisAI**。
2. 填写 SinapisAI API Key。
3. 点击 **获取或刷新模型**。
4. 使用默认的 `sinapisai/router`，或者搜索并选择其他模型。
5. 保存设置。

保存后可以在模型选择器中看到 SinapisAI Router 和已经选择的模型。

## 更新

重新执行安装命令，然后重启 Harness。

## 卸载

npx 用户：

```powershell
npx -y --package @deepseek-ai/dsh dsh plugin --profile web remove @sinapisai/dsh-provider
```

全局 `dsh` 用户：

```powershell
dsh plugin --profile web remove @sinapisai/dsh-provider
```

卸载后请重启 Harness。
