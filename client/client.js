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
.bqb-fb{display:flex;gap:8px;justify-content:center}
.bqb-fb-btn{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:10px;padding:2px 10px;font-size:12px;cursor:pointer}
.bqb-fb-btn:hover{color:var(--dsw-alias-label-primary)}
.bqb-fb-btn.on-pos{background:#5dae8e;border-color:#5dae8e;color:#fff}
.bqb-fb-btn.on-pos:hover{color:#fff}
.bqb-fb-btn.on-neg{background:#e89bb0;border-color:#e89bb0;color:#fff}
.bqb-fb-btn.on-neg:hover{color:#fff}
.bqb-fb-msg{font-size:12px;color:var(--dsw-alias-state-success-primary)}
.bqb-fb-tip{font-size:11px;color:var(--dsw-alias-label-tertiary);text-align:center}
/* 不喜欢后的聊聊邀请条（原版 v0.25.0 行为） */
.bqb-chat-invite{display:flex;align-items:center;gap:8px;background:#fdf4f7;border:1px dashed #e8b7c8;border-radius:8px;padding:6px 10px;font-size:11px;color:#8a5a68}
.bqb-chat-invite .invite-text{flex:1;line-height:1.5}
.bqb-chat-invite-btn{border:none;border-radius:999px;background:#e89bb0;color:#fff;font-size:11px;padding:4px 12px;cursor:pointer;flex-shrink:0;font-family:inherit}
.bqb-chat-invite-btn:hover{background:#df86a0}
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
/* 和助手聊聊：内联聊天 */
.bqb-chat{border-top:1px dashed var(--dsw-alias-border-l1);padding-top:8px;display:flex;flex-direction:column;gap:6px}
.bqb-chat-msgs{max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:6px}
.bqb-msg-user{align-self:flex-end;background:var(--dsw-alias-brand-primary);color:#fff;border-radius:10px 10px 2px 10px;padding:5px 10px;font-size:12px;max-width:86%;white-space:pre-wrap;word-break:break-word}
.bqb-msg-assistant{align-self:flex-start;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary);border-radius:10px 10px 10px 2px;padding:5px 10px;font-size:12px;max-width:86%;white-space:pre-wrap;word-break:break-word}
.bqb-msg-sys{align-self:center;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.bqb-msg-err{align-self:center;font-size:11px;color:var(--dsw-alias-state-error-primary)}
.bqb-chat-input{display:flex;gap:6px}
.bqb-chat-input input{flex:1;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:8px;padding:5px 10px;font-size:12px;outline:none;font-family:inherit}
.bqb-sug{border:1px solid var(--dsw-alias-state-warn-primary);background:var(--dsw-alias-bg-layer-2);border-radius:10px;padding:8px 10px;font-size:12px}
.bqb-sug-title{font-weight:600;color:var(--dsw-alias-label-primary);margin-bottom:6px}
.bqb-sug-diff{display:flex;flex-direction:column;gap:4px;color:var(--dsw-alias-label-secondary);line-height:1.5}
.bqb-sug-diff .old{color:var(--dsw-alias-label-tertiary);text-decoration:line-through}
.bqb-sug-diff .new{color:var(--dsw-alias-state-success-primary)}
.bqb-sug-actions{display:flex;gap:6px;margin-top:8px}
/* 决策日志 */
.bqb-log-entry{display:flex;align-items:center;gap:8px}
.bqb-log-thumb{width:40px;height:40px;border-radius:6px;object-fit:cover;background:var(--dsw-alias-bg-base);flex:none}
.bqb-log-thumb-empty{width:40px;height:40px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--dsw-alias-label-tertiary);flex:none}
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

    // ═══════════════ 和助手聊聊：内联聊天面板 ═══════════════
    function ChatPanel(props) {
      const stickerId = props && props.stickerId
      const [msgs, setMsgs] = React.useState([])
      const [input, setInput] = React.useState('')
      const [busy, setBusy] = React.useState(false)
      const [sid, setSid] = React.useState(null)
      const [suggestion, setSuggestion] = React.useState(null)
      const [oldTags, setOldTags] = React.useState(null)
      const [err, setErr] = React.useState(null)
      const send = () => {
        const text = input.trim()
        if (!text || busy || !stickerId) return
        setBusy(true)
        setErr(null)
        setInput('')
        setMsgs(ms => [...ms, { role: 'user', content: text }])
        host.call('chat', { sticker_id: stickerId, session_id: sid || '', message: text }).then(r => {
          setBusy(false)
          if (r && r.ok) {
            setSid(r.session_id)
            setMsgs(ms => [...ms, { role: 'assistant', content: r.reply }])
            if (r.suggestion) { setSuggestion(r.suggestion); setOldTags(r.old_tags || null) }
          } else {
            setMsgs(ms => ms.slice(0, -1))
            setErr((r && r.error) || '发送失败')
          }
        }).catch(() => {
          setBusy(false)
          setMsgs(ms => ms.slice(0, -1))
          setErr('发送失败')
        })
      }
      const applySug = () => {
        if (!sid || busy) return
        setBusy(true)
        host.call('chat-apply', { session_id: sid }).then(r => {
          setBusy(false)
          if (r && r.ok) {
            setSuggestion(null)
            setOldTags(null)
            setMsgs(ms => [...ms, { role: 'sys', content: '✅ 已应用修改建议，标签更新了' }])
          } else setErr((r && r.error) || '应用失败')
        }).catch(() => { setBusy(false); setErr('应用失败') })
      }
      const labelMap = { description: '描述', semantic_description: '语义描述', emotion: '情绪标签', scene: '场景标签', keywords: '关键词' }
      const sugKeys = suggestion ? Object.keys(labelMap).filter(k => suggestion[k] != null && !(Array.isArray(suggestion[k]) && suggestion[k].length === 0)) : []
      const fmt = (v) => Array.isArray(v) ? (v.length ? v.join('、') : '（空）') : (v ? String(v) : '（空）')
      return React.createElement('div', { className: 'bqb-chat' },
        React.createElement('div', { className: 'bqb-chat-msgs' },
          msgs.length === 0 && !busy && !err ? React.createElement('div', { className: 'bqb-msg-sys' }, '说说这张图配得哪里不对，助手会陪你一起调标签') : null,
          ...msgs.map((m, i) => React.createElement('div', { key: i, className: m.role === 'user' ? 'bqb-msg-user' : (m.role === 'sys' ? 'bqb-msg-sys' : 'bqb-msg-assistant') }, m.content)),
          busy ? React.createElement('div', { className: 'bqb-msg-sys' }, '助手思考中…') : null,
          err ? React.createElement('div', { className: 'bqb-msg-err' }, err) : null
        ),
        suggestion ? React.createElement('div', { className: 'bqb-sug' },
          React.createElement('div', { className: 'bqb-sug-title' }, '✨ 助手建议这样调整标签'),
          React.createElement('div', { className: 'bqb-sug-diff' },
            sugKeys.length === 0 ? React.createElement('div', null, '（没有需要调整的字段）')
              : sugKeys.map(k => React.createElement('div', { key: k },
                  React.createElement('span', { style: { marginRight: 6 } }, labelMap[k]),
                  React.createElement('span', { className: 'old' }, fmt(oldTags ? oldTags[k] : '')),
                  ' → ',
                  React.createElement('span', { className: 'new' }, fmt(suggestion[k]))
                ))
          ),
          React.createElement('div', { className: 'bqb-sug-actions' },
            React.createElement('button', { className: 'bqb-btn bqb-btn-primary', onClick: applySug, disabled: busy }, '✅ 应用修改'),
            React.createElement('button', { className: 'bqb-btn', onClick: () => { setSuggestion(null); setOldTags(null) }, disabled: busy }, '放弃')
          )
        ) : null,
        React.createElement('div', { className: 'bqb-chat-input' },
          React.createElement('input', { value: input, onChange: e => setInput(e.target.value), onKeyDown: e => { if (e.key === 'Enter') send() }, placeholder: '跟助手说说哪里不对…', disabled: busy }),
          React.createElement('button', { className: 'bqb-btn', onClick: send, disabled: busy || !input.trim() }, '发送')
        )
      )
    }

    // ═══════════════ 表情卡片（express 工具结果） ═══════════════
    function ExpressCard(props) {
      const block = props && props.block
      const settled = block && block.kind === 'tool-result'
      const [img, setImg] = React.useState(null)
      const [showFb, setShowFb] = React.useState(true)
      // 点赞：原版 v0.27.2 行为——每次出图重新选择，按钮不预置亮灯，点了才算数
      const [fbState, setFbState] = React.useState(null) // 'positive' | 'negative' | null（本卡片内当前选择）
      const [posMarked, setPosMarked] = React.useState(false)
      const [negMarked, setNegMarked] = React.useState(false)
      const [fbTip, setFbTip] = React.useState(null)
      const [inviteShow, setInviteShow] = React.useState(false) // 点过不喜欢后显示聊聊邀请条
      const [chatOpen, setChatOpen] = React.useState(false)
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
        let alive = true
        host.call('config-get', {}).then(r => { if (alive && r && r.ok) setShowFb(r.data.showFeedbackButtons !== false) }).catch(() => {})
        return () => { alive = false }
      }, [])
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
      // 反馈状态持久显示：预置选中态（点过的图再出现时按钮直接亮灯），每轮独立查询
      React.useEffect(() => {
        if (!stickerId) return
        let alive = true
        host.call('feedback-state', { sticker_id: stickerId, emotion: (sticker && sticker.emotion) || '' }).then(r => {
          if (!alive || !r || !r.ok || !r.data) return
          setFbState(r.data.state || null)
        }).catch(() => {})
        return () => { alive = false }
      }, [stickerId])
      // 提示文字 2.5 秒后自动消失
      React.useEffect(() => {
        if (!fbTip) return
        const t = setTimeout(() => setFbTip(null), 2500)
        return () => clearTimeout(t)
      }, [fbTip])
      // 点赞：同方向防重复，变心（切方向）允许重新表达（原版 v0.25.2）
      const onFeedback = (kind) => {
        if (!sticker) return
        if (kind === 'negative' && fbState === 'negative' && negMarked) { setFbTip('这张已经点过啦，下次它再出现再点，我会记得更牢'); return }
        if (kind === 'positive' && fbState === 'positive' && posMarked) { setFbTip('这张已经点过喜欢啦'); return }
        const prev = { fbState, posMarked, negMarked }
        // 乐观更新：先切状态，失败回滚
        setFbState(kind)
        setPosMarked(kind === 'positive')
        setNegMarked(kind === 'negative')
        host.call('feedback', { sticker_id: sticker.id, emotion: sticker.emotion || '', kind }).then(r => {
          if (r && r.ok) {
            if (kind === 'positive') {
              setInviteShow(false)
              setFbTip('已记下：喜欢')
            } else {
              setInviteShow(true)
              setFbTip('已记下：不喜欢（累计 ' + r.dislike_count + ' 次，会慢慢少发）')
            }
          } else {
            setFbState(prev.fbState)
            setPosMarked(prev.posMarked)
            setNegMarked(prev.negMarked)
            setFbTip((r && r.error) || '反馈失败')
          }
        }).catch(() => {
          setFbState(prev.fbState)
          setPosMarked(prev.posMarked)
          setNegMarked(prev.negMarked)
          setFbTip('反馈失败')
        })
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
        img ? React.createElement('img', { className: 'bqb-card-img', src: img, alt: '表情包' })
          : React.createElement('div', { className: 'bqb-card-img-empty' }, '图片加载中…'),
        showFb ? React.createElement('div', null,
          React.createElement('div', { className: 'bqb-fb' },
            React.createElement('button', { className: 'bqb-fb-btn' + (fbState === 'positive' ? ' on-pos' : ''), onClick: () => onFeedback('positive') }, '👍 喜欢'),
            React.createElement('button', { className: 'bqb-fb-btn' + (fbState === 'negative' ? ' on-neg' : ''), onClick: () => onFeedback('negative') }, '👎 不喜欢')
          ),
          inviteShow ? React.createElement('div', { className: 'bqb-chat-invite' },
            React.createElement('span', { className: 'invite-text' }, '觉得配图不精准？可以跟助手聊聊'),
            React.createElement('button', { className: 'bqb-chat-invite-btn', onClick: () => setChatOpen(!chatOpen) }, chatOpen ? '收起' : '聊聊')
          ) : null,
          fbTip ? React.createElement('div', { className: 'bqb-fb-tip' }, fbTip) : null
        ) : null,
        chatOpen ? React.createElement(ChatPanel, { stickerId }) : null
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
      const [autoTag, setAutoTag] = React.useState(false)

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
        readFilesToJobs(files).then(valid => {
          if (!valid.length) { setMsgError(true); setMsg('没有可上传的图片'); return }
          uploadInBatches(valid)
        })
      }
      const onFolderFiles = (e) => {
        const files = Array.from(e.target.files || [])
        e.target.value = ''
        if (!files.length) return
        const FOLDER_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']
        const images = files.filter(f => {
          const ext = (f.name.split('.').pop() || '').toLowerCase()
          return FOLDER_EXTS.indexOf(ext) >= 0
        })
        const skipped = files.length - images.length
        if (!images.length) {
          setMsgError(true)
          setMsg('文件夹里没找到图片（PNG/JPG/GIF/WebP/BMP）' + (skipped > 0 ? '，有 ' + skipped + ' 个其他文件被跳过' : ''))
          return
        }
        if (images.length > 200) {
          setMsgError(true)
          setMsg('文件夹里图片太多（' + images.length + ' 张），单次最多导入 200 张，请分批选择')
          return
        }
        setMsg('正在读取文件夹图片…')
        setMsgError(false)
        readFilesToJobs(images).then(valid => {
          if (!valid.length) { setMsgError(true); setMsg('没有可上传的图片'); return }
          setMsg('已从文件夹读取 ' + valid.length + ' 张图片' + (skipped > 0 ? '（自动跳过 ' + skipped + ' 个非图片文件）' : '') + '，开始上传…')
          uploadInBatches(valid)
        })
      }
      const onZipFile = (e) => {
        const file = e.target.files && e.target.files[0]
        e.target.value = ''
        if (!file) return
        if (file.size > 50 * 1024 * 1024) { setMsgError(true); setMsg('ZIP 文件不能超过 50MB'); return }
        if (uploading) return
        setUploading(true)
        setMsg('正在读取 ZIP…')
        setMsgError(false)
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = String(reader.result || '')
          setMsg('正在导入 ZIP…')
          host.call('import-zip', { zipBase64: dataUrl, fileName: file.name }).then(r => {
            if (r && r.ok) {
              const d = r.data || {}
              let text = r.message || ('成功导入 ' + d.imported + ' 张')
              if (d.skippedItems && d.skippedItems.length) {
                text += '\n跳过详情：' + d.skippedItems.map(s => s.file + '：' + s.reason).join('\n')
              }
              setMsg(text)
              setMsgError(false)
              load(query, 0)
              if (autoTag && d.importedIds && d.importedIds.length) {
                setTimeout(() => runTagQueue(d.importedIds), 300)
              }
            } else {
              setMsgError(true); setMsg('ZIP 导入失败：' + (r && r.error || '未知错误'))
            }
          }).catch(() => { setMsgError(true); setMsg('ZIP 导入失败') }).finally(() => setUploading(false))
        }
        reader.onerror = () => { setMsgError(true); setMsg('ZIP 读取失败'); setUploading(false) }
        reader.readAsDataURL(file)
      }
      const readFilesToJobs = (files) => {
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
        return Promise.all(jobs).then(list => list.filter(Boolean))
      }
      const runTagQueue = (ids) => {
        const list = ids.filter(Boolean)
        if (!list.length) return
        let done = 0
        const total = list.length
        setMsg('上传完成，后台识图中…（0/' + total + '）')
        setMsgError(false)
        const next = () => {
          if (done >= total) {
            setMsg('后台识图完成：' + total + ' 张')
            setMsgError(false)
            load(query, 0)
            return
          }
          const id = list[done]
          host.call('vision-tag', { id }).then(r => {
            done++
            setMsg('后台识图中…（' + done + '/' + total + '）' + (r && r.ok ? '' : '（失败：' + (r && r.error || '未知错误') + '）'))
            setMsgError(false)
            next()
          }).catch(() => {
            done++
            setMsg('后台识图中…（' + done + '/' + total + '）')
            next()
          })
        }
        next()
      }
      const uploadInBatches = (jobs) => {
        const BATCH = 40
        const total = jobs.length
        let idx = 0
        let addedTotal = 0
        const newIds = []
        setUploading(true)
        const run = () => {
          if (idx >= total) {
            const skipped = total - addedTotal
            setUploading(false)
            if (addedTotal > 0) {
              setMsg('已添加 ' + addedTotal + ' 张' + (skipped > 0 ? '（' + skipped + ' 张被跳过）' : ''))
              setMsgError(false)
              load(query, 0)
              if (autoTag && newIds.length) runTagQueue(newIds)
            } else {
              setMsg('没有图片被添加')
              setMsgError(true)
              load(query, 0)
            }
            return
          }
          const batch = jobs.slice(idx, idx + BATCH)
          idx += BATCH
          setMsg('上传中…（' + Math.min(idx, total) + '/' + total + '）')
          host.call('upload', { files: batch }).then(r => {
            if (r && r.ok) {
              addedTotal += r.added
              if (Array.isArray(r.addedIds)) newIds.push(...r.addedIds)
            }
            run()
          }).catch(() => { run() })
        }
        run()
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
            React.createElement('input', { type: 'file', multiple: true, accept: 'image/png,image/jpeg,image/webp,image/gif,image/bmp', style: { display: 'none' }, onChange: onFiles })
          ),
          React.createElement('label', { className: 'bqb-btn', style: { cursor: 'pointer' } },
            uploading ? '…' : '选文件夹',
            React.createElement('input', { type: 'file', webkitDirectory: '', multiple: true, style: { display: 'none' }, onChange: onFolderFiles })
          ),
          React.createElement('label', { className: 'bqb-btn', style: { cursor: 'pointer' } },
            uploading ? '…' : '导入 ZIP',
            React.createElement('input', { type: 'file', accept: '.zip', style: { display: 'none' }, onChange: onZipFile })
          ),
          React.createElement('label', { className: 'bqb-hint', style: { display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '0 4px' } },
            React.createElement('input', { type: 'checkbox', className: 'bqb-check', checked: autoTag, onChange: e => setAutoTag(e.target.checked) }),
            '上传后自动识图'
          )
        ),
        React.createElement('div', { className: 'bqb-stats' }, '共 ' + total + ' 张' + (busy ? ' · 加载中…' : '') + ' · 批量识图会为未打标签的图片生成描述和标签（使用已配置的模型）'),
        msg ? React.createElement('div', { className: 'bqb-msg' + (msgError ? ' bqb-msg-error' : ''), style: { whiteSpace: 'pre-wrap' } }, msg) : null,
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
    const FREQ_LEVELS = [
      { value: 0, label: '不配图', desc: '这个场景不主动提示配图' },
      { value: 15, label: '少配图', desc: '偶尔提示' },
      { value: 50, label: '正常', desc: '大约一半合适场景会提示' },
      { value: 90, label: '经常配图', desc: '大多数合适场景会提示' },
    ]
    // 就近归到档位（与存储值可能不一致时按最近档显示，照搬原版 freqToLevel）
    function freqToLevel(freq) {
      let best = FREQ_LEVELS[0]
      let minDiff = Infinity
      for (const l of FREQ_LEVELS) {
        const diff = Math.abs(freq - l.value)
        if (diff < minDiff) { minDiff = diff; best = l }
      }
      return best.value
    }
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

    function LogThumb(props) {
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
      return src ? React.createElement('img', { className: 'bqb-log-thumb', src, alt: '' }) : React.createElement('div', { className: 'bqb-log-thumb-empty' }, '图')
    }

    function PrefsTab(props) {
      const fmtTime = (ts) => {
        const d = new Date(ts)
        if (isNaN(d.getTime())) return ''
        const p = n => String(n).padStart(2, '0')
        return (d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
      }
      const [mappings, setMappings] = React.useState([])
      const [enabled, setEnabled] = React.useState(true)
      const [showFb, setShowFb] = React.useState(true)
      const [visionProvider, setVisionProvider] = React.useState('')
      const [visionModel, setVisionModel] = React.useState('')
      const [freqScene, setFreqScene] = React.useState('daily')
      const [freqDaily, setFreqDaily] = React.useState(50)
      const [freqTask, setFreqTask] = React.useState(20)
      const [dialectId, setDialectId] = React.useState('')
      const [dialectBoost, setDialectBoost] = React.useState(false)
      const [styleDraft, setStyleDraft] = React.useState('')
      const [styleCurrent, setStyleCurrent] = React.useState('')
      const [styleBusy, setStyleBusy] = React.useState(false)
      const [providers, setProviders] = React.useState([])
      const [embedCfg, setEmbedCfg] = React.useState({ customBaseUrl: '', customApiKey: '', customModel: '', customDimensions: 0, hasKey: false })
      const [vectorStatus, setVectorStatus] = React.useState(null)
      const [embedBusy, setEmbedBusy] = React.useState('') // '' | 'test' | 'index'
      const [visionBusy, setVisionBusy] = React.useState(false)
      const [msg, setMsg] = React.useState('')
      const [msgError, setMsgError] = React.useState(false)
      const [logEntries, setLogEntries] = React.useState([])
      const [logChat, setLogChat] = React.useState(null) // 展开聊天的日志条目索引
      const reload = () => {
        host.call('prefs-list', {}).then(r => { if (r && r.ok) setMappings(r.data.mappings) }).catch(() => {})
        host.call('config-get', {}).then(r => {
          if (r && r.ok) {
            setEnabled(r.data.enabled === true)
            setShowFb(r.data.showFeedbackButtons !== false)
            setVisionProvider(r.data.visionProvider || '')
            setVisionModel(r.data.visionModel || '')
            if (r.data.freq) { setFreqDaily(r.data.freq.daily); setFreqTask(r.data.freq.task) }
            setDialectId((r.data.dialect && r.data.dialect.id) || '')
            setDialectBoost(!!(r.data.dialect && r.data.dialect.boost))
            setStyleCurrent((r.data.style && r.data.style.current) || '')
            setStyleDraft((r.data.style && r.data.style.draft) || '')
            if (r.data.embedding) setEmbedCfg(r.data.embedding)
          }
        }).catch(() => {})
      }
      React.useEffect(reload, [])
      // 模型下拉 + 向量状态（与配置读取并发，独立计数器由各自 then 保护）
      React.useEffect(() => {
        host.call('list-models', {}).then(r => { if (r && r.ok && Array.isArray(r.data)) setProviders(r.data) }).catch(() => {})
        host.call('vector-status', {}).then(r => { if (r && r.ok) setVectorStatus(r.data) }).catch(() => {})
        host.call('decision-log-list', {}).then(r => { if (r && r.ok) setLogEntries(r.data || []) }).catch(() => {})
      }, [])
      const toast = (text, isError) => { setMsg(text); setMsgError(!!isError) }
      const currentProvider = providers.find(p => p.providerId === visionProvider) || null
      const currentModels = currentProvider ? currentProvider.models : []
      const providerSelValue = currentProvider ? currentProvider.providerId : '__custom__'
      const modelSelValue = currentModels.some(m => m.id === visionModel) ? visionModel : '__custom__'
      const onProviderChange = (id) => {
        const p = providers.find(x => x.providerId === id)
        setVisionProvider(id)
        if (p && p.models.length) setVisionModel(p.models[0].id)
        else setVisionModel('')
      }
      const onModelChange = (id) => setVisionModel(id)
      const testVision = () => {
        if (visionBusy) return
        setVisionBusy(true)
        toast('正在测试模型连通…', false)
        host.call('vision-test', { visionProvider, visionModel }).then(r => {
          if (r && r.ok) toast('连接正常：' + r.data.provider + ' / ' + r.data.model + (r.data.reply ? '（模型回复：' + r.data.reply + '）' : ''), false)
          else toast('测试失败：' + (r && r.error || '未知错误'), true)
        }).catch(() => toast('测试失败', true)).finally(() => setVisionBusy(false))
      }
      const saveEmbed = () => {
        host.call('embedding-config-set', { customBaseUrl: embedCfg.customBaseUrl, customApiKey: embedCfg.customApiKey, customModel: embedCfg.customModel }).then(r => {
          if (r && r.ok) { toast('向量检索配置已保存', false); reload() }
          else toast('保存失败：' + (r && r.error || '未知错误'), true)
        }).catch(() => toast('保存失败', true))
      }
      const testEmbed = () => {
        if (embedBusy) return
        setEmbedBusy('test')
        toast('正在测试连通…', false)
        host.call('embedding-test', { customBaseUrl: embedCfg.customBaseUrl, customApiKey: embedCfg.customApiKey, customModel: embedCfg.customModel }).then(r => {
          if (r && r.ok) toast('连接成功：返回 ' + r.data.dimensions + ' 维向量（' + r.data.model + '）', false)
          else toast('连接失败：' + (r && r.error || '未知错误'), true)
        }).catch(() => toast('连接失败', true)).finally(() => setEmbedBusy(''))
      }
      const genEmbed = () => {
        if (embedBusy) return
        setEmbedBusy('index')
        toast('正在为有语义描述的图片生成向量，请稍候…', false)
        host.call('generate-embeddings', {}).then(r => {
          if (r && r.ok) {
            const d = r.data
            toast('向量生成完成：成功 ' + d.processed + ' 张' + (d.failed > 0 ? '，失败 ' + d.failed + ' 张' : '') + (d.note ? '。' + d.note : ''), d.failed > 0 && d.processed === 0)
            host.call('vector-status', {}).then(s => { if (s && s.ok) setVectorStatus(s.data) }).catch(() => {})
          } else {
            toast('生成失败：' + (r && r.error || '未知错误'), true)
          }
        }).catch(() => toast('生成失败', true)).finally(() => setEmbedBusy(''))
      }
      const saveBase = () => {
        host.call('config-set', { visionProvider, visionModel, freq: { daily: freqDaily, task: freqTask }, dialect: { id: dialectId, boost: dialectBoost } }).then(r => {
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
        // 反馈按钮显示开关
        React.createElement('div', { className: 'bqb-pref-row', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement('span', { className: 'bqb-pref-emotion' }, '显示反馈按钮'),
          React.createElement('button', { className: 'bqb-btn' + (showFb ? ' bqb-btn-primary' : ''), onClick: () => { host.call('config-set', { showFeedbackButtons: !showFb }).then(r => { if (r && r.ok) { setShowFb(!showFb); toast(!showFb ? '反馈按钮已开启：卡片下方会显示喜欢/不喜欢' : '反馈按钮已关闭：卡片只显示表情包图片', false) } else toast('保存失败', true) }).catch(() => toast('保存失败', true)) } }, showFb ? '已开启' : '已关闭')
        ),
        React.createElement('div', { className: 'bqb-hint' }, '聊天里每张配图下方的「喜欢 / 不喜欢」按钮。不想要可以关掉，卡片就只剩一张干干净净的图。'),
        // 配图频率
        React.createElement('div', { className: 'bqb-pref-row' },
          React.createElement('div', { className: 'bqb-pref-head' },
            React.createElement('span', { className: 'bqb-pref-emotion' }, '配图频率'),
            React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: saveBase }, '保存')
          ),
          React.createElement('div', { className: 'bqb-row', style: { marginBottom: 8 } },
            React.createElement('button', { className: 'bqb-btn' + (freqScene === 'daily' ? ' bqb-btn-primary' : ''), style: { flex: 1 }, onClick: () => setFreqScene('daily') }, '日常'),
            React.createElement('button', { className: 'bqb-btn' + (freqScene === 'task' ? ' bqb-btn-primary' : ''), style: { flex: 1 }, onClick: () => setFreqScene('task') }, '正事')
          ),
          React.createElement('div', { className: 'bqb-row' },
            ...FREQ_LEVELS.map(level => {
              const current = freqToLevel(freqScene === 'task' ? freqTask : freqDaily)
              return React.createElement('button', {
                key: level.value,
                className: 'bqb-btn' + (current === level.value ? ' bqb-btn-primary' : ''),
                style: { flex: 1 },
                title: level.desc,
                onClick: () => { if (freqScene === 'task') setFreqTask(level.value); else setFreqDaily(level.value) }
              }, level.label)
            })
          ),
          React.createElement('div', { className: 'bqb-hint', style: { marginTop: 6 } }, '日常聊天和正事的配图频率分开调。四档都是大致频率，插件会避免连续两轮提醒配图。两档都选「不配图」时，完全不会自动提示配图。')
        ),
        // AI 识图模型
        React.createElement('div', { className: 'bqb-pref-row' },
          React.createElement('div', { className: 'bqb-pref-head' },
            React.createElement('span', { className: 'bqb-pref-emotion' }, 'AI 识图模型'),
            React.createElement('div', { style: { display: 'flex', gap: 6 } },
              React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: testVision, disabled: visionBusy }, visionBusy ? '测试中…' : '测试一下'),
              React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: saveBase }, '保存')
            )
          ),
          React.createElement('div', { className: 'bqb-field' },
            React.createElement('label', null, '从 dsh 已配置的模型里选（推荐）'),
            React.createElement('div', { className: 'bqb-row', style: { marginTop: 4 } },
              React.createElement('select', { className: 'bqb-select', style: { flex: 1 }, value: providerSelValue, onChange: e => onProviderChange(e.target.value) },
                React.createElement('option', { value: '__custom__' }, '（自定义…）'),
                ...providers.map(p => React.createElement('option', { key: p.providerId, value: p.providerId }, p.providerName + (p.models.length ? '' : '（无模型）')))
              ),
              React.createElement('select', { className: 'bqb-select', style: { flex: 1 }, value: modelSelValue, onChange: e => onModelChange(e.target.value), disabled: !currentProvider },
                React.createElement('option', { value: '__custom__' }, '（自定义…）'),
                ...currentModels.map(m => React.createElement('option', { key: m.id, value: m.id }, m.name + (m.supportsImage === true ? '（支持图片）' : m.supportsImage === false ? '（未声明支持图片）' : '')))
              )
            )
          ),
          React.createElement('div', { className: 'bqb-hint', style: { marginTop: 6 } }, '列表来自 dsh 已配置的模型。标注「支持图片」表示该模型声明了图片输入能力；未标注的也可能支持，以实际识图测试为准。'),
          React.createElement('div', { className: 'bqb-field', style: { marginTop: 8 } },
            React.createElement('label', null, '或自定义 Provider / 模型 ID（留空则用当前会话默认模型）'),
            React.createElement('div', { className: 'bqb-row', style: { marginTop: 4 } },
              React.createElement('input', { className: 'bqb-input', style: { flex: 1 }, value: visionProvider, onChange: e => setVisionProvider(e.target.value), placeholder: 'Provider，如 deepseek-official' }),
              React.createElement('input', { className: 'bqb-input', style: { flex: 1 }, value: visionModel, onChange: e => setVisionModel(e.target.value), placeholder: '模型 ID，需支持图片输入' })
            )
          ),
          React.createElement('div', { className: 'bqb-hint', style: { marginTop: 6 } }, '识图需要支持图片输入的模型。不配置时使用会话默认模型；若默认模型不支持图片，识图会失败，请在此指定一个视觉模型。')
        ),
        // 向量检索
        React.createElement('div', { className: 'bqb-pref-row' },
          React.createElement('div', { className: 'bqb-pref-head' },
            React.createElement('span', { className: 'bqb-pref-emotion' }, '向量检索（可选）'),
            React.createElement('div', { style: { display: 'flex', gap: 6 } },
              React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: testEmbed, disabled: !!embedBusy }, embedBusy === 'test' ? '测试中…' : '测试连通'),
              React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: saveEmbed }, '保存')
            )
          ),
          React.createElement('div', { className: 'bqb-field' },
            React.createElement('label', null, 'Base URL（OpenAI 兼容 /embeddings 接口，如 https://api.openai.com/v1）'),
            React.createElement('input', { className: 'bqb-input', value: embedCfg.customBaseUrl, onChange: e => setEmbedCfg(prev => ({ ...prev, customBaseUrl: e.target.value })), placeholder: 'https://…/v1' })
          ),
          React.createElement('div', { className: 'bqb-field', style: { marginTop: 6 } },
            React.createElement('label', null, 'API Key'),
            React.createElement('input', { className: 'bqb-input', type: 'password', value: embedCfg.customApiKey, onChange: e => setEmbedCfg(prev => ({ ...prev, customApiKey: e.target.value })), placeholder: embedCfg.hasKey ? '已保存（输入新 Key 可覆盖）' : 'sk-…' })
          ),
          React.createElement('div', { className: 'bqb-field', style: { marginTop: 6 } },
            React.createElement('label', null, '模型名'),
            React.createElement('input', { className: 'bqb-input', value: embedCfg.customModel, onChange: e => setEmbedCfg(prev => ({ ...prev, customModel: e.target.value })), placeholder: '如 text-embedding-3-small' })
          ),
          React.createElement('div', { className: 'bqb-row', style: { marginTop: 8 } },
            React.createElement('button', { className: 'bqb-btn', onClick: genEmbed, disabled: !!embedBusy }, embedBusy === 'index' ? '生成中…' : '生成索引'),
            React.createElement('span', { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } }, '为所有已识图的图片生成语义指纹')
          ),
          React.createElement('div', { className: 'bqb-hint', style: { marginTop: 6 } },
            vectorStatus
              ? (vectorStatus.configured
                  ? '状态：已生成 ' + vectorStatus.vectorCount + '/' + vectorStatus.withSemanticDesc + ' 个' + (vectorStatus.pending > 0 ? '，待生成 ' + vectorStatus.pending : '') + (vectorStatus.model ? '，模型 ' + vectorStatus.model : '') + (vectorStatus.dimensions ? '，维度 ' + vectorStatus.dimensions : '') + (vectorStatus.generated_at ? '，生成于 ' + vectorStatus.generated_at.substring(0, 10) : '')
                  : '未配置。')
              : '未配置。'
          ),
          React.createElement('div', { className: 'bqb-hint', style: { marginTop: 2 } }, '配置后可让配图更懂语义：每张图生成一个「语义指纹」，配图时按语义相似度加分，标签没匹配上的图也能靠语义找到。识图成功后会自动生成指纹，一般不用手动点「生成索引」。')
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
        // 最近配图记录（和助手聊聊入口）
        React.createElement('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' } }, '最近配图记录（点「和助手聊聊」可以调教这张图的标签）：'),
        logEntries.length === 0
          ? React.createElement('div', { className: 'bqb-empty' }, '还没有配图记录。\n聊天中助手配图后，会出现在这里。')
          : logEntries.map((e, i) => React.createElement('div', { key: i, className: 'bqb-pref-row' },
              React.createElement('div', { className: 'bqb-log-entry' },
                React.createElement(LogThumb, { id: e.sticker_id }),
                React.createElement('div', { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 } },
                  React.createElement('span', { className: 'bqb-pref-emotion', style: { fontSize: 12, margin: 0 } }, (e.emotion || '（无情绪）') + ' · ' + fmtTime(e.ts)),
                  React.createElement('span', { className: 'bqb-hint', style: { fontSize: 11 } }, e.sticker_id)
                ),
                React.createElement('button', { className: 'bqb-btn', style: { padding: '1px 8px', fontSize: 11 }, onClick: () => setLogChat(logChat === i ? null : i) }, logChat === i ? '收起' : '和助手聊聊')
              ),
              logChat === i ? React.createElement('div', { style: { marginTop: 8 } }, React.createElement(ChatPanel, { stickerId: e.sticker_id })) : null
            )),
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
