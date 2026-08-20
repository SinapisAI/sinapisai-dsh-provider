import { createProvider } from '@earendil-works/pi-ai'
import { openAICompletionsApi } from '@earendil-works/pi-ai/api/openai-completions.lazy'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import { assertUsableApiKey, LlmError, resolveRetryPolicy } from '@deepseek-ai/dsh-llm'
import { PiAiAdapter } from '@deepseek-ai/dsh-llm-pi-ai'
import z from '@deepseek-ai/schemastery'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import { CatalogCache, mergeConfiguredModels } from './catalog.js'
import { installRoutedModelObserver } from './observer.js'

export const name = 'llm-sinapisai'
export const inject = ['llm', 'sessions']
export const PROVIDER_ID = 'sinapisai'
export const SETTINGS_NAMESPACE = settingsNamespace('llm-sinapisai')
export const API_KEY_REF = 'SINAPISAI_API_KEY'
export const BASE_URL = 'https://api.sinapisai.com/v1'
export const CATALOG_URL = 'https://api.sinapisai.com/api/v1/catalog/models?sort=released'
export const ROUTER_MODEL = Object.freeze({
  id: 'sinapisai/router', name: 'SinapisAI Router', contextWindow: 128_000, maxTokens: 8_192, input: ['text'],
})

const modelSchema = z.object({
  id: z.string().required(),
  name: z.string(),
  contextWindow: z.number().step(1).min(1),
  maxTokens: z.number().step(1).min(1),
})

export const Config = z.object({
  apiKeyEnv: z.string().role('credential-ref').default(API_KEY_REF),
  models: z.array(modelSchema).default([]),
})

function toPiModel(model) {
  return {
    id: model.id,
    name: model.name ?? model.id,
    api: 'openai-completions',
    provider: PROVIDER_ID,
    baseUrl: BASE_URL,
    reasoning: false,
    input: [...(model.input ?? ['text'])],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: model.contextWindow ?? 262_144,
    maxTokens: model.maxTokens ?? 32_768,
  }
}

function createProfile(config, liveCatalog) {
  const piModels = mergeConfiguredModels(config.models, liveCatalog, ROUTER_MODEL).map(toPiModel)
  return {
    provider: PROVIDER_ID,
    displayName: 'SinapisAI',
    apiKeyEnv: credentialRef(config.apiKeyEnv ?? API_KEY_REF),
    streamIdleTimeoutMs: 300_000,
    retryPolicy: resolveRetryPolicy(undefined, 'llm-sinapisai: retryPolicy'),
    // Catalog maxTokens describes model capacity. It must not become the
    // default max_tokens on every request; only an operator-selected request
    // cap belongs in configuredMaxTokens.
    configuredMaxTokens: new Map(),
    piProvider: createProvider({
      id: PROVIDER_ID,
      name: 'SinapisAI',
      baseUrl: BASE_URL,
      auth: {
        apiKey: {
          name: 'SinapisAI API key',
          resolve: ({ credential }) => Promise.resolve({
            auth: credential?.key === undefined ? {} : { apiKey: credential.key },
            source: 'SinapisAI',
          }),
        },
      },
      models: piModels,
      api: openAICompletionsApi(),
    }),
  }
}

export function apply(ctx, initialConfig = {}) {
  let current = () => initialConfig
  let lastConfig
  let lastCatalogRevision = -1
  let memoizedProfiles
  const catalog = new CatalogCache({
    url: CATALOG_URL,
    onWarning: error => ctx.logger.warn(
      'sinapisai: model catalog refresh failed: %s',
      error instanceof Error ? error.message : String(error),
    ),
  })

  const profiles = () => {
    const config = current()
    if (memoizedProfiles !== undefined && config === lastConfig && catalog.revision === lastCatalogRevision) {
      return memoizedProfiles
    }
    lastConfig = config
    lastCatalogRevision = catalog.revision
    memoizedProfiles = new Map([[PROVIDER_ID, createProfile(config, catalog.peek())]])
    return memoizedProfiles
  }

  const resolveApiKey = async (_provider, profile) => {
    const ref = profile.apiKeyEnv
    const credentials = ctx.get('credentials')
    const hit = credentials !== undefined
      ? (await credentials.resolve(ref))?.value
      : launchEnvironmentOf(ctx).get(ref)?.value
    if (hit !== undefined && hit.length > 0) return assertUsableApiKey(hit, 'llm-sinapisai', ref)
    throw new LlmError(
      `llm-sinapisai: no credential for SinapisAI; store ${ref} in the SinapisAI settings page or export it`,
      'MISSING_CREDENTIAL',
    )
  }

  const adapter = new PiAiAdapter({
    profiles,
    resolveApiKey,
    resolveAttachments: () => ctx.get('attachments'),
    onReplayDegrade: ({ model, reason }) => {
      ctx.logger.warn('sinapisai: replay state for %s degraded to provider-neutral content (%s)', model, reason)
    },
  })

  const registration = ctx.llm.registerAdapter([PROVIDER_ID], adapter)
  ctx.llm.registerConfigurableProviders([{
    provider: PROVIDER_ID,
    displayName: 'SinapisAI',
    settingsNs: SETTINGS_NAMESPACE,
    settingsPath: [],
    declared: false,
  }])
  ctx.llm.registerModelDiscovery(SETTINGS_NAMESPACE, async () => catalog.refresh({ force: true }))
  installSettingsSection(ctx, SETTINGS_NAMESPACE, Config, initialConfig, {
    setSource: source => { current = source },
    onChange: () => registration.replace([PROVIDER_ID]),
  })
  installRoutedModelObserver(ctx)
  void catalog.refresh().then((models) => {
    if (models.length > 0) registration.replace([PROVIDER_ID])
  }).catch(() => {})
}

export {
  routedModelFromSource,
  SINAPISAI_PROVIDER_ID,
  SINAPISAI_ROUTER_MODEL_ID,
} from './observer.js'
