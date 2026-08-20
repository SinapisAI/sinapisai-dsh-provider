window.__ModuleLoader__.load({
  id: '@sinapisai/dsh-provider',
  factory: (require) => {
    var module = { exports: {} }
    const React = require('react')
    const h = React.createElement
    const NS = 'llm-sinapisai'
    const PROVIDER = 'sinapisai'
    const DEFAULT_KEY_REF = 'SINAPISAI_API_KEY'
    const ROUTER = {
      id: 'sinapisai/router',
      name: 'SinapisAI Router',
      contextWindow: 128000,
      maxTokens: 8192,
    }

    const dictionaries = {
      en: {
        nav: 'SinapisAI',
        title: 'SinapisAI',
        subtitle: 'OpenAI-compatible API with automatic model routing',
        protocol: 'The OpenAI protocol and API endpoint are built in.',
        apiKey: 'API key',
        configured: 'Configured - enter a new value to replace it',
        missing: 'Enter your SinapisAI API key',
        models: 'Models',
        router: 'Default router',
        fetch: 'Load or refresh models',
        fetching: 'Loading model catalog...',
        search: 'Search by model ID or name',
        selected: 'Selected models',
        noResults: 'No matching TEXT models',
        context: 'Context',
        output: 'Max output',
        remove: 'Remove',
        save: 'Save',
        saving: 'Saving...',
        saved: 'Saved',
        loading: 'Loading settings...',
        loadFailed: 'Failed to load settings',
        catalogFailed: 'Failed to load model catalog',
      },
      zh: {
        nav: '\u0053\u0069\u006e\u0061\u0070\u0069\u0073\u0041\u0049',
        title: '\u0053\u0069\u006e\u0061\u0070\u0069\u0073\u0041\u0049',
        subtitle: '\u517c\u5bb9\u0020\u004f\u0070\u0065\u006e\u0041\u0049\u0020\u7684\u81ea\u52a8\u6a21\u578b\u8def\u7531\u670d\u52a1',
        protocol: '\u004f\u0070\u0065\u006e\u0041\u0049\u0020\u534f\u8bae\u548c\u0020\u0041\u0050\u0049\u0020\u5730\u5740\u5df2\u5185\u7f6e\u3002',
        apiKey: '\u0041\u0050\u0049\u0020\u5bc6\u94a5',
        configured: '\u5df2\u914d\u7f6e\uff0c\u8f93\u5165\u65b0\u503c\u53ef\u66ff\u6362',
        missing: '\u8bf7\u8f93\u5165\u0020\u0053\u0069\u006e\u0061\u0070\u0069\u0073\u0041\u0049\u0020\u0041\u0050\u0049\u0020\u5bc6\u94a5',
        models: '\u6a21\u578b',
        router: '\u9ed8\u8ba4\u8def\u7531\u6a21\u578b',
        fetch: '\u83b7\u53d6\u6216\u5237\u65b0\u6a21\u578b',
        fetching: '\u6b63\u5728\u52a0\u8f7d\u6a21\u578b\u76ee\u5f55\u2026',
        search: '\u6309\u6a21\u578b\u0020\u0049\u0044\u0020\u6216\u540d\u79f0\u641c\u7d22',
        selected: '\u5df2\u9009\u6a21\u578b',
        noResults: '\u6ca1\u6709\u5339\u914d\u7684\u0020\u0054\u0045\u0058\u0054\u0020\u6a21\u578b',
        context: '\u4e0a\u4e0b\u6587',
        output: '\u6700\u5927\u8f93\u51fa',
        remove: '\u79fb\u9664',
        save: '\u4fdd\u5b58',
        saving: '\u6b63\u5728\u4fdd\u5b58\u2026',
        saved: '\u5df2\u4fdd\u5b58',
        loading: '\u6b63\u5728\u52a0\u8f7d\u8bbe\u7f6e\u2026',
        loadFailed: '\u52a0\u8f7d\u8bbe\u7f6e\u5931\u8d25',
        catalogFailed: '\u52a0\u8f7d\u6a21\u578b\u76ee\u5f55\u5931\u8d25',
      },
    }

    const styles = {
      page: { maxWidth: 760, padding: '8px 4px 36px', color: 'inherit' },
      title: { margin: '0 0 4px', fontSize: 22 },
      muted: { margin: '0 0 18px', opacity: 0.68, fontSize: 13 },
      card: {
        border: '1px solid color-mix(in srgb, currentColor 16%, transparent)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        background: 'color-mix(in srgb, currentColor 3%, transparent)',
      },
      label: { display: 'block', fontSize: 13, marginBottom: 7, fontWeight: 600 },
      input: {
        width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
        border: '1px solid color-mix(in srgb, currentColor 22%, transparent)',
        background: 'color-mix(in srgb, currentColor 4%, transparent)', color: 'inherit',
      },
      button: {
        border: '1px solid color-mix(in srgb, currentColor 24%, transparent)',
        borderRadius: 8, padding: '8px 12px', background: 'transparent',
        color: 'inherit', cursor: 'pointer',
      },
      primary: { borderRadius: 8, padding: '9px 18px', border: 0, cursor: 'pointer' },
      row: {
        display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid color-mix(in srgb, currentColor 10%, transparent)', padding: '10px 2px',
      },
      candidateList: { maxHeight: 340, overflow: 'auto', marginTop: 10 },
      badge: { fontSize: 12, opacity: 0.65, whiteSpace: 'nowrap' },
      error: { color: '#ef6464', fontSize: 13, marginTop: 10 },
      success: { color: '#43b581', fontSize: 13, marginTop: 10 },
    }

    function messageOf(error) {
      return error instanceof Error ? error.message : String(error)
    }

    function formatTokens(value) {
      if (!Number.isFinite(value)) return '-'
      if (value >= 1000000 && value % 1000000 === 0) return (value / 1000000) + 'M'
      if (value >= 1000 && value % 1000 === 0) return (value / 1000) + 'K'
      return Number(value).toLocaleString()
    }

    function score(model, query) {
      const q = query.trim().toLowerCase()
      if (q.length === 0) return 0
      const id = model.id.toLowerCase()
      const name = (model.name || '').toLowerCase()
      if (id === q) return 0
      if (id.startsWith(q)) return 1
      if (name.startsWith(q)) return 2
      if (id.includes(q)) return 3
      if (name.includes(q)) return 4
      const tokens = q.split(/\s+/).filter(Boolean)
      return tokens.every(token => id.includes(token) || name.includes(token)) ? 5 : Infinity
    }

    function SinapisAISection(props) {
      const api = props.api
      const t = props.t
      const [loading, setLoading] = React.useState(true)
      const [writable, setWritable] = React.useState(false)
      const [revision, setRevision] = React.useState(0)
      const [keyRef, setKeyRef] = React.useState(DEFAULT_KEY_REF)
      const [configuredKey, setConfiguredKey] = React.useState(false)
      const [keyValue, setKeyValue] = React.useState('')
      const [selected, setSelected] = React.useState(new Map())
      const [candidates, setCandidates] = React.useState([])
      const [query, setQuery] = React.useState('')
      const [catalogBusy, setCatalogBusy] = React.useState(false)
      const [saving, setSaving] = React.useState(false)
      const [failure, setFailure] = React.useState('')
      const [notice, setNotice] = React.useState('')

      const load = React.useCallback(async () => {
        setLoading(true)
        setFailure('')
        try {
          const settingsResponse = await api.settings.describe({})
          if (!settingsResponse.result.ok) throw new Error(settingsResponse.result.error.message)
          const body = settingsResponse.result.value
          const view = body.namespaces.find(entry => entry.ns === NS)
          if (view === undefined) throw new Error('SinapisAI settings namespace is unavailable')
          const resolvedKeyRef = typeof view.value.apiKeyEnv === 'string' && view.value.apiKeyEnv.trim().length > 0
            ? view.value.apiKeyEnv.trim()
            : DEFAULT_KEY_REF
          const credentialsResponse = await api.credentials.describe({ refs: [resolvedKeyRef] })
          setWritable(body.writable)
          setRevision(view.revision)
          setKeyRef(resolvedKeyRef)
          const models = Array.isArray(view.value.models) ? view.value.models : []
          setSelected(new Map(models.filter(model => model && model.id !== ROUTER.id).map(model => [model.id, model])))
          setConfiguredKey(false)
          if (credentialsResponse.result.ok) {
            setConfiguredKey(credentialsResponse.result.value.credentials[resolvedKeyRef]?.configured === true)
          }
        } catch (error) {
          setFailure(t('loadFailed') + ': ' + messageOf(error))
        } finally {
          setLoading(false)
        }
      }, [api, t])

      React.useEffect(() => { void load() }, [load])

      async function fetchModels() {
        setCatalogBusy(true)
        setFailure('')
        setNotice('')
        try {
          const response = await api.llm.discoverModels({ settingsNs: NS, provider: PROVIDER })
          if (!response.result.ok) throw new Error(response.result.error.message)
          const found = response.result.value.models.filter(model => model.id !== ROUTER.id)
          setCandidates(found)
          setSelected(current => {
            const next = new Map(current)
            for (const model of found) if (next.has(model.id)) next.set(model.id, model)
            return next
          })
        } catch (error) {
          setFailure(t('catalogFailed') + ': ' + messageOf(error))
        } finally {
          setCatalogBusy(false)
        }
      }

      function toggle(model) {
        setSelected(current => {
          const next = new Map(current)
          if (next.has(model.id)) next.delete(model.id)
          else next.set(model.id, model)
          return next
        })
      }

      async function save() {
        setSaving(true)
        setFailure('')
        setNotice('')
        try {
          const models = [...selected.values()].map(model => ({
            id: model.id,
            ...(model.name === undefined ? {} : { name: model.name }),
            ...(model.contextWindow === undefined ? {} : { contextWindow: model.contextWindow }),
            ...(model.maxTokens === undefined ? {} : { maxTokens: model.maxTokens }),
          }))
          const response = await api.settings.mutate({
            ns: NS,
            ops: [{ op: 'set', path: ['models'], value: models }],
            expectedRevision: revision,
          })
          if (!response.result.ok) throw new Error(response.result.error.message)
          setRevision(response.result.value.revision)
          if (keyValue.trim().length > 0) {
            const keyResponse = await api.credentials.set({ ref: keyRef, value: keyValue.trim() })
            if (!keyResponse.result.ok) throw new Error(keyResponse.result.error.message)
            setConfiguredKey(true)
            setKeyValue('')
          }
          setNotice(t('saved'))
        } catch (error) {
          setFailure(messageOf(error))
        } finally {
          setSaving(false)
        }
      }

      const visible = candidates
        .map(model => ({ model, rank: score(model, query) }))
        .filter(entry => Number.isFinite(entry.rank))
        .sort((a, b) => a.rank - b.rank || a.model.id.localeCompare(b.model.id))
        .slice(0, 100)
        .map(entry => entry.model)

      function modelRow(model, removable) {
        return h('div', { key: model.id, style: styles.row },
          h('div', null,
            h('div', { style: { fontWeight: 600, fontSize: 14 } }, model.name || model.id),
            model.name && model.name !== model.id
              ? h('div', { style: { opacity: 0.58, fontSize: 12, marginTop: 2 } }, model.id)
              : null,
          ),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
            h('span', { style: styles.badge },
              t('context') + ' ' + formatTokens(model.contextWindow) + ' / ' +
              t('output') + ' ' + formatTokens(model.maxTokens),
            ),
            removable
              ? h('button', { type: 'button', style: styles.button, onClick: () => toggle(model) }, t('remove'))
              : h('span', { style: styles.badge }, t('router')),
          ),
        )
      }

      if (loading) return h('div', { style: styles.page }, t('loading'))

      return h('section', { style: styles.page },
        h('h2', { style: styles.title }, t('title')),
        h('p', { style: styles.muted }, t('subtitle')),
        h('div', { style: styles.card },
          h('label', { style: styles.label }, t('apiKey')),
          h('input', {
            type: 'password',
            autoComplete: 'off',
            style: styles.input,
            value: keyValue,
            disabled: !writable || saving,
            placeholder: configuredKey ? t('configured') : t('missing'),
            onChange: event => setKeyValue(event.target.value),
          }),
          h('p', { style: { ...styles.muted, marginTop: 8, marginBottom: 0 } }, t('protocol')),
        ),
        h('div', { style: styles.card },
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 } },
            h('div', null,
              h('strong', null, t('models')),
              h('div', { style: { opacity: 0.6, fontSize: 12, marginTop: 3 } },
                'https://api.sinapisai.com/api/v1/catalog/models?sort=released',
              ),
            ),
            h('button', {
              type: 'button', style: styles.button, disabled: catalogBusy,
              onClick: () => { void fetchModels() },
            }, catalogBusy ? t('fetching') : t('fetch')),
          ),
          h('div', { style: { marginTop: 12 } }, modelRow(ROUTER, false)),
          [...selected.values()].map(model => modelRow(model, true)),
          candidates.length > 0
            ? h(React.Fragment, null,
              h('input', {
                type: 'search', style: { ...styles.input, marginTop: 12 },
                value: query, placeholder: t('search'),
                onChange: event => setQuery(event.target.value),
              }),
              h('div', { style: styles.candidateList },
                visible.length === 0
                  ? h('p', { style: styles.muted }, t('noResults'))
                  : visible.map(model => h('label', { key: model.id, style: styles.row },
                    h('span', { style: { display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 } },
                      h('input', {
                        type: 'checkbox',
                        checked: selected.has(model.id),
                        onChange: () => toggle(model),
                      }),
                      h('span', null,
                        h('span', { style: { fontWeight: 600 } }, model.name || model.id),
                        h('span', { style: { display: 'block', opacity: 0.58, fontSize: 12 } }, model.id),
                      ),
                    ),
                    h('span', { style: styles.badge },
                      formatTokens(model.contextWindow) + ' / ' + formatTokens(model.maxTokens),
                    ),
                  )),
              ),
            )
            : null,
        ),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' } },
          h('button', {
            type: 'button', style: styles.primary, disabled: !writable || saving,
            onClick: () => { void save() },
          }, saving ? t('saving') : t('save')),
        ),
        failure ? h('p', { style: styles.error }, failure) : null,
        notice ? h('p', { style: styles.success }, notice) : null,
      )
    }

    const name = 'sinapisai-client'
    const inject = ['slots', 'locale', 'connection']
    function apply(ctx) {
      ctx.effect(
        () => ctx.locale.register('settings.sinapisai', dictionaries),
        'sinapisai: settings translations',
      )
      const t = ctx.locale.bind('settings.sinapisai')
      const api = ctx.get('connection').api
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'sinapisai',
        order: 15,
        label: () => t('nav'),
        locale: 'settings.sinapisai',
        inject: () => ({ api, t }),
      }, SinapisAISection))
    }

    module.exports = { name, inject, apply }
    return module.exports
  },
})
