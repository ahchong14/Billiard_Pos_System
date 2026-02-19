import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Login(){
  const [name, setName] = useState('收银员')
  const { setUser } = useApp()
  const nav = useNavigate()

  function handleSubmit(e){
    e.preventDefault()
    setUser({name})
    nav('/')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
      <form className="bg-white p-8 rounded-lg shadow-md w-[360px]" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-semibold mb-4">登录</h2>
        <label className="text-sm text-slate-600">用户名</label>
        <input className="w-full border rounded px-3 py-2 mt-1 mb-3" value={name} onChange={e=>setName(e.target.value)} />
        <label className="text-sm text-slate-600">密码</label>
        <input className="w-full border rounded px-3 py-2 mt-1" type="password" defaultValue="" />
        <div className="mt-6 flex justify-end">
          <button className="bg-sky-600 text-white px-4 py-2 rounded" type="submit">登录</button>
        </div>
      </form>
    </div>
  )
}
