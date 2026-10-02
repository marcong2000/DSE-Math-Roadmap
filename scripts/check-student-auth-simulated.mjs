import {spawn} from 'node:child_process';import {createServer} from 'node:http';import {randomUUID} from 'node:crypto';import assert from 'node:assert/strict';
const users=new Map();const tokens=new Map();const renewals=new Map();let logoutCalls=0;
function session(email){if(!users.has(email))users.set(email,{id:randomUUID(),email,aud:'authenticated',role:'authenticated',email_confirmed_at:new Date().toISOString(),created_at:new Date().toISOString()});const user=users.get(email);const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,email,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'local-test-signature'].join('.');const renewal=randomUUID();tokens.set(token,user);renewals.set(renewal,email);return {access_token:token,refresh_token:renewal,token_type:'bearer',expires_in:3600,user};}
const provider=createServer(async(req,res)=>{let raw='';for await(const x of req)raw+=x;const input=raw?JSON.parse(raw):{};const url=new URL(req.url,'http://127.0.0.1');let body;let status=200;
 if(url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='password'){if(input.password!=='test-password'){status=400;body={code:'invalid_credentials',message:'Invalid login credentials'};}else body=session(input.email);}
 else if(url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='refresh_token'){const email=renewals.get(input.refresh_token);if(email){renewals.delete(input.refresh_token);body=session(email);}else{status=400;body={code:'refresh_token_not_found',message:'Invalid refresh token'};}}
 else if(url.pathname==='/auth/v1/user'){const user=tokens.get((req.headers.authorization||'').slice(7));if(user){body=user;}else{status=401;body={code:'bad_jwt',message:'Invalid JWT'};}}
 else if(url.pathname==='/auth/v1/signup'){body={user:{id:randomUUID(),email:input.email,created_at:new Date().toISOString()},session:null};}
 else if(url.pathname==='/auth/v1/recover'){body={};}
 else if(url.pathname==='/auth/v1/logout'){logoutCalls++;body={};}
 else{status=404;body={error:'Unknown test endpoint'};}
 res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));});
await new Promise(r=>provider.listen(8788,'127.0.0.1',r));
const server=spawn(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','dev','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--ip','127.0.0.1','--port','8787','--inspector-port','0','--var','SUPABASE_URL:http://127.0.0.1:8788','--var','SUPABASE_PUBLISHABLE_KEY:local-test-publishable-key'],{stdio:['pipe','pipe','pipe']});let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
const base='http://127.0.0.1:8787';
async function request(path,{method='GET',body,jar={},headers={}}={}){for(let i=0;i<4;i++){const r=await fetch(base+path,{method,headers:{...headers,'Content-Type':'application/json',Origin:base,Cookie:Object.entries(jar).map(([k,v])=>`${k}=${v}`).join('; ')},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();if(r.status===503&&text.includes('worker restarted')){await new Promise(r=>setTimeout(r,500));continue;}for(const cookie of r.headers.getSetCookie()){const first=cookie.split(';')[0];const p=first.indexOf('=');jar[first.slice(0,p)]=first.slice(p+1);}return {status:r.status,data:text.startsWith('{')?JSON.parse(text):text,cookies:r.headers.getSetCookie()};}throw Error('Repeated Worker restarts');}
try{
 await new Promise((r,j)=>{const t=setTimeout(()=>j(Error('startup timeout')),20000);server.stdout.on('data',()=>{if(logs.includes('Ready on')){clearTimeout(t);r();}});});await new Promise(r=>setTimeout(r,2000));
 const A={},B={};
 let r=await request('/student/login');assert.equal(r.status,200);assert.ok(r.data.includes('不需 ChatGPT 帳戶'));
 r=await request('/api/student/auth',{method:'POST',body:{action:'login',email:'a@test.invalid',password:'wrong'}});assert.equal(r.status,401);
 r=await request('/api/student/auth',{method:'POST',jar:A,body:{action:'login',email:'a@test.invalid',password:'test-password'}});assert.equal(r.status,200);assert.ok(r.cookies.every(c=>/httponly/i.test(c)&&/samesite=lax/i.test(c)));
 r=await request('/api/progress',{method:'PUT',jar:A,body:{topicId:'indices',status:2}});assert.equal(r.status,200);
 assert.equal((await request('/api/progress',{jar:A})).data.progress.indices,2);
 await request('/api/student/auth',{method:'POST',jar:B,body:{action:'login',email:'b@test.invalid',password:'test-password'}});
 assert.equal((await request('/api/progress',{jar:B})).data.progress.indices,undefined);
 assert.equal((await request('/api/progress',{headers:{'oai-authenticated-user-id':'test-original-chatgpt','oai-authenticated-user-email':'original@test.invalid'}})).data.progress.indices,undefined);
 A.roadmap_student_access='expired-token';r=await request('/api/progress',{jar:A});assert.equal(r.status,200);assert.equal(r.data.progress.indices,2);assert.ok(r.cookies.some(c=>c.startsWith('roadmap_student_access=')));
 r=await request('/api/student/auth',{method:'POST',body:{action:'signup',email:'new@test.invalid',password:'test-password'}});assert.equal(r.status,200);assert.ok(r.data.message.includes('驗證'));
 r=await request('/api/student/auth',{method:'POST',body:{action:'confirm',accessToken:'bad',refreshToken:'bad'}});assert.equal(r.status,401);
 r=await request('/api/student/auth',{method:'POST',jar:A,body:{action:'logout'}});assert.equal(r.status,200);assert.ok(logoutCalls>0);assert.equal((await request('/api/progress',{jar:A})).status,401);
 console.log('PASS with local provider simulation: student login, rejection, HttpOnly cookies, D1 progress, account/provider isolation, session refresh, signup confirmation, forged-token rejection and logout. Real Supabase and email delivery remain pending.');
}catch(e){console.log(logs.split('\n').filter(x=>/error|failed|GET|POST|PUT/i.test(x)).join('\n'));throw e;}finally{server.kill('SIGTERM');provider.close();}
