import { Topbar } from "@/components/layout/topbar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { createClient } from "@/lib/supabase/server";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const agentType = params.agent === "onboarding" ? "onboarding" : "qna";

  return (
    <div className="flex flex-col h-screen">
      <Topbar
        title={agentType === "onboarding" ? "Onboarding Agent" : "Employee Assistant"}
        subtitle={
          agentType === "onboarding"
            ? "Add and import employees via conversation"
            : "Ask questions about your pay, policies, and PTO"
        }
      />
      <div className="flex-1 overflow-hidden">
        <ChatInterface agentType={agentType} userEmail={user?.email ?? ""} />
      </div>
    </div>
  );
}
