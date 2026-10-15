import { requireChatGPTUser } from './chatgpt-auth';
import Studio from '@/components/studio';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await requireChatGPTUser('/');
  return <Studio owner={user.userId} name={user.displayName} />;
}
