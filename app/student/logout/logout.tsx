'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
export default function Logout(){const[error,setError]=useState('');useEffect(()=>{fetch('/api/student/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})}).then(r=>{if(!r.ok)throw Error('未能登出，請重新整理此頁再試。');window.location.replace('/');}).catch(e=>setError(e.message));},[]);return <div className="login-shell"><section className="login-card"><h1>{error?'暫時未能登出':'正在登出…'}</h1>{error&&<p role="alert">{error}</p>}<Link className="login-guest" href="/">返回路線圖</Link></section></div>;}
