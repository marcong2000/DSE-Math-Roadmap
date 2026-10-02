import { getLearningUser, hasStudentSession, studentAuthEnabled } from "./student-auth";
import { redirect } from "next/navigation";
import Roadmap from "./roadmap";
export const dynamic = "force-dynamic";
export default async function Home() {
 const user=await getLearningUser();
 if(!user&&await hasStudentSession())redirect('/student/restore');
 return <Roadmap signedIn={!!user} displayName={user?.displayName||null} studentAuth={studentAuthEnabled()} provider={user?.provider||null}/>;
}
