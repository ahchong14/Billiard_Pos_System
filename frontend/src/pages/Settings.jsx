import React, {useState, useEffect} from 'react'
import { api } from '../api/mockApi'
import { useCallback } from 'react'

export default function Settings(){
  const [settings, setSettings] = useState({
    billRate: 0.5,
    currency: 'RM',
    taxRate: 6,
    businessName: '台球俱乐部',
    businessPhone: '',
    businessAddress: '',
    businessHours: '10:00-22:00',
    paymentMethods: ['cash', 'card', 'ewallet'],
    backupEnabled: true,
    backupFrequency: 'daily'
  })
  
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('billing')
  const [saved, setSaved] = useState(false)

  function handleChange(key, value) {
    setSettings(prev => ({...prev, [key]: value}))
    setSaved(false)
  }

  function handleSave() {
    setSaved(false)
    api.saveBusiness({
      businessName: settings.businessName,
      businessPhone: settings.businessPhone,
      businessAddress: settings.businessAddress,
      businessHours: settings.businessHours,
      billRate: settings.billRate,
      currency: settings.currency,
      taxRate: settings.taxRate,
      paymentMethods: settings.paymentMethods,
      backupEnabled: settings.backupEnabled,
      backupFrequency: settings.backupFrequency
    }).then(()=>{
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }).catch(()=>{
      // fallback: local save
      localStorage.setItem('pool_settings_v1', JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  useEffect(()=>{
    let mounted = true
    api.getBusiness().then(b => {
      if(!mounted) return
      if(b && Object.keys(b).length > 0){
        setSettings(prev => ({...prev, ...b}))
      } else {
        // try load local fallback
        const raw = localStorage.getItem('pool_settings_v1')
        if(raw){
          try{ setSettings(JSON.parse(raw)) }catch(e){}
        }
      }
    }).catch(()=>{
      const raw = localStorage.getItem('pool_settings_v1')
      if(raw){ try{ setSettings(JSON.parse(raw)) }catch(e){} }
    }).finally(()=> mounted && setLoading(false))
    return ()=> mounted = false
  }, [])
  function togglePaymentMethod(method) {
    setSettings(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method]
    }))
  }

  // Pricing section component (inline)
  function PricingSection(){
    const [rules, setRules] = useState([])
    const [loadingP, setLoadingP] = useState(false)
    const [newRule, setNewRule] = useState({ name: '', mode: 'per_minute', baseRate: 0, minChargeMinutes: 30, gracePeriodMinutes: 5, overtimeRatePerMinute: 0, config: { timeSlots: [] }, active: true })
    const [editingId, setEditingId] = useState(null)
    const [editingRule, setEditingRule] = useState(null)
    const [editingError, setEditingError] = useState(null)
    const [newRuleError, setNewRuleError] = useState(null)

    const fetchRules = useCallback(async ()=>{
      setLoadingP(true)
      try{
        const list = await api.listPricing()
        setRules(list || [])
      }catch(e){
        setRules([])
      }finally{ setLoadingP(false) }
    }, [])

    useEffect(()=>{ fetchRules() }, [fetchRules])

    async function addRule(){
      // validate time slots when mode is time_slot
      if(newRule.mode === 'time_slot'){
        const slots = newRule.config?.timeSlots || []
        const v = validateTimeSlots(slots)
        if(!v.ok){ setNewRuleError(v.message); return }
        setNewRuleError(null)
      }
      try{
        const created = await api.addPricing(newRule)
        setNewRule({ name: '', mode: 'per_minute', baseRate: 0, minChargeMinutes: 30, gracePeriodMinutes: 5, overtimeRatePerMinute: 0, config: { timeSlots: [] }, active: true })
        fetchRules()
      }catch(e){
        alert('添加计费规则失败: ' + e.message)
      }
    }

    async function startEdit(r){
      // normalize config
      const cfg = typeof r.config === 'string' ? (r.config ? JSON.parse(r.config) : {}) : (r.config || {})
      setEditingId(r.id)
      setEditingRule({ ...r, config: cfg })
    }

    function cancelEdit(){ setEditingId(null); setEditingRule(null) }

    async function saveEdit(){
      // validate when editing time_slot
      if((editingRule.mode === 'time_slot' || editingRule.rule_type === 'time_slot')){
        const slots = editingRule.config?.timeSlots || []
        const v = validateTimeSlots(slots)
        if(!v.ok){ setEditingError(v.message); return }
        setEditingError(null)
      }
      try{
        await api.updatePricing(editingId, editingRule)
        cancelEdit()
        fetchRules()
      }catch(e){ alert('更新失败: ' + e.message) }
    }

    async function removeRule(id){
      if(!confirm('确认删除该规则？')) return
      try{
        await api.deletePricing(id)
        fetchRules()
      }catch(e){ alert('删除失败: ' + e.message) }
    }

    function addTimeSlotToEditing(){
      setEditingRule(prev => ({ ...prev, config: { ...(prev.config||{}), timeSlots: [...(prev.config?.timeSlots||[]), { start: '', end: '', ratePerMin: 0 }] } }))
    }

    function parseTimeToMinutes(t){
      if(!t || typeof t !== 'string') return NaN
      const parts = t.trim().split(':')
      if(parts.length !== 2) return NaN
      const hh = parseInt(parts[0],10)
      const mm = parseInt(parts[1],10)
      if(Number.isNaN(hh) || Number.isNaN(mm)) return NaN
      return hh*60 + mm
    }

    function validateTimeSlots(slots){
      // slots: [{start:'HH:MM', end:'HH:MM', ratePerMin}, ...]
      const normalized = []
      for(let i=0;i<slots.length;i++){
        const s = slots[i]
        const st = parseTimeToMinutes(s.start)
        const en = parseTimeToMinutes(s.end)
        if(Number.isNaN(st) || Number.isNaN(en)) return { ok:false, message: `第 ${i+1} 个时间段格式错误` }
        if(en <= st) return { ok:false, message: `第 ${i+1} 个时间段结束必须晚于开始` }
        normalized.push({ start: st, end: en, orig: s })
      }
      // sort by start
      normalized.sort((a,b)=> a.start - b.start)
      for(let i=1;i<normalized.length;i++){
        if(normalized[i].start < normalized[i-1].end) return { ok:false, message: `第 ${i} 和 第 ${i+1} 个时间段存在重叠` }
      }
      return { ok:true }
    }

    function updateTimeSlot(idx, field, value){
      setEditingRule(prev => {
        const slots = [...(prev.config?.timeSlots||[])]
        slots[idx] = { ...slots[idx], [field]: value }
        return { ...prev, config: { ...(prev.config||{}), timeSlots: slots } }
      })
    }

    function removeTimeSlot(idx){
      setEditingRule(prev => {
        const slots = [...(prev.config?.timeSlots||[])]
        slots.splice(idx,1)
        return { ...prev, config: { ...(prev.config||{}), timeSlots: slots } }
      })
    }

    return (
      <div>
        <div className="mb-4">
          <div className="text-sm text-slate-600 mb-2">现有规则</div>
              {loadingP ? <div>加载中...</div> : (
            <div className="space-y-2">
              {rules.length === 0 && <div className="text-sm text-slate-500">暂无计费规则</div>}
              {rules.map(r => (
                <div key={r.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.mode || r.rule_type} · 基础: {r.baseRate}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 border rounded text-sm" onClick={()=>startEdit(r)}>编辑</button>
                      <button className="px-3 py-1 border rounded text-sm" onClick={()=>removeRule(r.id)}>删除</button>
                    </div>
                  </div>

                  {/* show time slots if any */}
                  {r.config && (typeof r.config === 'string' ? (r.config ? JSON.parse(r.config) : null) : r.config) && (
                    (()=>{
                      const cfg = typeof r.config === 'string' ? (r.config ? JSON.parse(r.config) : {}) : r.config || {}
                      const slots = cfg.timeSlots || []
                      if(slots.length === 0) return null
                      return (
                        <div className="mt-3 space-y-2">
                          {slots.map((s, i) => (
                            <div key={i} className="text-xs text-slate-600">{s.start} - {s.end} : RM {s.ratePerMin}</div>
                          ))}
                        </div>
                      )
                    })()
                  )}

                  {editingId === r.id && editingRule && (
                    <div className="mt-4 p-3 bg-gray-50 border rounded">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input className="border rounded px-3 py-2" value={editingRule.name} onChange={e=>setEditingRule(prev=>({...prev, name: e.target.value}))} />
                        <select className="border rounded px-3 py-2" value={editingRule.mode || editingRule.rule_type} onChange={e=>setEditingRule(prev=>({...prev, mode: e.target.value}))}>
                          <option value="hourly">按小时</option>
                          <option value="flat">固定金额</option>
                          <option value="time_slot">时间段</option>
                        </select>
                        <input className="border rounded px-3 py-2" type="number" value={editingRule.baseRate || 0} onChange={e=>setEditingRule(prev=>({...prev, baseRate: parseFloat(e.target.value)||0}))} />
                      </div>

                      { (editingRule.mode === 'time_slot' || editingRule.rule_type === 'time_slot') && (
                        <div className="mt-3">
                          <div className="text-sm text-slate-600 mb-2">时间段</div>
                          {editingError && <div className="mb-2 text-sm text-red-600">{editingError}</div>}
                          {((editingRule.config && editingRule.config.timeSlots) || []).map((s,i)=> (
                            <div key={i} className="flex gap-2 items-center mb-2">
                              <input className="border rounded px-3 py-2" placeholder="开始 (HH:MM)" value={s.start||''} onChange={e=>updateTimeSlot(i,'start',e.target.value)} />
                              <input className="border rounded px-3 py-2" placeholder="结束 (HH:MM)" value={s.end||''} onChange={e=>updateTimeSlot(i,'end',e.target.value)} />
                              <input className="border rounded px-3 py-2" placeholder="费率/分钟" type="number" value={s.ratePerMin||0} onChange={e=>updateTimeSlot(i,'ratePerMin',parseFloat(e.target.value)||0)} />
                              <button className="px-3 py-1 border rounded" onClick={()=>removeTimeSlot(i)}>删除</button>
                            </div>
                          ))}
                          <div>
                            <button className="px-3 py-1 border rounded" onClick={addTimeSlotToEditing}>添加时间段</button>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex gap-3">
                        <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={saveEdit}>保存</button>
                        <button className="px-3 py-1 border rounded" onClick={cancelEdit}>取消</button>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 border rounded">
          <div className="text-sm font-semibold mb-3">添加新规则</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2" placeholder="规则名称" value={newRule.name} onChange={e=>setNewRule(n=>({...n, name: e.target.value}))} />
            <select className="border rounded px-3 py-2" value={newRule.mode} onChange={e=>setNewRule(n=>({...n, mode: e.target.value}))}>
              <option value="hourly">按小时</option>
              <option value="flat">固定金额</option>
              <option value="time_slot">时间段</option>
            </select>
            <input className="border rounded px-3 py-2" type="number" value={newRule.baseRate} onChange={e=>setNewRule(n=>({...n, baseRate: parseFloat(e.target.value) || 0}))} />
          </div>

          {newRule.mode === 'time_slot' && (
            <div className="mt-3">
              <div className="text-sm text-slate-600 mb-2">时间段列表</div>
              {newRuleError && <div className="mb-2 text-sm text-red-600">{newRuleError}</div>}
              {(newRule.config?.timeSlots || []).map((s,i)=> (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <input className="border rounded px-3 py-2" placeholder="开始 (HH:MM)" value={s.start} onChange={e=>{
                    const arr = [...(newRule.config.timeSlots||[])]; arr[i] = {...arr[i], start: e.target.value}; setNewRule(n=>({...n, config:{...n.config, timeSlots:arr}}))
                  }} />
                  <input className="border rounded px-3 py-2" placeholder="结束 (HH:MM)" value={s.end} onChange={e=>{
                    const arr = [...(newRule.config.timeSlots||[])]; arr[i] = {...arr[i], end: e.target.value}; setNewRule(n=>({...n, config:{...n.config, timeSlots:arr}}))
                  }} />
                  <input className="border rounded px-3 py-2" placeholder="费率/分钟" type="number" value={s.ratePerMin} onChange={e=>{
                    const arr = [...(newRule.config.timeSlots||[])]; arr[i] = {...arr[i], ratePerMin: parseFloat(e.target.value)||0}; setNewRule(n=>({...n, config:{...n.config, timeSlots:arr}}))
                  }} />
                  <button className="px-3 py-1 border rounded" onClick={()=>{
                    const arr = [...(newRule.config.timeSlots||[])]; arr.splice(i,1); setNewRule(n=>({...n, config:{...n.config, timeSlots:arr}}))
                  }}>删除</button>
                </div>
              ))}
              <div>
                <button className="px-3 py-1 border rounded" onClick={()=>setNewRule(n=>({...n, config:{...n.config, timeSlots:[...(n.config?.timeSlots||[]), {start:'', end:'', ratePerMin:0}]}}))}>添加时间段</button>
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-3">
            <button className="px-4 py-2 bg-sky-600 text-white rounded" onClick={addRule}>添加规则</button>
            <button className="px-4 py-2 border rounded" onClick={()=>setNewRule({ name: '', mode: 'per_minute', baseRate: 0, minChargeMinutes: 30, gracePeriodMinutes: 5, overtimeRatePerMinute: 0, config:{ timeSlots: [] }, active: true })}>重置</button>
          </div>
        </div>
      </div>
    )
  }

  // Membership section (inline)
  function MembershipSection(){
    const [tiers, setTiers] = useState([])
    const [loadingM, setLoadingM] = useState(false)
    const [newTier, setNewTier] = useState({ name: '', discountPercent: 0, benefits: '' })

    const fetchTiers = useCallback(async ()=>{
      setLoadingM(true)
      try{
        const list = await api.listMembershipTiers()
        setTiers(list || [])
      }catch(e){ setTiers([]) }finally{ setLoadingM(false) }
    }, [])

    useEffect(()=>{ fetchTiers() }, [fetchTiers])

    async function addTier(){
      try{
        await api.addMembershipTier(newTier)
        setNewTier({ name: '', discountPercent: 0, benefits: '' })
        fetchTiers()
      }catch(e){ alert('添加会员等级失败: ' + e.message) }
    }

    return (
      <div>
        <div className="mb-4">
          <div className="text-sm text-slate-600 mb-2">现有会员等级</div>
          {loadingM ? <div>加载中...</div> : (
            <div className="space-y-2">
              {tiers.length === 0 && <div className="text-sm text-slate-500">暂无会员等级</div>}
              {tiers.map(t => (
                <div key={t.id} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-slate-500">折扣: {t.discountPercent}% · 权益: {t.benefits || '-'}</div>
                  </div>
                  <div className="text-sm text-slate-500">{t.active ? '启用' : '停用'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 border rounded">
          <div className="text-sm font-semibold mb-3">添加会员等级</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2" placeholder="等级名称" value={newTier.name} onChange={e=>setNewTier(n=>({...n, name: e.target.value}))} />
            <input className="border rounded px-3 py-2" type="number" placeholder="折扣百分比" value={newTier.discountPercent} onChange={e=>setNewTier(n=>({...n, discountPercent: parseFloat(e.target.value)||0}))} />
            <input className="border rounded px-3 py-2" placeholder="权益（逗号分隔）" value={newTier.benefits} onChange={e=>setNewTier(n=>({...n, benefits: e.target.value}))} />
          </div>
          <div className="mt-3 flex gap-3">
            <button className="px-4 py-2 bg-sky-600 text-white rounded" onClick={addTier}>添加等级</button>
            <button className="px-4 py-2 border rounded" onClick={()=>setNewTier({ name: '', discountPercent: 0, benefits: '' })}>重置</button>
          </div>
        </div>
      </div>
    )
  }

  // Promotions section (inline)
  function PromotionsSection(){
    const [promos, setPromos] = useState([])
    const [loadingP, setLoadingP2] = useState(false)
    const [newPromo, setNewPromo] = useState({ name: '', description: '', discountPercent: 0, startDate: '', endDate: '' })

    const fetchPromos = useCallback(async ()=>{
      setLoadingP2(true)
      try{
        const list = await api.listPromotions()
        setPromos(list || [])
      }catch(e){ setPromos([]) }finally{ setLoadingP2(false) }
    }, [])

    useEffect(()=>{ fetchPromos() }, [fetchPromos])

    async function addPromo(){
      try{
        await api.addPromotion(newPromo)
        setNewPromo({ name: '', description: '', discountPercent: 0, startDate: '', endDate: '' })
        fetchPromos()
      }catch(e){ alert('添加促销失败: ' + e.message) }
    }

    async function delPromo(id){
      if(!confirm('确认删除该促销？')) return
      try{
        await api.deletePromotion(id)
        fetchPromos()
      }catch(e){ alert('删除失败: ' + e.message) }
    }

    return (
      <div>
        <div className="mb-4">
          <div className="text-sm text-slate-600 mb-2">当前促销</div>
          {loadingP ? <div>加载中...</div> : (
            <div className="space-y-2">
              {promos.length === 0 && <div className="text-sm text-slate-500">暂无促销</div>}
              {promos.map(p => (
                <div key={p.id} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.description} · 折扣: {p.discountPercent}% · {p.startDate || '-'} → {p.endDate || '-'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 border rounded text-sm" onClick={()=>delPromo(p.id)}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 border rounded">
          <div className="text-sm font-semibold mb-3">添加促销</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2" placeholder="促销名称" value={newPromo.name} onChange={e=>setNewPromo(n=>({...n, name: e.target.value}))} />
            <input className="border rounded px-3 py-2" placeholder="说明" value={newPromo.description} onChange={e=>setNewPromo(n=>({...n, description: e.target.value}))} />
            <input className="border rounded px-3 py-2" type="number" placeholder="折扣%" value={newPromo.discountPercent} onChange={e=>setNewPromo(n=>({...n, discountPercent: parseFloat(e.target.value)||0}))} />
            <input className="border rounded px-3 py-2" type="date" value={newPromo.startDate} onChange={e=>setNewPromo(n=>({...n, startDate: e.target.value}))} />
            <input className="border rounded px-3 py-2" type="date" value={newPromo.endDate} onChange={e=>setNewPromo(n=>({...n, endDate: e.target.value}))} />
          </div>
          <div className="mt-3 flex gap-3">
            <button className="px-4 py-2 bg-sky-600 text-white rounded" onClick={addPromo}>添加促销</button>
            <button className="px-4 py-2 border rounded" onClick={()=>setNewPromo({ name: '', description: '', discountPercent: 0, startDate: '', endDate: '' })}>重置</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="settings py-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">系统设置</h2>

        {saved && (
          <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 rounded font-medium">
            ✓ 设置已保存
          </div>
        )}

        <div className="flex gap-6">
          <div className="w-64 border rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">设置</div>
              <button className="text-sm text-slate-500" onClick={()=>setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? '收起' : '展开'}</button>
            </div>
            {sidebarOpen && (
              <div className="space-y-2">
                {[
                  {id:'billing', label:'计费'},
                  {id:'pricing', label:'计费规则'},
                  {id:'membership', label:'会员等级'},
                  {id:'promotions', label:'促销'},
                  {id:'business', label:'商户'},
                  {id:'payment', label:'支付'},
                  {id:'backup', label:'备份'},
                  {id:'security', label:'安全'}
                ].map(s => (
                  <button key={s.id} onClick={()=>setActiveTab(s.id)} className={`w-full text-left px-3 py-2 rounded ${activeTab===s.id ? 'bg-sky-50 text-sky-600' : 'hover:bg-slate-50'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="bg-white p-6 rounded-lg shadow">
              {/* Billing Settings */}
              {activeTab === 'billing' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">计费策略</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">时均费率 (RM/分钟)</label>
                      <input 
                        type="number"
                        step="0.1"
                        min="0"
                        value={settings.billRate}
                        onChange={e => handleChange('billRate', parseFloat(e.target.value) || 0)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">税率 (%)</label>
                      <input 
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={settings.taxRate}
                        onChange={e => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">货币</label>
                      <select 
                        value={settings.currency}
                        onChange={e => handleChange('currency', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option>RM</option>
                        <option>SGD</option>
                        <option>USD</option>
                        <option>CNY</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded text-xs text-blue-800 mt-4">
                    💡 示例：以当前设置，15分钟使用费为 {(15 * settings.billRate).toFixed(2)} {settings.currency}
                  </div>
                </div>
              )}

              {/* Pricing Rules */}
              {activeTab === 'pricing' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">计费规则</h3>
                  <PricingSection />
                </div>
              )}

              {/* Membership Tiers */}
              {activeTab === 'membership' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">会员等级</h3>
                  <MembershipSection />
                </div>
              )}

              {/* Promotions */}
              {activeTab === 'promotions' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">促销活动</h3>
                  <PromotionsSection />
                </div>
              )}

              {/* Business Settings */}
              {activeTab === 'business' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">商户信息</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">商户名称</label>
                    <input 
                      type="text"
                      value={settings.businessName}
                      onChange={e => handleChange('businessName', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">电话号码</label>
                    <input 
                      type="tel"
                      value={settings.businessPhone}
                      onChange={e => handleChange('businessPhone', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">地址</label>
                    <input 
                      type="text"
                      value={settings.businessAddress}
                      onChange={e => handleChange('businessAddress', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">营业时间</label>
                    <input 
                      type="text"
                      placeholder="例：10:00-22:00"
                      value={settings.businessHours}
                      onChange={e => handleChange('businessHours', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">支付方式</h3>
                  
                  <div className="space-y-2">
                    {[
                      {id: 'cash', name: '现金'},
                      {id: 'card', name: '刷卡'},
                      {id: 'ewallet', name: '电子钱包'},
                      {id: 'transfer', name: '银行转账'}
                    ].map(method => (
                      <label key={method.id} className="flex items-center p-3 border rounded cursor-pointer hover:bg-slate-50">
                        <input 
                          type="checkbox"
                          checked={settings.paymentMethods.includes(method.id)}
                          onChange={() => togglePaymentMethod(method.id)}
                          className="mr-3"
                        />
                        <span className="font-medium">{method.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Backup Settings */}
              {activeTab === 'backup' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">备份和恢复</h3>
                  
                  <div>
                    <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-slate-50">
                      <input 
                        type="checkbox"
                        checked={settings.backupEnabled}
                        onChange={e => handleChange('backupEnabled', e.target.checked)}
                        className="mr-3"
                      />
                      <span className="font-medium">启用自动备份</span>
                    </label>
                  </div>

                  {settings.backupEnabled && (
                    <div>
                      <label className="block text-sm font-medium mb-1">备份频率</label>
                      <select 
                        value={settings.backupFrequency}
                        onChange={e => handleChange('backupFrequency', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="hourly">每小时</option>
                        <option value="daily">每日</option>
                        <option value="weekly">每周</option>
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">立即备份</button>
                    <button className="px-4 py-2 border rounded hover:bg-slate-50">恢复备份</button>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">安全设置</h3>
                  
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                    <div className="font-semibold text-amber-800 mb-2">⚠ 注意</div>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• 定期备份数据以防数据丢失</li>
                      <li>• 定期变更管理员密码</li>
                      <li>• 不要在公共网络上使用该系统</li>
                      <li>• 启用操作员审计日志跟踪所有交易</li>
                    </ul>
                  </div>

                  <div className="space-y-3 mt-4">
                    <button className="w-full px-4 py-2 border rounded hover:bg-slate-50">修改管理员密码</button>
                    <button className="w-full px-4 py-2 border rounded hover:bg-slate-50">查看审计日志</button>
                    <button className="w-full px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50">清除所有数据 (不可恢复)</button>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="mt-6 flex gap-3">
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-sky-600 text-white rounded font-semibold hover:bg-sky-700"
              >
                保存设置
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 border rounded hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
