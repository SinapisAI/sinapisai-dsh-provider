# DeepSeek Harness 的 SinapisAI Provider

在 DeepSeek Harness 中直接使用 SinapisAI Router 和其他可用模型。

[English](README.md)

## 功能

- 注册原生 `sinapisai` Provider，并把 `sinapisai/router` 设为 Harness 默认模型。
- 内置 SinapisAI API 地址和 OpenAI 兼容协议，无需手动填写协议配置。
- API Key 保存在 Harness 凭据库中，不会写入插件配置文件。
- 自动同步当前可用的对话模型，并支持按模型名称或模型标识搜索。
- 同步模型的上下文窗口、最大输出能力和图片输入能力。
- 支持流式输出和工具调用。
- 仅在服务端返回实际路由模型时记录该信息，不猜测或伪造模型名称。
- 模型同步暂时不可用时，Router 和已经保存的模型仍可继续使用。

## 安装

如果系统中还没有 `dsh` 和 `pnpm` 命令，先安装 DeepSeek Harness 以及
`dsh plugin` 使用的包管理器：

```powershell
npm install --global @deepseek-ai/dsh pnpm
```

安装已发布的 SinapisAI Provider 并启动 Harness：

```powershell
dsh plugin --profile web add @sinapisai/dsh-provider
dsh web
```

在 npm 包正式发布前，可以直接从 GitHub 安装：

```powershell
dsh plugin --profile web add github:SinapisAI/sinapisai-dsh-provider
dsh web
```

打开 `http://127.0.0.1:3080`，然后：

1. 进入 **设置 -> SinapisAI**
2. 填写 API Key
3. 点击 **获取或刷新模型**
4. 搜索并选择需要的模型
5. 保存

模型选择器会显示 `SinapisAI / sinapisai/router` 以及已经选择的模型。

## 中国大陆安装

如果访问默认 npm 源较慢，可以在安装前配置国内镜像：

```powershell
npm config set registry https://registry.npmmirror.com
dsh plugin --profile web add @sinapisai/dsh-provider
```

## 卸载

```powershell
dsh plugin --profile web remove @sinapisai/dsh-provider
```

安装或卸载后请重启 Harness。

## 常见问题

安装时 pnpm 可能提示缺少 `@deepseek-ai/*` peer dependency。Harness 会从自身安装目录
解析这些依赖，以避免在每个 profile 中重复安装框架实例。如果命令最终显示 `Done`，
不要再手工安装提示中的 peer dependency。

如果 3080 端口被占用：

```powershell
Get-NetTCPConnection -LocalPort 3080 -State Listen |
  Select-Object LocalAddress,LocalPort,OwningProcess
Stop-Process -Id <OwningProcess>
```

启动不会等待模型目录同步。同步请求超时为 15 秒，结果会在内存中缓存 5 分钟。
同步失败时，Router 和此前保存的模型仍然可用。

## 开发验证

```powershell
corepack pnpm install
corepack pnpm check
corepack pnpm pack:check
```

也可以把源码目录链接到已经安装的 Harness profile：

```powershell
dsh plugin --profile web add C:\path\to\sinapisai-dsh-provider
```

不需要修改 DeepSeek Harness 源码。不要把真实 API Key 提交到仓库。
