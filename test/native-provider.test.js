import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime from '@deepseek-ai/dsh-llm'
import { CatalogCache, mergeConfiguredModels, parseTextModelCatalog } from '../catalog.js'
import { apply, PROVIDER_ID, SETTINGS_NAMESPACE } from '../index.js'
import {
  installRoutedModelObserver,
  routedModelFromSource,
  SINAPISAI_PROVIDER_ID,
  SINAPISAI_ROUTER_MODEL_ID,
} from '../observer.js'

const validSource = {
  kind: 'model',
  provider: 'sinapisai',
  model: 'sinapisai/router',
  replayState: {
    response: {
      kind: 'pi-ai',
      version: 2,
      provider: 'sinapisai',
      model: 'sinapisai/router',
      responseModel: 'deepseek/deepseek-v3.2',
    },
  },
}

test('filters TEXT models and maps catalog capacity fields', () => {
  assert.deepEqual(parseTextModelCatalog({
    data: {
      models: [
        {
          modelId: 'vendor/alpha',
          displayName: 'Alpha',
          capability: 'TEXT',
          contextLength: '200000',
          maxCompletionTokens: 8192,
          enabled: true,
          tags: [
            { groupKey: 'input_modality', tagKey: 'text' },
            { groupKey: 'input_modality', tagKey: 'image' },
            { groupKey: 'output_modality', tagKey: 'text' },
          ],
        },
        {
          id: 'vendor/image-generator',
          capability: 'IMAGE',
          contextWindow: 999,
          tags: [{ groupKey: 'input_modality', tagKey: 'image' }],
        },
        {
          id: 'vendor/beta',
          name: 'Beta',
          capabilities: ['TEXT'],
          context_window: 128000,
          max_output_tokens: '4096',
        },
        {
          id: 'vendor/vision-by-name-only',
          capability: 'TEXT',
          enabled: true,
          tags: [{ groupKey: 'input_modality', tagKey: 'text' }],
        },
        { id: 'vendor/disabled', capability: 'TEXT', enabled: false },
        { id: 'vendor/alpha', capability: 'TEXT', contextLength: 1 },
      ],
    },
  }), [
    { id: 'vendor/alpha', name: 'Alpha', contextWindow: 200000, maxTokens: 8192, input: ['text', 'image'] },
    { id: 'vendor/beta', name: 'Beta', contextWindow: 128000, maxTokens: 4096, input: ['text'] },
    { id: 'vendor/vision-by-name-only', input: ['text'] },
  ])
})

test('fresh capacities win while stored values remain an offline fallback', () => {
  const router = {
    id: 'sinapisai/router', name: 'SinapisAI Router', contextWindow: 128000, maxTokens: 8192, input: ['text'],
  }
  assert.deepEqual(mergeConfiguredModels(
    [
      { id: 'vendor/alpha', name: 'Old Alpha', contextWindow: 1000, maxTokens: 100, input: ['text'] },
      { id: 'vendor/offline', name: 'Offline', contextWindow: 2000, maxTokens: 200, input: ['text', 'image'] },
      { id: 'sinapisai/router', contextWindow: 1 },
    ],
    [
      { id: 'vendor/alpha', name: 'Alpha', contextWindow: 200000, maxTokens: 8192, input: ['text', 'image'] },
      { id: 'sinapisai/router', name: 'Router live', contextWindow: 300000, maxTokens: 24000, input: ['text'] },
    ],
    router,
  ), [
    { id: 'sinapisai/router', name: 'Router live', contextWindow: 300000, maxTokens: 24000, input: ['text'] },
    { id: 'vendor/alpha', name: 'Alpha', contextWindow: 200000, maxTokens: 8192, input: ['text', 'image'] },
    { id: 'vendor/offline', name: 'Offline', contextWindow: 2000, maxTokens: 200, input: ['text'] },
  ])
})

test('catalog cache coalesces loads and retains the last good catalog', async () => {
  let calls = 0
  let fail = false
  const warnings = []
  const cache = new CatalogCache({
    url: 'https://example.test/catalog',
    fetchImpl: async () => {
      calls += 1
      if (fail) throw new Error('offline')
      return {
        ok: true,
        json: async () => ({
          items: [{ id: 'alpha', capability: 'TEXT', contextWindow: 10, maxCompletionTokens: 2 }],
        }),
      }
    },
    onWarning: error => warnings.push(error.message),
  })
  const [first, second] = await Promise.all([cache.refresh(), cache.refresh()])
  assert.equal(calls, 1)
  assert.deepEqual(first, second)
  assert.equal(cache.revision, 1)
  fail = true
  assert.deepEqual(await cache.refresh({ force: true }), first)
  assert.deepEqual(warnings, ['offline'])
})

