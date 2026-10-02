'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Check, ChevronDown, ChevronRight, Circle, Compass, Flag, GraduationCap, LayoutList, LoaderCircle, LockKeyhole, Search, SlidersHorizontal, Target, TrendingUp } from 'lucide-react';
import { cutoffs, p2Map2024, p2Map2025, sources, stageInfo, topics, yearNotes, type Topic } from './data';
import { estimate, requiredOwn, requiredPaper1 } from './scoring';
type Progress = Record<string,number>;
const labels=['未掌握','半熟','完成'];
const signin='/signin-with-chatgpt?return_to=%2F';
export default function Roadmap({signedIn,displayName,studentAuth,provider}:{signedIn:boolean;displayName:string|null;studentAuth:boolean;provider:"student"|"chatgpt"|null}) {
 const signinPath=studentAuth?'/student/login':signin;
 const [tab,setTab]=useState('roadmap');
 const [progress,setProgress]=useState<Progress>({});
 const [loaded,setLoaded]=useState(!signedIn);
 const [error,setError]=useState('');
 const [retry,setRetry]=useState(0);
 const [saving,setSaving]=useState<string|null>(null);
 const [saved,setSaved]=useState(false);
 const [target,setTarget]=useState(2);
 const [search,setSearch]=useState('');
 const [area,setArea]=useState('全部範疇');
 const [statusFilter,setStatusFilter]=useState('all');
 const [open,setOpen]=useState<string|null>(null);
 useEffect(()=>{
  if(!signedIn) return;
  const controller=new AbortController();
  fetch('/api/progress',{cache:'no-store',signal:controller.signal}).then(async r=>{if(!r.ok) throw new Error('暫時未能讀取進度。請重試後再更改清單。');return r.json() as Promise<{progress:Progress}>;}).then(data=>{setProgress(data.progress);setLoaded(true);setError('');}).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
  return ()=>controller.abort();
 },[signedIn,retry]);
 async function update(id:string,status:number) {
  if(!loaded||saving) return;
  const previous=progress[id]||0;
  setProgress(p=>({...p,[id]:status}));setError('');setSaved(false);
  if(!signedIn) return;
  setSaving(id);
  try {const r=await fetch('/api/progress',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({topicId:id,status})});if(!r.ok){const d=await r.json() as {error?:string};throw new Error(d.error||'未能保存更改。');}setSaved(true);}
  catch(e){setProgress(p=>({...p,[id]:previous}));setError(e instanceof Error?e.message:'未能保存此更改，請重試。');}
  finally{setSaving(null);}
 }
 const route=topics.filter(t=>t.stage<=target);
 const completed=route.filter(t=>progress[t.id]===2).length;
 const semi=route.filter(t=>progress[t.id]===1).length;
 const percent=Math.round(completed/route.length*100);
 const filtered=route.filter(t=> {
  const current=progress[t.id]||0;
  const statusMatch=statusFilter==='all'||(statusFilter==='todo'?current!==2:current===Number(statusFilter));
  const keyword=`${t.title} ${t.english} ${t.skills.join(' ')}`.toLowerCase();
  return (area==='全部範疇'||t.area===area)&&statusMatch&&keyword.includes(search.toLowerCase());
 });
 const next=route.find(t=>progress[t.id]!==2&&(!t.prerequisite||progress[t.prerequisite]===2))||route.find(t=>progress[t.id]!==2);
 function jump(t:Topic){setTab('roadmap');setTarget(Math.max(target,t.stage));setSearch('');setArea('全部範疇');setStatusFilter('all');setOpen(t.id);setTimeout(()=>document.getElementById(`topic-${t.id}`)?.scrollIntoView({behavior:'smooth',block:'center'}),80);}
 return <div className="app-shell">
  <aside className="sidebar">
   <Link className="brand" href="/" aria-label="DSE Maths Roadmap 首頁"><span className="brand-icon"><TrendingUp size={23}/></span><span>DSE MATHS<span className="brand-sub">ROADMAP · 穩步達標</span></span></Link>
   <div className="nav-label">你的溫習工作台</div>
   <nav aria-label="主導航">{[
    ['roadmap','我的路線圖',LayoutList],['score','分數規劃',Target],['evidence','考卷與依據',BookOpen],
   ].map(([key,label,Icon])=>{const I=Icon as typeof BookOpen;return <button key={key as string} className={`nav-button ${tab===key?'active':''}`} onClick={()=>setTab(key as string)}><I size={19}/>{label as string}{tab===key&&<ChevronRight size={16} className="nav-arrow"/>}</button>;})}</nav>
   <div className="sidebar-tip"><Compass size={24}/><strong>每次掌握一小步</strong><p>先做題，再核對。<br/>用兩次穩定表現，換一個「完成」。</p></div>
   <div className="account">{signedIn?<><span className="account-dot"/><div><strong>{displayName||'我的學習帳戶'}</strong><span>個人進度已啟用</span></div><a href={provider==='student'?'/student/logout':'/signout-with-chatgpt?return_to=%2F'} target="_top">登出</a></>:<><LockKeyhole size={18}/><div><strong>訪客試用</strong><span>登入可保存個人進度</span></div></>}</div>
   {!signedIn&&<a className="sidebar-signin" href={signinPath} target="_top">{studentAuth?'學生帳戶登入':'使用 ChatGPT 登入'} <ArrowUpRight size={15}/></a>}
  </aside>
  <main>
   <header className="topbar"><span>香港中學文憑考試 <span className="topbar-slash">/</span> 數學必修部分</span><span className="source-stamp">2012–2025 考卷研究</span></header>
   {tab==='roadmap'?<>
    <div className="page-heading"><div><div className="eyebrow">YOUR NEXT STEP</div><h1>把達標，拆成每一步。</h1><p>找到未熟的課題，練習、檢查，再向前行。</p></div><span className="small-badge"><GraduationCap size={16}/> 中六溫習路線</span></div>
    <div className="target-row"><span>我的目標</span><div className="segmented" aria-label="選擇溫習目標">{[1,2,3].map((n)=><button key={n} aria-pressed={target===n} className={target===n?'selected':''} onClick={()=>setTarget(n)}>{n===1?'Level 2':n===2?'Level 3':'Level 3+'}</button>)}</div><span className="target-caption">較高目標包含前面階段的課題</span></div>
    <div className="overview-grid"><section className="progress-card"><div className="card-overline">目前路線 · {route.length} 個課題</div><div className="progress-number">{completed}<span> / {route.length}</span><span className="complete-label">已完成</span></div><div className="progress-track" role="progressbar" aria-label="已完成課題比例" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${percent}%`}}/></div><div className="progress-legend"><span><i className="dot done"/>{percent}% 已完成</span><span><i className="dot semi"/>{semi} 個半熟</span><span><i className="dot"/>{route.length-completed-semi} 個未掌握</span></div></section>
    <section className="next-card"><div className="card-overline"><Flag size={14}/> 建議下一步</div>{next?<><h2>{next.title}</h2><p>{next.skills[0]}</p><button onClick={()=>jump(next)}>開始這個課題 <ArrowUpRight size={17}/></button></>:<><h2>這條路線已完成！</h2><p>做一套限時全卷，重新檢查不穩的課題。</p><button onClick={()=>setTab('score')}>檢查分數規劃 <ArrowUpRight size={17}/></button></>}</section></div>
    <div className="save-banner" role="status">{!signedIn?<><LockKeyhole size={17}/><span>試用中的勾選只保留在本次頁面；登入後開始保存自己的進度。</span><a href={signinPath} target="_top">登入保存 <ArrowUpRight size={14}/></a></>:<><span className={`dot ${loaded?'done':''}`}/><span>{saving?'正在保存…':!loaded?'正在讀取你的進度…':saved?'已保存，其他裝置登入後也能繼續。':'你的進度會隨每次更改自動保存。'}</span></>}</div>
    {error&&<div className="error-banner" role="alert">{error}{!loaded&&<button onClick={()=>setRetry(r=>r+1)}>重新讀取</button>}</div>}
    <div className="checklist-title"><h2>我的掌握清單</h2><span>未掌握 <ChevronRight size={12}/> 半熟 <ChevronRight size={12}/> 完成</span></div>
    <div className="filters"><label className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜尋課題或 English keyword" aria-label="搜尋課題"/>{search&&<button onClick={()=>setSearch('')} aria-label="清除搜尋">×</button>}</label><label><SlidersHorizontal size={16}/><select aria-label="範疇" value={area} onChange={e=>setArea(e.target.value)}>{['全部範疇',...new Set(topics.map(t=>t.area))].map(a=><option key={a}>{a}</option>)}</select></label><select aria-label="掌握狀態" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">全部狀態</option><option value="todo">仍需練習</option><option value="0">未掌握</option><option value="1">半熟</option><option value="2">完成</option></select></div>
    {stageInfo.filter(s=>s.n<=target).map(stage=>{const group=filtered.filter(t=>t.stage===stage.n);if(!group.length)return null;const stageTopics=route.filter(t=>t.stage===stage.n);return <section className="stage" key={stage.n}><div className="stage-heading"><span className="stage-number">0{stage.n}</span><div><h3>{stage.title} <span>{stage.subtitle}</span></h3><p>{stage.description}</p></div><span className="stage-count">{stageTopics.filter(t=>progress[t.id]===2).length}/{stageTopics.length}</span></div><div className="topic-list">{group.map(t=>{const status=progress[t.id]||0;return <article id={`topic-${t.id}`} className={`topic ${status===2?'complete':''}`} key={t.id}><div className="topic-row"><button className="topic-summary" onClick={()=>setOpen(open===t.id?null:t.id)} aria-expanded={open===t.id} aria-controls={`detail-${t.id}`}><span className={`topic-state state-${status}`}>{status===2?<Check size={16}/>:status===1?<span className="half-circle"/>:<Circle size={15}/>}</span><span className="topic-name"><strong>{t.title}</strong><span>{t.english}</span></span><span className="area-tag">{t.area}</span><ChevronDown size={16} className={open===t.id?'rotate':''}/></button><div className="status-options" aria-label={`${t.title}的掌握狀態`}>{labels.map((label,n)=><button key={n} aria-pressed={status===n} disabled={!loaded||!!saving} className={status===n?`chosen status-${n}`:''} onClick={()=>update(t.id,n)}>{saving===t.id&&status===n?<LoaderCircle size={13} className="spin"/>:n===2?<Check size={13}/>:n===1?<span className="mini-half"/>:<Circle size={12}/>}<span>{label}</span></button>)}</div></div>{open===t.id&&<div className="topic-detail" id={`detail-${t.id}`}><div><h4>需要掌握</h4><ul>{t.skills.map(s=><li key={s}>{s}</li>)}</ul><p className="pitfall"><strong>常見失誤：</strong>{t.pitfall}</p></div><div><h4>歷屆練習定位</h4><div className="ref-tags">{t.refs.map(r=><span key={r}>{r}</span>)}</div>{t.prerequisite&&<p className="prerequisite">先檢查：<button onClick={()=>jump(topics.find(x=>x.id===t.prerequisite)!)}>{topics.find(x=>x.id===t.prerequisite)?.title}</button></p>}<p className="mastery"><strong>完成檢查：</strong>兩組未看過的練習，各至少 5 個得分點，限時取得 ≥80%；長題寫清步驟並核對評分。隔一週再測。</p></div></div>}</article>;})}</div></section>;})}
    {!filtered.length&&<div className="empty-state"><Search size={26}/><h3>沒有符合的課題</h3><p>試試另一個關鍵字，或清除範疇與狀態篩選。</p><button onClick={()=>{setSearch('');setArea('全部範疇');setStatusFilter('all');}}>清除篩選</button></div>}
    <div className="guide"><strong>怎樣判斷三種狀態？</strong><div><p><Circle size={15}/><span><b>未掌握</b> · 未能獨立選方法，或基本步驟常錯。</span></p><p><span className="half-circle"/><span><b>半熟</b> · 會做常規題，但仍要提示，或限時表現不穩。</span></p><p><Check size={15}/><span><b>完成</b> · 兩組新題限時達 ≥80%，並能解釋步驟。</span></p></div><small>這是溫習證據清單，完成比例不代表考試分數或等級。路線是優先次序，不是「只讀這些就必達標」。</small></div>
   </>:tab==='score'?<ScorePlanner/>:<Evidence onTopic={jump}/>}
   <footer><span>DSE MATHS ROADMAP · 穩步達標</span><span>每一步，靠練習驗證。 <button onClick={()=>setTab('evidence')}>查看研究依據 <ArrowUpRight size={12}/></button></span></footer>
  </main>
 </div>;
}
function ScorePlanner(){
 const [p1,setP1]=useState(40);const [own,setOwn]=useState(10);const [goal,setGoal]=useState(50);
 const average=estimate(p1,own,true);const conservative=estimate(p1,own,false);
 const avgNeed=requiredPaper1(goal,own,true);const worstNeed=requiredPaper1(goal,own,false);
 const ownNeed=requiredOwn(goal,p1,true);const ownWorst=requiredOwn(goal,p1,false);
 return <>
 <div className="page-heading"><div><div className="eyebrow">PLAN WITH NUMBERS</div><h1>把分數目標算清楚。</h1><p>先估獨立得分，再看猜題可以帶來多少差異。</p></div><span className="small-badge"><Target size={16}/> 溫習規劃工具</span></div>
 <div className="note-box"><strong>目標分數由你設定，並非官方分界。</strong><p>Level 2 建議先以 50%、Level 3 以 65% 作訓練目標，加入緩衝；歷年非官方估算有波動，等級仍由考評局按表現標準釐定。</p></div>
 <div className="planner-grid"><section className="panel controls"><h2>01 <span>輸入你的練習表現</span></h2><label className="input-label">加權目標 <b>{goal}%</b></label><div className="goal-presets">{[40,50,60,65].map(n=><button key={n} className={goal===n?'selected':''} onClick={()=>setGoal(n)}>{n}%{n===50?' · L2 訓練':n===65?' · L3 訓練':''}</button>)}</div><input aria-label="加權目標百分比" type="range" min="20" max="90" value={goal} onChange={e=>setGoal(Number(e.target.value))}/><div className="range-labels"><span>20%</span><span>90%</span></div>
 <label className="input-label">卷一原始分數 <b>{p1}<small> /105</small></b></label><input aria-label="卷一原始分數" type="range" min="0" max="105" value={p1} onChange={e=>setP1(Number(e.target.value))}/><div className="range-labels"><span>0 分</span><span>105 分</span></div>
 <label className="input-label">卷二獨立答對 <b>{own}<small> /45 題</small></b></label><input aria-label="卷二獨立答對題數" type="range" min="0" max="45" value={own} onChange={e=>setOwn(Number(e.target.value))}/><div className="range-labels"><span>0 題</span><span>45 題</span></div><p className="muted">「獨立答對」指不用猜而且答對的題數，不是嘗試作答的題數。其餘 {45-own} 題假設填同一選項。</p></section>
 <section className="panel results"><div className="card-overline">02 · 以目前輸入估算</div><h2>平均猜中模型</h2><div className="score-big">{average.weighted.toFixed(1)}<span>%</span></div><div className="score-bar"><i style={{width:`${average.weighted}%`}}/><span style={{left:`${goal}%`}} title="訓練目標"/></div><div className="score-caption"><span>0%</span><strong>目標 {goal}%</strong><span>100%</span></div><div className="calc-breakdown"><div><span>卷一貢獻</span><strong>{(65*p1/105).toFixed(1)}%</strong></div><div><span>卷二預期分數</span><strong>{average.p2.toFixed(2)} /45</strong></div><div><span>卷二貢獻</span><strong>{(35*average.p2/45).toFixed(1)}%</strong></div></div><p className="result-message">{average.weighted>=goal?'模型已達你的訓練目標；仍要看保守情境及實際限時成績。':`距離訓練目標約 ${(goal-average.weighted).toFixed(1)} 個百分點，可從卷一或獨立 MC 得分補足。`}</p><div className="no-luck"><span>保守情境：其餘題完全沒有猜中</span><strong>{conservative.weighted.toFixed(1)}%</strong></div></section></div>
 <section className="panel"><h2>要靠自己拿多少分？</h2><p className="muted">固定一卷的表現，反推另一卷要取得的分數；計算向上取整。</p><div className="table-wrap"><table><thead><tr><th>規劃方式 · 目標 {goal}%</th><th>平均猜中模型</th><th>沒有猜中</th></tr></thead><tbody><tr><td>卷二獨立答對 {own} 題 → 卷一至少</td><td>{avgNeed<=105?`${avgNeed} /105 分`:'超過卷一滿分'}</td><td>{worstNeed<=105?`${worstNeed} /105 分`:'超過卷一滿分'}</td></tr><tr><td>卷一取得 {p1} 分 → 卷二至少獨立答對</td><td>{ownNeed<=45?`${ownNeed} /45 題`:'超過卷二滿分'}</td><td>{ownWorst<=45?`${ownWorst} /45 題`:'超過卷二滿分'}</td></tr></tbody></table></div></section>
 <section className="panel method"><h2>10 題 MC：起步點，需要配合卷一</h2><p>如果獨立答對 10 題，餘下 35 題都填同一選項，在「每題猜中率 1/4」模型下，卷二預期為 <strong>18.75 /45</strong>。配合卷一 40 /105，加權約 <strong>39.3%</strong>；以 50% 訓練目標計，卷一需至少 <strong>58 /105</strong>。老師觀察的「10 題＋猜題」可以是 Level 2 起步策略，單靠 MC 題數不能保證等級。</p><div className="formula">加權百分比 = 65 × 卷一分數 ÷ 105 + 35 × 卷二分數 ÷ 45</div><p>猜題預期 = 獨立答對題數 + 餘下題數 ÷ 4。卷二四選一，錯答不倒扣。平均預期可以是小數，單次實際成績只會是整數。</p><p className="muted">模型把未解題的正確選項視作均勻分布；同一答案策略在一份實際試卷中的得分，取決於剩餘題目的答案分布，可能高於或低於預期。這不是每年必有 25% 的保證。公式按公布比重及原始滿分作規劃，未模擬考評局年度評級或調整。</p></section>
 </>;
}
function Evidence({onTopic}:{onTopic:(t:Topic)=>void}) {
 const [year,setYear]=useState(2025);
 const map=year===2025?p2Map2025:p2Map2024;
 return <>
 <div className="page-heading"><div><div className="eyebrow">BUILT FROM THE PAPERS</div><h1>路線背後，有依據。</h1><p>課程結構 × 歷屆考卷 × 保守的分數規劃。</p></div><span className="small-badge"><BookOpen size={16}/> 研究更新 · 2026.10</span></div>
 <div className="evidence-stats"><div><strong>14</strong><span>年份 · 2012–2025</span></div><div><strong>28</strong><span>必修部分試卷</span></div><div><strong>{topics.length}</strong><span>可追蹤課題</span></div></div>
 <section className="panel"><h2>試卷結構決定練習次序</h2><div className="paper-structure"><div><span className="paper-label">PAPER 1</span><h3>長題目 <strong>65%</strong></h3><p>2 小時 15 分鐘 · 105 分</p><div className="paper-sections"><span>A1 <b>35</b><small>較基本題</small></span><span>A2 <b>35</b><small>較多步驟</small></span><span>B <b>35</b><small>包含進階題</small></span></div></div><div><span className="paper-label">PAPER 2</span><h3>選擇題 <strong>35%</strong></h3><p>1 小時 15 分鐘 · 45 題 · 不倒扣</p><div className="paper-sections"><span>A <b>30</b><small>基礎課題</small></span><span>B <b>15</b><small>含非基礎課題</small></span></div></div></div><p className="muted">依據：HKEAA 2027 評核框架及研究範圍內原卷。A1／A2 是難度安排；「基礎課題」是課程分類，與學生等級並不相同。本網站三階段是教學上的優先排序。</p></section>
 <section className="panel"><h2>Level 2 與 Level 3：怎樣選主線？</h2><div className="strategy-grid"><div><span className="stage-number">01</span><h3>Level 2 起步</h3><p>把 A1 的指數、公式主項、因式分解、不等式、比例、百分數、基本幾何及統計練穩。卷二先建立獨立答對的核心題庫，再補 A2 的熟悉小題。</p></div><div><span className="stage-number">02</span><h3>Level 3 主線</h3><p>累積前面基礎，加入變分、多項式、二次方程、離差、直線／圓與立體題。練習多步推理與說明；只拿 A1 35 分，即使 MC 全對，加權也只有約 56.7%。</p></div><div><span className="stage-number">03</span><h3>Level 3+ 緩衝</h3><p>按強項補對數、級數、概率和 B 部題型。先獨立拿到開首小題的分，再挑戰綜合幾何。高目標學生應覆蓋完整課程，不能以這張清單代替課程大綱。</p></div></div><p className="muted">課題排序反映可練的常規技能與跨題應用，並非官方「必考清單」。實際得分受題目難度、速度、失誤及評分準則影響。</p></section>
 <section className="panel"><div className="section-with-control"><div><h2>近期卷二 · 題型地圖</h2><p className="muted">點題目查看相應課題。每題只顯示主要技能，綜合題可涉及其他範疇。</p></div><select aria-label="卷二年份" value={year} onChange={e=>setYear(Number(e.target.value))}><option value="2025">2025</option><option value="2024">2024</option></select></div><div className="question-map">{map.map((id,i)=>{const t=topics.find(x=>x.id===id)!;return <button key={i} onClick={()=>onTopic(t)}><span>Q{i+1}</span><strong>{t.title}</strong><small>{i<30?'A 部':'B 部'}</small></button>;})}</div></section>
 <section className="panel"><h2>歷屆主題觀察</h2><p className="muted">檢視 S6 Road Map 的 2012–2025 必修部分兩卷。以下是年度摘要，課題細節與練習題號已連到掌握清單；沒有把重複出現當成下一年必考保證。</p><div className="table-wrap"><table className="year-table"><thead><tr><th>年份</th><th>卷一主題與變化</th></tr></thead><tbody>{yearNotes.map(([y,n])=><tr key={y}><td>{y}</td><td>{n}</td></tr>)}</tbody></table></div><div className="reading-note"><strong>跨年卷二觀察</strong><p>A 部把代數、數與應用、幾何、坐標、統計概率分散成短題；B 部更常見對數／圖像、級數、線性規劃、三角學、中心、計數及標準分。题號會變動，不能只背某幾題的套路。</p></div></section>
 <section className="panel"><h2>歷年分界：只作參考</h2><p>下表是坊間網站所報的加權百分比估算，<strong>不是 HKEAA 官方逐年分界</strong>。Level 2 大量年份缺資料；不可把空白視作 0%，亦不應由 Level 3 猜出 Level 2 分界。</p><div className="table-wrap"><table><thead><tr><th>年份</th><th>Level 2</th><th>Level 3</th><th>來源／限制</th></tr></thead><tbody>{cutoffs.map(([y,l2,l3,n])=><tr key={y}><td>{y}</td><td>{l2}</td><td>{l3}</td><td>{n}</td></tr>)}</tbody></table></div><p className="muted">— = 未有可引用資料。* = 原來源所列百分比與分數有計算差異，保留疑問，沒有用作精確校準。各來源所用 175、183、191 等分母不是這個規劃工具的卷一／卷二原始滿分。</p></section>
 <section className="panel"><h2>研究範圍與限制</h2><ul className="method-list"><li>涵蓋 2012–2025 年必修部分原卷，按解題技能整理；不包含 M1、M2、會考或高考。掃描卷經文字辨識及題目檢視，索引是教學整理，並非考評局官方分類。</li><li>2018 卷二用資料夾內的中文原卷；2014 卷一檔案合併了兩卷，只把卷一部分納入該卷觀察。</li><li>2026 卷一檔案標示「MOCK EXAMINATION」，因此 2026 資料未納入歷屆正式卷比較；坊間 2026 分界亦未用作目標校準。</li><li>清單合併了一些相近技能，供溫習追蹤；不是逐小題配分資料庫或完整評分準則。原卷及答案需由老師／合法取得的試卷查閱。</li><li>勾選進度屬個人自評。可公開瀏覽；登入後只儲存自己的課題狀態，不設全班成績排行。</li></ul></section>
 <section className="panel"><h2>原始依據與延伸閱讀</h2><div className="source-list">{sources.map(s=><a href={s.url} target="_blank" rel="noopener noreferrer" key={s.url}><span className={`source-type ${s.type==='官方'?'official':''}`}>{s.type}</span><div><strong>{s.title}</strong><p>{s.note}</p></div><ArrowUpRight size={18}/></a>)}</div></section>
 </>;
}
