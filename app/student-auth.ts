import { env } from 'cloudflare:workers';
import { createClient, type Session } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getChatGPTUser } from './chatgpt-auth';
export type LearningUser = { userId:string; displayName:string; provider:'student'|'chatgpt' };
const accessCookie='roadmap_student_access';
const refreshCookie='roadmap_student_refresh';
export function studentAuthEnabled(){return !!(env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY);}
export function studentClient(){
 if(!studentAuthEnabled())throw new Error('Student account service is not configured');
 return createClient(env.SUPABASE_URL!,env.SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
export async function saveStudentSession(session:Session){
 const jar=await cookies();const options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:60*60*24*30};
 jar.set(accessCookie,session.access_token,options);jar.set(refreshCookie,session.refresh_token,options);
}
export async function clearStudentSession(){const jar=await cookies();jar.delete(accessCookie);jar.delete(refreshCookie);}
export async function hasStudentSession(){return studentAuthEnabled()&&!!(await cookies()).get(refreshCookie)?.value;}
export async function getLearningUser(refresh=false):Promise<LearningUser|null>{
 if(studentAuthEnabled()){
  const jar=await cookies();const access=jar.get(accessCookie)?.value;const renewal=jar.get(refreshCookie)?.value;
  if(access||renewal){
   const client=studentClient();
   if(access){const {data,error}=await client.auth.getUser(access);if(data.user&&!error)return {userId:`supabase:${data.user.id}`,displayName:data.user.email||'學生帳戶',provider:'student'};if(error?.name==='AuthRetryableFetchError')throw new Error('Account service temporarily unavailable');}
   if(refresh&&renewal){const {data,error}=await client.auth.refreshSession({refresh_token:renewal});if(data.session&&!error){const verified=await client.auth.getUser(data.session.access_token);if(verified.data.user&&!verified.error){await saveStudentSession(data.session);return {userId:`supabase:${verified.data.user.id}`,displayName:verified.data.user.email||'學生帳戶',provider:'student'};}}if(error?.name==='AuthRetryableFetchError')throw new Error('Account service temporarily unavailable');await clearStudentSession();}
   return null;
  }
 }
 const user=await getChatGPTUser();return user?{userId:user.userId,displayName:user.fullName||user.email,provider:'chatgpt'}:null;
}
