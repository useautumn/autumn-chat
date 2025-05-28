"use client";

import type { Attachment, UIMessage } from "ai";
import cx from "classnames";
import type React from "react";
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from "react";
import { toast } from "sonner";
import { useLocalStorage, useWindowSize } from "usehooks-ts";

import { PaperclipIcon, StopIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
// import { SuggestedActions } from "./suggested-actions";
import equal from "fast-deep-equal";
import type { UseChatHelpers } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpIcon,
  Code2,
  Loader2,
  MessageSquare,
  Rocket,
  XIcon,
} from "lucide-react";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { AnimatedGradientBorderTW } from "./animated-border-gradient";
import { cn } from "@/lib/utils";
// import type { VisibilityType } from "./visibility-selector";

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  clearChat,
  showConfig,
  setShowConfig,
  pricingModel,
  setPricingModel,
}: {
  chatId: string;
  input: UseChatHelpers["input"];
  setInput: UseChatHelpers["setInput"];
  status: UseChatHelpers["status"];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  append: UseChatHelpers["append"];
  handleSubmit: UseChatHelpers["handleSubmit"];
  className?: string;
  clearChat: () => void;
  showConfig: boolean;
  setShowConfig: (showConfig: boolean) => void;
  pricingModel: any;
  setPricingModel: (pricingModel: any) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const [loading, setLoading] = useState(false);

  const [messagePresent, setMessagePresent] = useState(messages.length > 0);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${
        textareaRef.current.scrollHeight + 2
      }px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      // textareaRef.current.style.height = "98px"; // TODO: Remove?
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    setMessagePresent(messages.length > 0);
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === "submitted") {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    // window.history.replaceState({}, "", `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput("");
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    //
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error("Failed to upload file, please try again!");
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments]
  );

  return (
    <div className="relative w-full flex flex-col gap-4 ">
      {/* <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence> */}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: "",
                name: filename,
                contentType: "",
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      {/* <div className="animated-gradient-border !rounded-none"> */}
      {/* <AnimatedGradientBorderTW animate={!messagePresent}> */}
      <div className={cn("flex items-center", messagePresent ? "mt-4" : "")}>
        <div className="group relative mx-auto w-full overflow-hidden rounded-xs bg-gray-300 p-[1px] transition-all duration-300 ease-in-out bg-gradient-to-b from-primary/70 to-primary shadow-md">
          <div className="animate-spin-slow absolute -top-90 -bottom-90 left-10 right-10 bg-gradient-to-r from-transparent via-white/90 to-transparent visible"></div>
          <Textarea
            // data-testid="multimodal-input"
            ref={textareaRef}
            placeholder="Describe your app's pricing..."
            value={input}
            onChange={handleInput}
            className={cx(
              "rounded-xs h-12 min-h-12 max-h-12 resize-none relative shadow-none outline-none focus:ring-0 focus:outline-none w-full overflow-scroll scrollbar-hide bg-white [&::placeholder]:text-zinc-400  ",
              messagePresent
                ? " transition-all ease-in-out [&::placeholder]:text-transparent"
                : "transition-all ease-in-out border-none",
              className
            )}
            rows={2}
            autoFocus
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();

                if (status !== "ready") {
                  toast.error("Please wait for Autumn to finish its response");
                } else {
                  submitForm();
                }
              }
            }}
          />
        </div>
      </div>
      {/* </AnimatedGradientBorderTW> */}
      {/* </div> */}

      {/* <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
        <AttachmentsButton fileInputRef={fileInputRef} status={status} />
      </div> */}
      {/* <div className="absolute bottom-0 left-0 p-2 pt-0 w-full flex flex-row justify-start">
        <div className="bg-blue-200">Deploy to Autumn</div>
      </div> */}

      <div
        className={cn(
          "bottom-0 right-0 p-2 pt-0 w-full flex flex-row justify-between gap-2",
          messagePresent ? "opacity-100 " : "opacity-0 pointer-events-none"
        )}
      >
        <Button
          variant="outline"
          className="rounded-xs text-xs hover:bg-zinc-100 shadow-none text-zinc-400"
          size="sm"
          onClick={() => {
            setShowConfig(!showConfig);
          }}
        >
          {showConfig ? (
            <>
              <MessageSquare size={10} className="mr-1 " />
              Chat
            </>
          ) : (
            <>
              <Code2 size={10} className="mr-1" />
              Config
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="destructive"
            className="rounded-xs text-xs hover:bg-red-500/90 hover:text-zinc-50 shadow-none bg-white"
            size="sm"
            onClick={() => {
              clearChat();
              setMessagePresent(false);
            }}
          >
            <XIcon size={10} />
            Clear
          </Button>

          {/* {status === "submitted" ? (
            <StopButton stop={stop} setMessages={setMessages} />
                    ) : (
            <SendButton
              input={input}
              submitForm={submitForm}
              uploadQueue={uploadQueue}
            />
                    )} */}
          <Button
            variant="default"
            className="rounded-xs text-xs hover:bg-purple-800/90 hover:text-zinc-50 shadow-none"
            size="sm"
            onClick={async () => {
              try {
                setLoading(true);
                const response = await fetch("/api/submit", {
                  method: "POST",
                  body: JSON.stringify({ pricingModel }),
                });

                setLoading(false);

                const data = await response.json();
                const baseURL = "https://app.useautumn.com/sandbox/onboarding";
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
              <Loader2 className="animate-spin" width={10} />
            ) : (
              <Rocket size={10} />
            )}
            Deploy
          </Button>
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (!equal(prevProps.messages, nextProps.messages)) return false;
    if (prevProps.showConfig !== nextProps.showConfig) return false;
    if (prevProps.setShowConfig !== nextProps.setShowConfig) return false;
    if (!equal(prevProps.pricingModel, nextProps.pricingModel)) return false;
    // if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
    //   return false;

    return true;
  }
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers["status"];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== "ready"}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers["setMessages"];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-sm w-8 h-8"
      variant="gradientPrimary"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={10} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-sm w-8 h-8"
      variant="gradientPrimary"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={10} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
