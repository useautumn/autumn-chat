import { useState, useEffect } from "react";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useScrollToBottom } from "./use-scroll-to-bottom";

export function useMessages({
  chatId,
  status,
  messages,
}: {
  chatId: string;
  status: UseChatHelpers["status"];
  messages: Array<UIMessage>;
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  const [hasSentMessage, setHasSentMessage] = useState(false);

  useEffect(() => {
    if (chatId) {
      scrollToBottom("instant");
      setHasSentMessage(false);
    }
  }, [chatId, scrollToBottom]);

  useEffect(() => {
    if (status === "submitted") {
      setHasSentMessage(true);
    }
  }, [status]);

  // // Auto-scroll when streaming starts
  // useEffect(() => {
  //   if (status === "streaming" && hasSentMessage) {
  //     scrollToBottom("smooth");
  //   }
  // }, [status, hasSentMessage, scrollToBottom]);

  // Auto-scroll during streaming when messages content changes
  useEffect(() => {
    if (status === "streaming" && hasSentMessage && isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, status, hasSentMessage, isAtBottom, scrollToBottom]);

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
