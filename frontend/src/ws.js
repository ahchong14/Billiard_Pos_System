// Simple WebSocket client to backend (ws://localhost:3001)
const WS_URL = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + (location.hostname || 'localhost') + ':3001'

let ws = null
const subs = new Set()

export function connect(){
  if(ws && ws.readyState === WebSocket.OPEN) return ws
  try{
    ws = new WebSocket(WS_URL)
  }catch(e){ console.warn('ws connect failed', e); return null }
  ws.addEventListener('open', ()=> console.log('ws open'))
  ws.addEventListener('message', ev=>{
    try{ const msg = JSON.parse(ev.data); subs.forEach(fn=>fn(msg)) }catch(e){}
  })
  ws.addEventListener('close', ()=>{ console.log('ws closed'); setTimeout(()=>connect(), 3000) })
  return ws
}

export function subscribe(fn){
  subs.add(fn)
  connect()
  return ()=> subs.delete(fn)
}

export default { connect, subscribe }