test('reads and logs only an explicit standard response model', () => {
  assert.equal(SINAPISAI_PROVIDER_ID, 'sinapisai')
  assert.equal(SINAPISAI_ROUTER_MODEL_ID, 'sinapisai/router')
  assert.equal(routedModelFromSource(validSource), 'deepseek/deepseek-v3.2')
  assert.equal(routedModelFromSource({ ...validSource, provider: 'other' }), undefined)
  assert.equal(routedModelFromSource({ ...validSource, replayState: undefined }), undefined)
  let listener
  const messages = []
  installRoutedModelObserver({
    on(event, next) {
      assert.equal(event, 'session/event')
      listener = next
    },
    logger: { info: (...args) => messages.push(args) },
  })
  listener({}, { type: 'assistant/message', data: { message: { source: validSource } } })
  assert.deepEqual(messages, [[
    'sinapisai: routed %s to %s', 'sinapisai/router', 'deepseek/deepseek-v3.2',
  ]])
})

test('registers a configurable provider without turning catalog capacity into a request default', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      items: [{
        modelId: 'deepseek/deepseek-v3.2',
        displayName: 'DeepSeek V3.2',
        capability: 'TEXT',
        contextLength: 128000,
        maxCompletionTokens: 128000,
        enabled: true,
      }],
    }),
  })
  try {
    const ctx = new Context()
    await ctx.plugin(LlmRuntime)
    await ctx.plugin({ name: 'sinapisai-integration-test', inject: ['llm'], apply }, {
      models: [{
        id: 'deepseek/deepseek-v3.2',
        name: 'DeepSeek V3.2',
        contextWindow: 128000,
        maxTokens: 128000,
      }],
    })

    assert.deepEqual(ctx.llm.listConfigurableProviders(), [{
      provider: PROVIDER_ID,
      displayName: 'SinapisAI',
      settingsNs: SETTINGS_NAMESPACE,
      settingsPath: [],
      declared: false,
    }])
    assert.deepEqual(await ctx.llm.resolveCallConfig({
      provider: PROVIDER_ID,
      model: 'deepseek/deepseek-v3.2',
    }), {
      provider: PROVIDER_ID,
      model: 'deepseek/deepseek-v3.2',
    })
    assert.equal(
      (await ctx.llm.resolveModelInfo(PROVIDER_ID, 'deepseek/deepseek-v3.2')).defaultMaxTokens,
      undefined,
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('ships a native, searchable and secret-free provider Bundle', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  const host = await readFile(new URL('../index.js', import.meta.url), 'utf8')
  const client = await readFile(new URL('../client.cjs', import.meta.url), 'utf8')

  assert.equal(packageJson.name, '@sinapisai/dsh-provider')
  assert.equal(packageJson.version, '0.1.0')
  assert.equal(packageJson.publishConfig.access, 'public')
  assert.equal(packageJson.publishConfig.registry, 'https://registry.npmjs.org')
  assert.equal(packageJson.dependencies['@deepseek-ai/schemastery'], '^3.18.1')
  assert.equal(packageJson.dependencies['@earendil-works/pi-ai'], undefined)
  assert.equal(packageJson.peerDependencies['@earendil-works/pi-ai'], '^0.82.1')
  for (const [name, range] of Object.entries(packageJson.peerDependencies)) {
    assert.equal(packageJson.peerDependenciesMeta[name]?.optional, true, `${name} is supplied by the Harness host`)
    assert.equal(packageJson.devDependencies[name], range, `${name} is available for local development`)
  }
  assert.equal(packageJson.exports['./client'], './client.cjs')
  assert.equal(packageJson.dsh.client.platform, 'web')
  assert.match(patch, /id: llm-sinapisai/)
  assert.match(patch, /name: '@sinapisai\/dsh-provider'/)
  assert.match(patch, /provider: sinapisai/)
  assert.match(patch, /model: sinapisai\/router/)
  assert.doesNotMatch(patch, /llm-pi-ai|\bapi:|apiKey/)
  assert.match(host, /registerAdapter\(\[PROVIDER_ID\]/)
  assert.match(host, /registerModelDiscovery\(SETTINGS_NAMESPACE/)
  assert.match(host, /registerConfigurableProviders/)
  assert.match(host, /openAICompletionsApi\(\)/)
  assert.match(host, /model\.input/)
  assert.match(host, /configuredMaxTokens: new Map\(\)/)
  assert.match(client, /settings\.section/)
  assert.match(client, /id: '@sinapisai\/dsh-provider'/)
  assert.match(client, /discoverModels/)
  assert.match(client, /type: 'search'/)
  assert.match(client, /credentials\.set\(\{ ref: keyRef/)
  assert.doesNotMatch(host + patch + client, /dsh-sinapisai|sinapisai-harness-plugin/)
  assert.doesNotMatch(host + patch + client, /\bsk-[A-Za-z0-9_-]{8,}/)
})
