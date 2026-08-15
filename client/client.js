// 表情包插件（DSH 静态 bundle 版）Client 半
// 由动态版 v3 改造：host.call/styles 改为静态 shim，其余组件代码原样
window.__ModuleLoader__.load({
  id: 'dsh-biaoqingbao',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    let React = require('react')

    // ── 静态模式 shim：RPC 走 HTTP 路由，CSS 手动插 style 标签 ──
    function hostCall(method, args) {
      return fetch('/biaoqingbao/' + method, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args || {})
      }).then(r => r.json())
    }
    const host = { call: hostCall }
    const styles = {
      insert(css) {
        if (typeof document === 'undefined') return
        const tagId = 'dsh-biaoqingbao-css'
        if (document.querySelector('style[data-plugin-css="' + tagId + '"]')) return
        const tag = document.createElement('style')
        tag.dataset.plugin = 'dsh-biaoqingbao'
        tag.dataset.pluginCss = tagId
        tag.textContent = css
        document.head.appendChild(tag)
      }
    }

    // ── 组件代码（动态版原样） ──
    const apply = function apply(ctx) {
    const slots = ctx.slots !== undefined ? ctx.slots : ctx.get('slots')
    if (slots === undefined) return

    styles.insert(`
.bqb-card{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);max-width:340px;margin:4px 0}
.bqb-card-pending{color:var(--dsw-alias-label-secondary);font-size:13px}
.bqb-card-msg{color:var(--dsw-alias-label-secondary);font-size:13px;white-space:pre-wrap}
.bqb-card-img{max-width:300px;max-height:240px;border-radius:8px;display:block;object-fit:contain;background:var(--dsw-alias-bg-base)}
.bqb-card-img-empty{height:80px;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);font-size:12px;background:var(--dsw-alias-bg-base)}
.bqb-card-meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px;color:var(--dsw-alias-label-secondary)}
.bqb-card-desc{color:var(--dsw-alias-label-primary)}
.bqb-card-emotion{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:1px 8px}
.bqb-card-score{color:var(--dsw-alias-label-tertiary)}
.bqb-fb{display:flex;gap:8px}
.bqb-fb-btn{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:10px;padding:2px 10px;font-size:12px;cursor:pointer}
.bqb-fb-btn:hover{color:var(--dsw-alias-label-primary)}
.bqb-fb-msg{font-size:12px;color:var(--dsw-alias-state-success-primary)}
.bqb-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:900}
.bqb-panel{position:fixed;top:0;right:0;bottom:0;width:480px;max-width:94vw;background:var(--dsw-alias-bg-overlay);border-left:1px solid var(--dsw-alias-border-l2);z-index:901;display:flex;flex-direction:column;box-shadow:-8px 0 24px rgba(0,0,0,.18)}
.bqb-panel-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}
.bqb-panel-title{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary)}
.bqb-btn{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 12px;font-size:13px;cursor:pointer;font-family:inherit}
.bqb-btn:hover{background:var(--dsw-alias-bg-layer-1)}
.bqb-btn-primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.bqb-btn-danger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.bqb-tabs{display:flex;gap:4px;padding:8px 16px 0;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}
.bqb-tab{border:none;background:none;color:var(--dsw-alias-label-secondary);padding:6px 12px;font-size:13px;cursor:pointer;border-bottom:2px solid transparent;font-family:inherit}
.bqb-tab-active{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary)}
.bqb-toolbar{display:flex;gap:8px;padding:10px 16px;align-items:center;flex:none;flex-wrap:wrap}
.bqb-search{flex:1;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:8px;padding:5px 10px;font-size:13px;outline:none;font-family:inherit;min-width:120px}
.bqb-stats{padding:0 16px 8px;font-size:12px;color:var(--dsw-alias-label-tertiary);flex:none}
.bqb-grid{flex:1;overflow-y:auto;padding:8px 16px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px;align-content:start}
.bqb-cell{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;overflow:hidden;cursor:pointer;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column}
.bqb-cell:hover{border-color:var(--dsw-alias-border-l2)}
.bqb-cell-img{width:100%;height:90px;object-fit:cover;display:block;background:var(--dsw-alias-bg-base)}
.bqb-cell-img-loading{height:90px;background:var(--dsw-alias-bg-layer-2)}
.bqb-cell-label{padding:4px 6px;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bqb-cell-badge{position:absolute;top:4px;right:4px;background:var(--dsw-alias-state-warn-primary);color:#fff;font-size:9px;border-radius:6px;padding:0 5px}
.bqb-cell-wrap{position:relative}
.bqb-detail{padding:12px 16px;overflow-y:auto;display:flex;flex-direction:column;gap:10px}
.bqb-detail-img{max-width:100%;max-height:260px;border-radius:10px;object-fit:contain;background:var(--dsw-alias-bg-base)}
.bqb-field{display:flex;flex-direction:column;gap:4px}
.bqb-field label{font-size:12px;color:var(--dsw-alias-label-secondary)}
.bqb-input,.bqb-textarea{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 10px;font-size:13px;outline:none;font-family:inherit}
.bqb-textarea{min-height:56px;resize:vertical}
.bqb-detail-actions{display:flex;gap:8px;margin-top:4px;flex-wrap:wrap}
.bqb-empty{padding:32px 16px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.9}
.bqb-msg{padding:0 16px 8px;font-size:12px;color:var(--dsw-alias-state-success-primary);flex:none}
.bqb-msg-error{color:var(--dsw-alias-state-error-primary)}
.bqb-prefs{padding:12px 16px;overflow-y:auto;display:flex;flex-direction:column;gap:10px}
.bqb-pref-row{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px;background:var(--dsw-alias-bg-layer-1)}
.bqb-pref-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px}
.bqb-pref-emotion{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
.bqb-pref-weight{font-size:11px;color:var(--dsw-alias-label-tertiary);flex:none}
.bqb-chip{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);border-radius:10px;padding:1px 8px;font-size:11px;color:var(--dsw-alias-label-secondary);margin:2px 4px 2px 0}
.bqb-chip-x{cursor:pointer;color:var(--dsw-alias-label-tertiary)}
.bqb-chip-x:hover{color:var(--dsw-alias-state-error-primary)}
.bqb-sidebar-btn{background:none;border:none;color:inherit;cursor:pointer;font-size:13px;padding:4px 8px;font-family:inherit}
.bqb-sidebar-btn:hover{color:var(--dsw-alias-label-primary)}
.bqb-hint{font-size:11px;color:var(--dsw-alias-label-tertiary);line-height:1.6}
.bqb-select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:8px;padding:5px 10px;font-size:13px;outline:none;font-family:inherit}
.bqb-row{display:flex;align-items:center;gap:8px;margin-top:6px}
.bqb-row label{font-size:13px;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;gap:4px;cursor:pointer}
.bqb-check{accent-color:var(--dsw-alias-brand-primary)}
`)

    // ── 共享状态 ──
    const store = {
      open: false,
      tab: 'library',
      listeners: new Set(),
      emit() { for (const fn of [...this.listeners]) { try { fn() } catch (e) {} } },
      subscribe(fn) { this.listeners.add(fn); return () => { this.listeners.delete(fn) } },
    }
    const imageCache = new Map()

    function useStore() {
      const [, setTick] = React.useState(0)
      React.useEffect(() => store.subscribe(() => setTick(t => t + 1)), [])
      return store
    }

    // ═══════════════ 表情卡片（express 工具结果） ═══════════════
    function ExpressCard(props) {
      const block = props && props.block
      const settled = block && block.kind === 'tool-result'
      const [img, setImg] = React.useState(null)
      const [fb, setFb] = React.useState(null)
      let sticker = null
      let notice = null
      let error = null
      if (settled) {
        const meta = block.meta && typeof block.meta === 'object' ? block.meta : null
        if (meta && meta.sticker && meta.sticker.id) sticker = meta.sticker
        else if (meta && meta.notice) notice = meta.notice
        else if (meta && meta.error) error = meta.error
        else {
          const text = (block.content || []).filter(b => b && b.type === 'text').map(b => b.text).join('\n')
          try {
            const parsed = JSON.parse(text)
            if (parsed && parsed.data && parsed.data.sticker) {
              sticker = { id: parsed.data.sticker.id, description: parsed.data.sticker.description, emotion: parsed.data.emotion, score: parsed.data.sticker.score }
            } else if (parsed && parsed.data && parsed.data.message) notice = parsed.data.message
            else if (parsed && parsed.error) error = parsed.error
          } catch (e) { error = text || '发送失败' }
        }
      }
      const stickerId = sticker ? sticker.id : null
      React.useEffect(() => {
        if (!stickerId) return
        let alive = true
        if (imageCache.has(stickerId)) { setImg(imageCache.get(stickerId)); return }
        host.call('sticker-image', { id: stickerId }).then(r => {
          if (!alive) return
          if (r && r.dataUri) { imageCache.set(stickerId, r.dataUri); setImg(r.dataUri) } else setImg(null)
        }).catch(() => { if (alive) setImg(null) })
        return () => { alive = false }
      }, [stickerId])
      const onFeedback = (kind) => {
        if (!sticker || fb) return
        host.call('feedback', { sticker_id: sticker.id, emotion: sticker.emotion || '', kind }).then(r => {
          setFb(kind === 'positive' ? '已记下：喜欢，以后会多配这张图' : (r && r.dislike_count ? '已记下：不喜欢（累计 ' + r.dislike_count + ' 次，会慢慢少发）' : '已记下：不喜欢'))
        }).catch(() => setFb('反馈失败'))
      }
      if (!settled) {
        let emotion = null
        try { emotion = JSON.parse(block && block.argsRaw || '{}').emotion || null } catch (e) {}
        return React.createElement('div', { className: 'bqb-card bqb-card-pending' }, '表情包配图中…' + (emotion ? '（' + emotion + '）' : ''))
      }
      if (error) return React.createElement('div', { className: 'bqb-card' }, React.createElement('div', { className: 'bqb-card-msg' }, error))
      if (notice) return React.createElement('div', { className: 'bqb-card' }, React.createElement('div', { className: 'bqb-card-msg' }, notice))
      if (!sticker) return null
      return React.createElement('div', { className: 'bqb-card' },
        img ? React.createElement('img', { className: 'bqb-card-img', src: img, alt: sticker.description || '表情包' })
          : React.createElement('div', { className: 'bqb-card-img-empty' }, '图片加载中…'),
        React.createElement('div', { className: 'bqb-card-meta' },
          React.createElement('span', { className: 'bqb-card-desc' }, sticker.description || ''),
          sticker.emotion ? React.createElement('span', { className: 'bqb-card-emotion' }, '「' + sticker.emotion + '」') : null,
          typeof sticker.score === 'number' ? React.createElement('span', { className: 'bqb-card-score' }, '匹配度 ' + sticker.score) : null
        ),
        fb ? React.createElement('div', { className: 'bqb-fb-msg' }, fb)
          : React.createElement('div', { className: 'bqb-fb' },
              React.createElement('button', { className: 'bqb-fb-btn', onClick: () => onFeedback('positive') }, '👍 喜欢'),
              React.createElement('button', { className: 'bqb-fb-btn', onClick: () => onFeedback('negative') }, '👎 不喜欢')
            )
      )
    }

    // ═══════════════ 管理面板 ═══════════════
    function ManagerPanel(props) {
      const s = useStore()
      if (!s.open) return null
      return React.createElement('div', { className: 'bqb-root' },
        React.createElement('div', { className: 'bqb-backdrop', onClick: () => { s.open = false; s.emit() } }),
        React.createElement('div', { className: 'bqb-panel' },
          React.createElement('div', { className: 'bqb-panel-header' },
            React.createElement('span', { className: 'bqb-panel-title' }, '表情包'),
            React.createElement('button', { className: 'bqb-btn', onClick: () => { s.open = false; s.emit() } }, '✕')
          ),
          React.createElement('div', { className: 'bqb-tabs' },
            React.createElement('button', { className: 'bqb-tab' + (s.tab === 'library' ? ' bqb-tab-active' : ''), onClick: () => { s.tab = 'library'; s.emit() } }, '图库'),
            React.createElement('button', { className: 'bqb-tab' + (s.tab === 'prefs' ? ' bqb-tab-active' : ''), onClick: () => { s.tab = 'prefs'; s.emit() } }, '偏好与设置')
          ),
          s.tab === 'library' ? React.createElement(LibraryTab, null) : React.createElement(PrefsTab, null)
        )
      )
    }

    function CellImage(props) {
      const id = props.id
      const [src, setSrc] = React.useState(null)
      React.useEffect(() => {
        let alive = true
        if (imageCache.has(id)) { setSrc(imageCache.get(id)); return }
        host.call('sticker-image', { id }).then(r => {
          if (alive && r && r.dataUri) { imageCache.set(id, r.dataUri); setSrc(r.dataUri) }
        }).catch(() => {})
        return () => { alive = false }
      }, [id])
      return src ? React.createElement('img', { className: 'bqb-cell-img', src, alt: '' }) : React.createElement('div', { className: 'bqb-cell-img-loading' })
    }

    function LibraryTab(props) {
      const PAGE = 40
      const [items, setItems] = React.useState([])
      const [total, setTotal] = React.useState(0)
      const [query, setQuery] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [msg, setMsg] = React.useState('')
      const [msgError, setMsgError] = React.useState(false)
      const [detail, setDetail] = React.useState(null)
      const [uploading, setUploading] = React.useState(false)
      const [batchTagging, setBatchTagging] = React.useState(false)

      const load = (q, off) => {
        setBusy(true)
        host.call('list', { query: q || '', offset: off, limit: PAGE }).then(r => {
          if (r && r.ok) {
            if (off === 0) setItems(r.data.items)
            else setItems(prev => [...prev, ...r.data.items])
            setTotal(r.data.total)
          }
        }).catch(() => { setMsgError(true); setMsg('加载失败') }).finally(() => setBusy(false))
      }
      React.useEffect(() => { load('', 0) }, [])

      const onSearch = () => { setDetail(null); load(query, 0) }
      const onBatchTag = () => {
        if (batchTagging) return
        setBatchTagging(true)
        setMsg('批量识图中，请稍候…')
        setMsgError(false)
        host.call('vision-tag-all', {}).then(r => {
          if (r && r.ok) {
            const d = r.data
            setMsg(d.done > 0 ? '批量识图完成：成功 ' + d.done + ' 张' + (d.failed.length ? '，失败 ' + d.failed.length + ' 张' : '') : (d.total === 0 ? '没有未识图的图片' : '全部失败'))
            setMsgError(d.done === 0 && d.total > 0)
            load(query, 0)
          } else {
            setMsgError(true); setMsg('批量识图失败：' + (r && r.error || '未知错误'))
          }
        }).catch(() => { setMsgError(true); setMsg('批量识图失败') }).finally(() => setBatchTagging(false))
      }
      const onFiles = (e) => {
        const files = Array.from(e.target.files || [])
        e.target.value = ''
        if (!files.length) return
        const jobs = files.map(f => new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = String(reader.result || '')
            const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl)
            resolve(m ? { name: f.name, mediaType: m[1], data: m[2] } : null)
          }
          reader.onerror = () => resolve(null)
          reader.readAsDataURL(f)
        }))
        Promise.all(jobs).then(list => {
          const valid = list.filter(Boolean)
          if (!valid.length) { setMsgError(true); setMsg('没有可上传的图片'); return }
          setUploading(true)
          host.call('upload', { files: valid }).then(r => {
            if (r && r.ok) {
              setMsg(r.added > 0 ? '已添加 ' + r.added + ' 张' + ((valid.length - r.added) > 0 ? '（' + (valid.length - r.added) + ' 张被跳过）' : '') : '没有图片被添加')
              setMsgError(r.added === 0)
              load(query, 0)
            } else {
              setMsgError(true); setMsg('上传失败：' + (r && r.error || '未知错误'))
            }
          }).catch(() => { setMsgError(true); setMsg('上传失败') }).finally(() => setUploading(false))
        })
      }

      if (detail) {
        return React.createElement(DetailView, {
          detail,
          onBack: () => setDetail(null),
          onChanged: () => { load(query, 0) },
          onDeleted: () => { setDetail(null); load(query, 0) },
          onToast: (text, isError) => { setMsg(text); setMsgError(!!isError) }
        })
      }

      return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } },
        React.createElement('div', { className: 'bqb-toolbar' },
          React.createElement('input', { className: 'bqb-search', placeholder: '搜索情绪/场景/关键词…', value: query, onChange: e => setQuery(e.target.value), onKeyDown: e => { if (e.key === 'Enter') onSearch() } }),
          React.createElement('button', { className: 'bqb-btn', onClick: onSearch }, '搜索'),
          React.createElement('button', { className: 'bqb-btn', onClick: onBatchTag, disabled: batchTagging }, batchTagging ? '识图中…' : '批量识图'),
          React.createElement('label', { className: 'bqb-btn bqb-btn-primary', style: { cursor: 'pointer' } },
            uploading ? '上传中…' : '上传图片',
            React.createElement('input', { type: 'file', multiple: true, accept: 'image/png,image/jpeg,image/webp,image/gif', style: { display: 'none' }, onChange: onFiles })
          )
        ),
        React.createElement('div', { className: 'bqb-stats' }, '共 ' + total + ' 张' + (busy ? ' · 加载中…' : '') + ' · 批量识图会为未打标签的图片生成描述和标签（使用已配置的模型）'),
        msg ? React.createElement('div', { className: 'bqb-msg' + (msgError ? ' bqb-msg-error' : '') }, msg) : null,
        items.length === 0 && !busy
          ? React.createElement('div', { className: 'bqb-empty' }, total === 0 ? '图库还是空的。\n点击右上角「上传图片」，选择你收集的表情包（支持多选 PNG/JPG/WebP/GIF）。\n上传后助手就能在聊天中用它表达情绪了。' : '没有匹配的表情包')
          : React.createElement('div', { className: 'bqb-grid' },
              ...items.map(item => React.createElement('div', { key: item.id, className: 'bqb-cell-wrap' },
                React.createElement('div', { className: 'bqb-cell', onClick: () => { host.call('get', { id: item.id }).then(r => { if (r && r.ok) setDetail(r.data) }).catch(() => {}) } },
                  React.createElement(CellImage, { id: item.id }),
                  React.createElement('div', { className: 'bqb-cell-label' }, item.description || item.id)
                ),
                !item.tagged_at ? React.createElement('span', { className: 'bqb-cell-badge' }, '未识图') : null
              )),
              items.length < total ? React.createElement('button', { className: 'bqb-btn', style: { gridColumn: '1 / -1', justifySelf: 'center' }, onClick: () => load(query, items.length) }, '加载更多（' + (total - items.length) + '）') : null
            )
      )
    }

    function DetailView(props) {
      const d = props.detail
      const [description, setDescription] = React.useState(d.description || '')
      const [emotion, setEmotion] = React.useState((d.emotion || []).join(', '))
      const [scene, setScene] = React.useState((d.scene || []).join(', '))
      const [keywords, setKeywords] = React.useState((d.keywords || []).join(', '))
      const [semantic, setSemantic] = React.useState(d.semantic_description || '')
      const [saving, setSaving] = React.useState(false)
      const [confirming, setConfirming] = React.useState(false)
      const [tagging, setTagging] = React.useState(false)
      const [tagMsg, setTagMsg] = React.useState('')
      const [img, setImg] = React.useState(null)
      React.useEffect(() => {
        let alive = true
        if (imageCache.has(d.id)) { setImg(imageCache.get(d.id)); return }
        host.call('sticker-image', { id: d.id }).then(r => { if (alive && r && r.dataUri) { imageCache.set(d.id, r.dataUri); setImg(r.dataUri) } }).catch(() => {})
        return () => { alive = false }
      }, [d.id])
      const split = (s) => s.split(',').map(x => x.trim()).filter(Boolean)
      const onSave = () => {
        setSaving(true)
        host.call('update-tags', {
          id: d.id, description,
          emotion: split(emotion), scene: split(scene), keywords: split(keywords),
          semantic_description: semantic
        }).then(r => {
          props.onToast(r && r.ok ? '已保存' : '保存失败：' + (r && r.error || '未知错误'), !(r && r.ok))
          if (r && r.ok) props.onChanged()
        }).catch(() => props.onToast('保存失败', true)).finally(() => setSaving(false))
      }
      const onDelete = () => {
        if (!confirming) { setConfirming(true); return }
        host.call('delete', { id: d.id }).then(r => {
          if (r && r.ok) props.onDeleted()
          else { props.onToast('删除失败', true); setConfirming(false) }
        }).catch(() => { props.onToast('删除失败', true); setConfirming(false) })
      }
      const onTag = () => {
        if (tagging) return
        setTagging(true)
        setTagMsg('识图中…')
        host.call('vision-tag', { id: d.id }).then(r => {
          if (r && r.ok && r.data) {
            setTagMsg('识图完成，可继续修改后保存')
            setDescription(r.data.description || description)
            setEmotion((r.data.emotion || []).join(', '))
            setScene((r.data.scene || []).join(', '))
            setKeywords((r.data.keywords || []).join(', '))
            props.onChanged()
          } else {
            setTagMsg('识图失败：' + (r && r.error || '未知错误') + (r && r.raw ? '（返回：' + r.raw + '）' : ''))
          }
        }).catch(() => setTagMsg('识图失败')).finally(() => setTagging(false))
      }
      return React.createElement('div', { className: 'bqb-detail' },
        React.createElement('div', { className: 'bqb-detail-actions' },
          React.createElement('button', { className: 'bqb-btn', onClick: props.onBack }, '← 返回图库'),
          React.createElement('span', { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', alignSelf: 'center' } }, d.id + (d.tagged_at ? '' : ' · 未识图')),
          React.createElement('button', { className: 'bqb-btn bqb-btn-primary', onClick: onTag, disabled: tagging }, tagging ? '识图中…' : 'AI 识图')
        ),
        img ? React.createElement('img', { className: 'bqb-detail-img', src: img, alt: d.description || '' }) : React.createElement('div', { className: 'bqb-card-img-empty' }, '图片加载中…'),
        tagMsg ? React.createElement('div', { className: 'bqb-msg' + (tagMsg.indexOf('失败') >= 0 ? ' bqb-msg-error' : '') }, tagMsg) : null,
        React.createElement('div', { className: 'bqb-field' },
          React.createElement('label', null, '描述'),
          React.createElement('input', { className: 'bqb-input', value: description, onChange: e => setDescription(e.target.value) })
        ),
        React.createElement('div', { className: 'bqb-field' },
          React.createElement('label', null, '情绪标签（逗号分隔）'),
          React.createElement('input', { className: 'bqb-input', value: emotion, onChange: e => setEmotion(e.target.value), placeholder: '开心, 委屈, 得意' })
        ),
        React.createElement('div', { className: 'bqb-field' },
          React.createElement('label', null, '场景标签（逗号分隔）'),
          React.createElement('input', { className: 'bqb-input', value: scene, onChange: e => setScene(e.target.value), placeholder: '催回复, 调侃' })
        ),
        React.createElement('div', { className: 'bqb-field' },
          React.createElement('label', null, '关键词（逗号分隔）'),
          React.createElement('input', { className: 'bqb-input', value: keywords, onChange: e => setKeywords(e.target.value), placeholder: '猫, 委屈' })
        ),
        React.createElement('div', { className: 'bqb-field' },
          React.createElement('label', null, '语义描述（这张图适合回复什么）'),
          React.createElement('textarea', { className: 'bqb-textarea', value: semantic, onChange: e => setSemantic(e.target.value) })
        ),
        React.createElement('div', { className: 'bqb-detail-actions' },
          React.createElement('button', { className: 'bqb-btn bqb-btn-primary', onClick: onSave, disabled: saving }, saving ? '保存中…' : '保存'),
          confirming
            ? React.createElement('button', { className: 'bqb-btn bqb-btn-danger', onClick: onDelete }, '再点一次确认删除')
            : React.createElement('button', { className: 'bqb-btn bqb-btn-danger', onClick: onDelete }, '删除')
        )
      )
    }

    // ═══════════════ 偏好与设置 ═══════════════
    const DIALECT_OPTIONS = [
      { id: '', label: '（不选）' },
      { id: 'dongbei', label: '东北话' },
      { id: 'henan', label: '河南话' },
      { id: 'shanghai', label: '上海话' },
      { id: 'cantonese', label: '粤语' },
      { id: 'taiwan', label: '台湾腔' },
      { id: 'sichuan', label: '四川话' },
      { id: 'shaanxi', label: '陕西话' },
      { id: 'beijing', label: '北京话' },
      { id: 'xinjiang', label: '新疆话' },
    ]

    function PrefsTab(props) {
      const [mappings, setMappings] = React.useState([])
      const [enabled, setEnabled] = React.useState(true)
      const [visionProvider, setVisionProvider] = React.useState('')
      const [visionModel, setVisionModel] = React.useState('')
      const [observerOn, setObserverOn] = React.useState(false)
      const [observerFreq, setObserverFreq] = React.useState(30)
      const [dialectId, setDialectId] = React.useState('')
      const [dialectBoost, setDialectBoost] = React.useState(false)
      const [styleDraft, setStyleDraft] = React.useState('')
      const [styleCurrent, setStyleCurrent] = React.useState('')
      const [styleBusy, setStyleBusy] = React.useState(false)
      const [msg, setMsg] = React.useState('')
      const [msgError, setMsgError] = React.useState(false)
      const reload = () => {
        host.call('prefs-list', {}).then(r => { if (r && r.ok) setMappings(r.data.mappings) }).catch(() => {})
        host.call('config-get', {}).then(r => {
          if (r && r.ok) {
            setEnabled(r.data.enabled === true)
            setVisionProvider(r.data.visionProvider || '')
            setVisionModel(r.data.visionModel || '')
            setObserverOn(!!(r.data.observer && r.data.observer.enabled))
            setObserverFreq((r.data.observer && r.data.observer.frequency) || 30)
            setDialectId((r.data.dialect && r.data.dialect.id) || '')
            setDialectBoost(!!(r.data.dialect && r.data.dialect.boost))
            setStyleCurrent((r.data.style && r.data.style.current) || '')
            setStyleDraft((r.data.style && r.data.style.draft) || '')
          }
        }).catch(() => {})
      }
      React.useEffect(reload, [])
      const toast = (text, isError) => { setMsg(text); setMsgError(!!isError) }
      const saveBase = () => {
        host.call('config-set', { visionProvider, visionModel, observer: { enabled: observerOn, frequency: observerFreq }, dialect: { id: dialectId, boost: dialectBoost } }).then(r => {
          if (r && r.ok) toast('设置已保存', false)
          else toast('保存失败', true)
        }).catch(() => toast('保存失败', true))
      }
      const onAnalyze = (level) => {
        if (styleBusy) return
        setStyleBusy(true)
        toast('正在分析你的聊天记录（' + (level === 'deep' ? '深度，需要较长时间' : '快速') + '）…', false)
        host.call('style-analyze', { level }).then(r => {
          if (r && r.ok) {
            setStyleDraft(r.data.draft)
            toast('分析完成：共 ' + r.data.total + ' 条发言，采样 ' + r.data.sampled + ' 条。' + (r.data.problems && r.data.problems.length ? '（仍有问题：' + r.data.problems.join('；') + '）' : '可确认使用或重新分析。'), r.data.problems && r.data.problems.length > 0)
          } else {
            toast('分析失败：' + (r && r.error || '未知错误'), true)
          }
        }).catch(() => toast('分析失败', true)).finally(() => setStyleBusy(false))
      }
      const onConfirmStyle = () => {
        host.call('style-confirm', { draft: styleDraft }).then(r => {
          if (r && r.ok) { toast('已启用「学我说话」', false); reload() }
          else toast('确认失败：' + (r && r.error || '未知错误'), true)
        }).catch(() => toast('确认失败', true))
      }
      const onRevertStyle = () => {
        host.call('style-revert', {}).then(r => {
          if (r && r.ok) { toast('已回退上一版', false); reload() }
          else toast('回退失败：' + (r && r.error || '未知错误'), true)
        }).catch(() => toast('回退失败', true))
      }
      const removeMapping = (index) => {
        host.call('prefs-remove', { index }).then(r => { if (r && r.ok) reload(); else toast('删除失败', true) }).catch(() => toast('删除失败', true))
      }
      const removeItem = (index, list, stickerId) => {
        host.call('prefs-remove-item', { index, list, sticker_id: stickerId }).then(r => { if (r && r.ok) reload(); else toast('移除失败', true) }).catch(() => toast('移除失败', true))
      }
      return React.createElement('div', { className: 'bqb-prefs' },
        // 配图开关
        React.createElement('div', { className: 'bqb-pref-row', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement('span', { className: 'bqb-pref-emotion' }, '助手配图开关'),
          React.createElement('button', { className: 'bqb-btn' + (enabled ? ' bqb-btn-primary' : ''), onClick: () => { host.call('config-set', { enabled: !enabled }).then(r => { if (r && r.ok) { setEnabled(r.data.enabled === true); toast(r.data.enabled ? '已开启配图' : '已关闭配图', false) } }).catch(() => toast('操作失败', true)) } }, enabled ? '已开启' : '已关闭')
        ),
        React.createElement('div', { className: 'bqb-hint' }, '聊天中助手是否可以使用表情包表达情绪。关闭后 express 工具会拒绝发图。'),
        // 自动配图观察器
        React.createElement('div', { className: 'bqb-pref-row' },
          React.createElement('div', { className: 'bqb-pref-head' },
            React.createElement('span', { className: 'bqb-pref-emotion' }, '自动配图（观察器）'),
            React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: saveBase }, '保存')
          ),
          React.createElement('div', { className: 'bqb-row' },
            React.createElement('label', null, React.createElement('input', { type: 'checkbox', className: 'bqb-check', checked: observerOn, onChange: e => setObserverOn(e.target.checked) }), '开启：每轮对话分析情绪，有波动时提示助手发图'),
          ),
          React.createElement('div', { className: 'bqb-row' },
            React.createElement('label', { style: { flex: 'none' } }, '分析频率'),
            React.createElement('input', { type: 'number', className: 'bqb-input', style: { width: 64 }, value: observerFreq, min: 0, max: 100, onChange: e => setObserverFreq(parseInt(e.target.value, 10) || 0) }),
            React.createElement('span', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, '%（每轮触发情绪分析的概率，降低可省模型调用）')
          ),
          React.createElement('div', { className: 'bqb-hint', style: { marginTop: 6 } }, '默认关闭。开启后每轮可能调用一次模型分析情绪（使用已配置的模型），有一定成本。')
        ),
        // AI 识图模型
        React.createElement('div', { className: 'bqb-pref-row' },
          React.createElement('div', { className: 'bqb-pref-head' },
            React.createElement('span', { className: 'bqb-pref-emotion' }, 'AI 识图模型'),
            React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: saveBase }, '保存')
          ),
          React.createElement('div', { className: 'bqb-field' },
            React.createElement('label', null, 'Provider（留空则用当前会话默认模型）'),
            React.createElement('input', { className: 'bqb-input', value: visionProvider, onChange: e => setVisionProvider(e.target.value), placeholder: '如 deepseek-official' })
          ),
          React.createElement('div', { className: 'bqb-field', style: { marginTop: 6 } },
            React.createElement('label', null, '视觉模型 ID'),
            React.createElement('input', { className: 'bqb-input', value: visionModel, onChange: e => setVisionModel(e.target.value), placeholder: '如 deepseek-chat（需支持图片输入）' })
          ),
          React.createElement('div', { className: 'bqb-hint', style: { marginTop: 6 } }, '识图需要支持图片输入的模型。不配置时使用会话默认模型；若默认模型不支持图片，识图会失败，请在此指定一个视觉模型。')
        ),
        // 方言口音
        React.createElement('div', { className: 'bqb-pref-row' },
          React.createElement('div', { className: 'bqb-pref-head' },
            React.createElement('span', { className: 'bqb-pref-emotion' }, '方言口音'),
            React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: saveBase }, '保存')
          ),
          React.createElement('div', { className: 'bqb-row' },
            React.createElement('select', { className: 'bqb-select', value: dialectId, onChange: e => setDialectId(e.target.value) },
              ...DIALECT_OPTIONS.map(o => React.createElement('option', { key: o.id, value: o.id }, o.label))
            )
          ),
          React.createElement('div', { className: 'bqb-row' },
            React.createElement('label', null, React.createElement('input', { type: 'checkbox', className: 'bqb-check', checked: dialectBoost, onChange: e => setDialectBoost(e.target.checked) }), '加强版：每轮对话注入方言回响（正事场合自动让路）')
          ),
          React.createElement('div', { className: 'bqb-hint', style: { marginTop: 6 } }, '选择方言后，插件会把对应的口音设定注入系统提示词，助手打字自然带家乡味。选「（不选）」即关闭。')
        ),
        // 学我说话
        React.createElement('div', { className: 'bqb-pref-row' },
          React.createElement('div', { className: 'bqb-pref-head' },
            React.createElement('span', { className: 'bqb-pref-emotion' }, '学我说话'),
            React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: () => onAnalyze('light'), disabled: styleBusy }, styleBusy ? '分析中…' : '分析我的风格')
          ),
          React.createElement('div', { className: 'bqb-hint', style: { marginBottom: 6 } }, '分析你在各会话中的发言，提炼你的打字风格，让助手模仿你说话。可先「快速分析」，想要更准可选「深度分析」（全部记录分块蒸馏）。'),
          React.createElement('div', { className: 'bqb-row' },
            React.createElement('button', { className: 'bqb-btn', onClick: () => onAnalyze('deep'), disabled: styleBusy }, '深度分析'),
            styleCurrent ? React.createElement('button', { className: 'bqb-btn', onClick: onRevertStyle }, '回退上一版') : null
          ),
          styleCurrent ? React.createElement('div', { className: 'bqb-hint', style: { marginTop: 6 } }, '当前已启用「学我说话」风格（' + styleCurrent.length + ' 字）。方言选择会被覆盖为「学我说话」，可随时回退。') : null,
          styleDraft ? React.createElement('div', { className: 'bqb-field', style: { marginTop: 8 } },
            React.createElement('label', null, '风格模板草稿（可编辑后确认）'),
            React.createElement('textarea', { className: 'bqb-textarea', style: { minHeight: 120 }, value: styleDraft, onChange: e => setStyleDraft(e.target.value) }),
            React.createElement('div', { className: 'bqb-row' },
              React.createElement('button', { className: 'bqb-btn bqb-btn-primary', onClick: onConfirmStyle }, '确认使用'),
              React.createElement('button', { className: 'bqb-btn', onClick: () => setStyleDraft('') }, '放弃')
            )
          ) : null
        ),
        msg ? React.createElement('div', { className: 'bqb-msg' + (msgError ? ' bqb-msg-error' : '') }, msg) : null,
        React.createElement('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' } }, '偏好记录（聊天卡片上的 👍/👎 反馈会写入这里）：'),
        mappings.length === 0
          ? React.createElement('div', { className: 'bqb-empty' }, '还没有偏好记录。\n聊天中在表情卡片上点「喜欢 / 不喜欢」，助手就会逐渐学会你的喜好。')
          : mappings.map(m => React.createElement('div', { key: m.index, className: 'bqb-pref-row' },
              React.createElement('div', { className: 'bqb-pref-head' },
                React.createElement('span', { className: 'bqb-pref-emotion' }, m.emotion || '（无情绪上下文）'),
                React.createElement('span', { className: 'bqb-pref-weight' }, '权重 ' + m.weight),
                React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: () => removeMapping(m.index) }, '删除')
              ),
              m.preferred.length ? React.createElement('div', null,
                React.createElement('span', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, '喜欢：'),
                ...m.preferred.map(id => React.createElement('span', { key: 'p' + id, className: 'bqb-chip' }, id, React.createElement('span', { className: 'bqb-chip-x', onClick: () => removeItem(m.index, 'preferred', id) }, '×')))
              ) : null,
              m.vetoed.length ? React.createElement('div', null,
                React.createElement('span', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, '不喜欢（硬拉黑）：'),
                ...m.vetoed.map(id => React.createElement('span', { key: 'v' + id, className: 'bqb-chip' }, id, React.createElement('span', { className: 'bqb-chip-x', onClick: () => removeItem(m.index, 'vetoed', id) }, '×')))
              ) : null,
              m.dislikes.length ? React.createElement('div', null,
                React.createElement('span', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, '不喜欢（累计）：'),
                ...m.dislikes.map(e => React.createElement('span', { key: 'd' + e[0], className: 'bqb-chip' }, e[0] + ' ×' + e[1], React.createElement('span', { className: 'bqb-chip-x', onClick: () => removeItem(m.index, 'dislikes', e[0]) }, '×')))
              ) : null
            ))
      )
    }

    // ═══════════════ 侧栏入口 ═══════════════
    function SidebarButton(props) {
      const s = useStore()
      return React.createElement('button', {
        className: 'bqb-sidebar-btn',
        title: '表情包',
        onClick: () => { s.open = !s.open; s.emit() }
      }, props && props.wide ? '表情包' : '😀')
    }

    // ═══════════════ 注册 ═══════════════
    // ═══════════════ 注册 ═══════════════
    slots.inject('tool.call.toolview', () => slots.register(
      { name: 'tool.call.toolview', key: 'express' },
      (props) => React.createElement(ExpressCard, props)
    ))
    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'biaoqingbao-manager' },
      (props) => React.createElement(ManagerPanel, props)
    ))
    slots.inject('sidebar.footer.action', () => slots.register(
      { name: 'sidebar.footer.action', id: 'biaoqingbao' },
      (props) => React.createElement(SidebarButton, props)
    ))
    }

    exports.inject = ['slots']
    exports.apply = apply
    return module.exports
  }
})
