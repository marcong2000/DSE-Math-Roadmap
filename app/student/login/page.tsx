import StudentLogin from './student-login';
import { studentAuthEnabled } from '../../student-auth';
export const dynamic='force-dynamic';
export default function Page(){return <StudentLogin enabled={studentAuthEnabled()}/>;}
