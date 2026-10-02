import { clearStudentSession, getLearningUser, saveStudentSession, studentAuthEnabled, studentClient } from '../../../student-auth';
export const dynamic='force-dynamic';
function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'無效的登入請求。'},403);
 if(!studentAuthEnabled())return json({error:'學生帳戶服務尚未啟用。'},503);
 let input:Record<string,unknown>;
 try{const body=await request.text();if(body.length>20000)return json({error:'輸入太長。'},400);const value=JSON.parse(body);if(!value||typeof value!=='object'||Array.isArray(value))return json({error:'無效輸入。'},400);input=value;}catch{return json({error:'無效輸入。'},400);}
 try{
  if(input.action==='logout'){
   try{
    const {cookies}=await import('next/headers');const jar=await cookies();
    const access=jar.get('roadmap_student_access')?.value;const renewal=jar.get('roadmap_student_refresh')?.value;
    if(access&&renewal){const logoutClient=studentClient();const {data}=await logoutClient.auth.setSession({access_token:access,refresh_token:renewal});if(data.session)await logoutClient.auth.signOut({scope:'local'});}
   }finally{await clearStudentSession();}
   return json({ok:true});
  }
  const client=studentClient();
  if(input.action==='confirm'){
   if(typeof input.accessToken!=='string'||typeof input.refreshToken!=='string'||input.accessToken.length>8192||input.refreshToken.length>8192)return json({error:'無效的驗證連結。'},400);
   const {data,error}=await client.auth.setSession({access_token:input.accessToken,refresh_token:input.refreshToken});
   if(error||!data.session)return json({error:'驗證連結已失效，請重新登入或申請重設。'},401);
   const verified=await client.auth.getUser(data.session.access_token);if(verified.error||!verified.data.user)return json({error:'未能驗證帳戶。'},401);
   await saveStudentSession(data.session);return json({ok:true});
  }
  if(input.action==='password'){
   if(typeof input.password!=='string'||input.password.length<8||input.password.length>128)return json({error:'密碼須為 8–128 個字元。'},400);
   const user=await getLearningUser(true);if(user?.provider!=='student')return json({error:'請先使用密碼重設連結驗證身份。'},401);
   const {cookies}=await import('next/headers');const jar=await cookies();
   const current=await client.auth.setSession({access_token:jar.get('roadmap_student_access')!.value,refresh_token:jar.get('roadmap_student_refresh')!.value});
   if(current.error)return json({error:'請重新驗證身份。'},401);
   const {error}=await client.auth.updateUser({password:input.password});if(error)return json({error:'未能更新密碼，請重試。'},400);
   // After password change, require a fresh password sign-in.
   await client.auth.signOut({scope:'local'});await clearStudentSession();return json({ok:true});
  }
  const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return json({error:'請輸入有效的電郵地址。'},400);
  const origin=new URL(request.url).origin;
  if(input.action==='reset'){
   const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/student/login`});
   if(error)return json({error:'暫時未能發送重設電郵，請稍後重試。'},error.status===429?429:503);
   return json({message:'如這個電郵已有帳戶，你會收到密碼重設連結。'});
  }
  if(typeof input.password!=='string'||input.password.length<1||input.password.length>128)return json({error:'請輸入密碼。'},400);
  if(input.action==='signup'){
   if(input.password.length<8)return json({error:'新密碼須至少有 8 個字元。'},400);
   const {data,error}=await client.auth.signUp({email,password:input.password,options:{emailRedirectTo:`${origin}/student/login`}});
   if(error)return json({error:'未能建立帳戶。請稍後重試；已有帳戶可直接登入。'},error.status===429?429:400);
   if(data.session){await saveStudentSession(data.session);return json({ok:true});}
   return json({message:'請查看電郵並按驗證連結；如已有帳戶，請直接登入。'});
  }
  if(input.action!=='login')return json({error:'無效操作。'},400);
  const {data,error}=await client.auth.signInWithPassword({email,password:input.password});
  if(error||!data.session)return json({error:'未能登入。請檢查電郵、密碼及電郵驗證狀態。'},error?.status===429?429:401);
  await saveStudentSession(data.session);return json({ok:true});
 }catch{return json({error:'學生帳戶服務暫時未能連接，請稍後重試。'},503);}
}
