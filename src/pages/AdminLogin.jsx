import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../services/firebaseConfig'
import { useNavigate } from 'react-router-dom'


export default function AdminLogin(){
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')
const navigate = useNavigate()


async function handleSubmit(e){
e.preventDefault()
try{
await signInWithEmailAndPassword(auth, email, password)
navigate('/admin/dashboard')
} catch(err){ setError('Invalid credentials') }
}


return (
<div className="max-w-md mx-auto bg-white p-6 rounded shadow">
<h2 className="text-xl font-bold mb-3">Admin Sign In</h2>
{error && <div className="text-red-600 mb-2">{error}</div>}
<form onSubmit={handleSubmit}>
<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border mb-2 rounded" required />
<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border mb-4 rounded" required />
<button className="w-full bg-blue-600 text-white p-2 rounded">Sign In</button>
</form>
</div>
)
}