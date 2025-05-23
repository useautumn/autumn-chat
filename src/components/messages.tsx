import type { UIMessage } from "ai";
import { PreviewMessage, ThinkingMessage } from "./message";
// import { Greeting } from './greeting';
import { memo, forwardRef, useImperativeHandle } from "react";
// import type { Vote } from '@/lib/db/schema';
import equal from "fast-deep-equal";
import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { useMessages } from "@/hooks/use-messages";
import { Greeting } from "./greeting";
import { Button } from "./ui/button";
import { XIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import Image from "next/image";
import { CodeEditor } from "./pricing-model/code-editor2";
import { cn } from "@/lib/utils";

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers["status"];
  // votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  tab: string;
  setTab: (tab: string) => void;
  editorText: string;
  setEditorText: (editorText: string) => void;
  pricingModel: any;
  setPricingModel: (pricingModel: any) => void;
  jsonError: boolean;
  setJsonError: (jsonError: boolean) => void;
  showChat: boolean;
  setShowChat: (showChat: boolean) => void;
}

function PureMessages(
  {
    chatId,
    status,
    // votes,
    messages,
    setMessages,
    reload,
    isReadonly,
    tab,
    setTab,
    editorText,
    setEditorText,
    pricingModel,
    setPricingModel,
    jsonError,
    setJsonError,
    showChat,
    setShowChat,
  }: MessagesProps,
  ref: React.Ref<MessagesHandle>
) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
    scrollToBottom,
  } = useMessages({
    chatId,
    status,
    messages,
  });

  // Expose scrollToBottom function to parent component
  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom,
    }),
    [scrollToBottom]
  );

  return (
    <div
      className={cn(
        "max-h-[500px] min-h-[500px] rounded-md flex flex-col",
        "bg-white/0 transition-opacity rounded-sm",
        messages.length > 0
          ? "duration-1000 bg-white/100 shadow-md scale-100 opacity-100 translate-y-0"
          : "duration-500 bg-white/0 scale-95 opacity-0 -translate-y-4"
      )}
      style={{
        contain: "layout style paint",
        overscrollBehavior: "contain",
      }}
    >
      <div
        className={cn(
          "bg-[#F5F5F5] min-h-10 transition-all",
          messages.length > 0
            ? "duration-1000 opacity-100"
            : "duration-500 opacity-0"
        )}
      >
        <div className="flex justify-between items-center h-full py-0">
          <Tabs
            className="h-full border-r-1 border-zinc-200"
            defaultValue="pricing"
            onValueChange={(value) => setTab(value)}
          >
            <TabsList className="rounded-none h-full min-h-10">
              <TabsTrigger value="pricing">chat.tsx</TabsTrigger>
              <TabsTrigger value="code">config.ts</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="border-l-1 border-zinc-200 p-0 h-full">
            <Button
              variant="add"
              className="rounded-none !h-full"
              onClick={async () => {
                console.log(pricingModel);
                const response = await fetch("/api/submit", {
                  method: "POST",
                  body: JSON.stringify({ pricingModel }),
                });

                const data = await response.json();
                window.open(
                  `https://accounts.useautumn.com/sign-in?redirect_url=https://app.useautumn.com/sandbox/onboarding?token=${data.id}`,
                  "_blank"
                );
              }}
            >
              <Image
                src="/logo.png"
                alt="Autumn Logo"
                width={20}
                height={20}
                className="-translate-y-0.5"
              />
              <span className="font-bold font-mono">Deploy to Autumn</span>
            </Button>
          </div>
        </div>
      </div>

      {/* {messages.length === 0 && <Greeting />} */}

      {tab === "code" && (
        <CodeEditor
          customConfig={editorText}
          handleConfigChange={(value) => {
            setEditorText(value);
            try {
              const parsed = JSON.parse(value);
              setPricingModel(parsed);
              setJsonError(false);
            } catch (error) {
              setJsonError(true);
            }
          }}
          error={jsonError}
        />
      )}
      <div
        className="flex flex-col gap-6 flex-1 overflow-y-auto relative scrollbar-hide"
        ref={tab == "pricing" ? messagesContainerRef : undefined}
        style={{
          contain: "layout style paint",
          overscrollBehavior: "contain",
          touchAction: "pan-y",
        }}
      >
        {tab === "pricing" && (
          <div className="pt-4 flex flex-col gap-6">
            {messages.map((message, index) => (
              <PreviewMessage
                key={message.id}
                chatId={chatId}
                message={message}
                isLoading={
                  status === "streaming" && messages.length - 1 === index
                }
                vote={undefined}
                setMessages={setMessages}
                reload={reload}
                isReadonly={isReadonly}
                requiresScrollPadding={
                  hasSentMessage && index === messages.length - 1
                }
              />
            ))}

            <motion.div
              ref={messagesEndRef}
              className="shrink-0 min-w-[24px] min-h-[24px]"
              onViewportLeave={onViewportLeave}
              onViewportEnter={onViewportEnter}
            />
          </div>
        )}
      </div>

      {/* {status === "submitted" &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && <ThinkingMessage />} */}
    </div>
  );
}

const MessagesWithRef = forwardRef<MessagesHandle, MessagesProps>(PureMessages);

export const Messages = memo(MessagesWithRef, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  // if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});

export interface MessagesHandle {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}
