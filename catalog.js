const COLLECTION_KEYS = ['models', 'items', 'results', 'content']

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function collectionOf(payload) {
  if (Array.isArray(payload)) return payload
  if (!isRecord(payload)) return []
  for (const key of COLLECTION_KEYS) {
    if (Array.isArray(payload[key])) return payload[key]
  }
  if (isRecord(payload.data)) return collectionOf(payload.data)
  return Array.isArray(payload.data) ? payload.data : []
}

function text(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function positiveInteger(...values) {
  for (const value of values) {
    const parsed = typeof value === 'string' && value.trim().length > 0 ? Number(value) : value
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed
  }
  return undefined
}

function hasTextCapability(value) {
  if (typeof value === 'string') return value.trim().toUpperCase() === 'TEXT'
  return Array.isArray(value) && value.some(hasTextCapability)
}

function acceptsImageInput(tags) {
  if (!Array.isArray(tags)) return false
  return tags.some(tag => isRecord(tag)
    && text(tag.groupKey)?.toLowerCase() === 'input_modality'
    && text(tag.tagKey)?.toLowerCase() === 'image')
}

export function parseTextModelCatalog(payload) {
  const seen = new Set()
  const models = []
  for (const raw of collectionOf(payload)) {
    if (!isRecord(raw) || raw.enabled === false || !hasTextCapability(raw.capability ?? raw.capabilities)) continue
    const id = text(raw.id) ?? text(raw.modelId) ?? text(raw.model) ?? text(raw.slug)
    if (id === undefined || seen.has(id)) continue
    seen.add(id)
    const name = text(raw.displayName) ?? text(raw.name)
    const contextWindow = positiveInteger(
      raw.contextWindow, raw.contextLength, raw.maxContextTokens, raw.context_window, raw.context_length,
    )
    const maxTokens = positiveInteger(
      raw.maxCompletionTokens, raw.maxOutputTokens, raw.maxTokens,
      raw.max_completion_tokens, raw.max_output_tokens,
    )
    models.push({
      id,
      ...(name === undefined ? {} : { name }),
      ...(contextWindow === undefined ? {} : { contextWindow }),
      ...(maxTokens === undefined ? {} : { maxTokens }),
      input: acceptsImageInput(raw.tags) ? ['text', 'image'] : ['text'],
    })
  }
  return models
}

export function mergeConfiguredModels(configured = [], live = [], router) {
  const liveById = new Map(live.map(model => [model.id, model]))
  const result = [{ ...router, ...(liveById.get(router.id) ?? {}) }]
  const seen = new Set([router.id])
  for (const stored of configured) {
    if (!isRecord(stored)) continue
    const id = text(stored.id)
    if (id === undefined || seen.has(id)) continue
    seen.add(id)
    // Only the live catalog may grant image input. Stored values are an
    // offline fallback for identity and capacity, never capability evidence.
    const { input: _storedInput, ...storedMetadata } = stored
    result.push({ ...storedMetadata, input: ['text'], ...(liveById.get(id) ?? {}), id })
  }
  return result
}

export class CatalogCache {
  constructor({
    url,
    fetchImpl = globalThis.fetch,
    ttlMs = 300_000,
    timeoutMs = 15_000,
    onWarning = () => {},
  }) {
    this.url = url
    this.fetchImpl = fetchImpl
    this.ttlMs = ttlMs
    this.timeoutMs = timeoutMs
    this.onWarning = onWarning
    this.models = []
    this.expiresAt = 0
    this.pending = undefined
    this.revision = 0
  }

  peek() { return this.models }

  async refresh({ force = false } = {}) {
    if (!force && Date.now() < this.expiresAt) return this.models
    if (this.pending !== undefined) return this.pending
    this.pending = this.#load().finally(() => { this.pending = undefined })
    return this.pending
  }

  async #load() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    timer.unref?.()
    try {
      const response = await this.fetchImpl(this.url, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`catalog returned HTTP ${response.status}`)
      const parsed = parseTextModelCatalog(await response.json())
      if (parsed.length === 0) throw new Error('catalog returned no TEXT models')
      this.models = parsed
      this.expiresAt = Date.now() + this.ttlMs
      this.revision += 1
      return this.models
    } catch (error) {
      this.onWarning(error)
      if (this.models.length > 0) return this.models
      throw error
    } finally {
      clearTimeout(timer)
    }
  }
}
