import { requireChatGPTUser } from "@/app/chatgpt-auth";
import PresentationView from "@/components/presentation";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireChatGPTUser("/present");
  return <PresentationView />;
}
