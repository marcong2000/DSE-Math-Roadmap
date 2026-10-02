import { getLearningUser } from '../../student-auth';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{await getLearningUser(true);return Response.redirect(new URL('/',request.url),303);}
 catch{return new Response('暫時未能恢復登入，請稍後重新整理此頁。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}
}
