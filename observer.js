export const SINAPISAI_PROVIDER_ID = 'sinapisai'
export const SINAPISAI_ROUTER_MODEL_ID = 'sinapisai/router'

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function routedModelFromSource(source) {
  if (!isRecord(source) || source.kind !== 'model' || source.provider !== SINAPISAI_PROVIDER_ID) return undefined
  if (source.model !== SINAPISAI_ROUTER_MODEL_ID) return undefined
  const response = source.replayState?.response
  if (!isRecord(response) || response.kind !== 'pi-ai' || response.version !== 2) return undefined
  if (response.provider !== source.provider || response.model !== source.model) return undefined
  if (typeof response.responseModel !== 'string') return undefined
  const model = response.responseModel.trim()
  return model.length === 0 || model === source.model ? undefined : model
}

export function installRoutedModelObserver(ctx) {
  ctx.on('session/event', (_session, event) => {
    if (event?.type !== 'assistant/message') return
    const source = event.data?.message?.source
    const routedModel = routedModelFromSource(source)
    if (routedModel !== undefined) {
      ctx.logger.info('sinapisai: routed %s to %s', source.model, routedModel)
    }
  })
}
