import type { UIMessage } from "ai";
import { PreviewMessage, ThinkingMessage } from "./message";
// import { Greeting } from './greeting';
import { memo, forwardRef, useImperativeHandle, useState } from "react";
// import type { Vote } from '@/lib/db/schema';
import equal from "fast-deep-equal";
import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { useMessages } from "@/hooks/use-messages";
import { Greeting } from "./greeting";
import { Button } from "./ui/button";
import { Loader2, XIcon } from "lucide-react";
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
  showConfig: boolean;
  setShowConfig: (showConfig: boolean) => void;
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
    showConfig,
    setShowConfig,
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

  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom,
    }),
    [scrollToBottom]
  );

  const [loading, setLoading] = useState(false);

  return (
    <div
      className={cn(
        "max-h-[480px] min-h-[480px] flex flex-col bg-white/0 transition-opacity rounded-xs justify-end",
        messages.length > 0
          ? "duration-1000 scale-100 opacity-100 translate-y-0"
          : "duration-500 bg-white/0 scale-95 opacity-0 -translate-y-4"
      )}
      style={{
        contain: "layout style paint",
        overscrollBehavior: "contain",
      }}
    >
      {/* <div
        className={cn(
          " min-h-10 transition-all",
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
          <div className="border-l-1 border-zinc-200 p-0 h-full w-full">
            <Button
              variant="add"
              className="rounded-none !h-full w-full cursor-pointer"
              onClick={async () => {
                console.log(pricingModel);
                try {
                  setLoading(true);
                  const response = await fetch("/api/submit", {
                    method: "POST",
                    body: JSON.stringify({ pricingModel }),
                  });

                  const data = await response.json();
                  const baseURL =
                    "https://app.useautumn.com/sandbox/onboarding";
                  const authUrl = "https://accounts.useautumn.com/sign-in";
                  // const baseURL = "http://localhost:3000/sandbox/onboarding";
                  // const authUrl =
                  //   "https://massive-ghoul-59.accounts.dev/sign-in";
                  window.open(
                    `${authUrl}?redirect_url=${baseURL}?token=${data.id}`,
                    "_blank"
                  );
                } catch (error) {
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? (
                <Loader2 className="animate-spin" width={20} />
              ) : (
                <Image
                  src="/logo.png"
                  alt="Autumn Logo"
                  width={20}
                  height={20}
                  className="-translate-y-0.5"
                />
              )}
              <span className="font-bold font-mono">Deploy to Autumn</span>
            </Button>
          </div>
        </div>
      </div>   */}

      {/* {messages.length === 0 && <Greeting />} */}

      <div className="flex max-h-[400px] px-2">
        {showConfig ? (
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
        ) : (
          <div
            className="flex flex-col gap-6 overflow-y-auto relative scrollbar-hide w-full"
            ref={tab == "pricing" ? messagesContainerRef : undefined}
            style={{
              contain: "layout style paint",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
            }}
          >
            <div className="pt-4 flex flex-col h-fit gap-6">
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
                className="shrink-0 min-w-[24px] min-h-[12px] -mt-8"
                onViewportLeave={onViewportLeave}
                onViewportEnter={onViewportEnter}
              />
            </div>
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
