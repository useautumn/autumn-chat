"use client";

import { useChat } from "@ai-sdk/react";
import { Loader2, XIcon } from "lucide-react";
import { cn, notNullish } from "@/lib/utils";
import { Messages } from "@/components/messages";
import { MultimodalInput } from "@/components/multimodal-input";
import { useEffect, useState } from "react";
import { Attachment } from "ai";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import {
  PricingModelSchema,
  Product,
  ProductItem,
  ProductItemSchema,
} from "@/models";
import { PricingCard, PricingTable } from "@/components/pricing/pricing-table";
import { toPricecnProduct } from "@/lib/toPricecnProducts";
import { z } from "zod";
import { isProductUpgrade } from "@/lib/sortProducts";
import { PricingModel } from "@/components/pricing-model/pricing-model";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Refer to https://ai-sdk.dev/docs/ai-sdk-ui/chatbot

export default function Chat({
  messages: initialMessages,
  pricingModel: initialPricingModel,
}: {
  messages: string;
  pricingModel: string;
}) {
  const {
    messages,
    setMessages,
    reload,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    setInput,
    append,
    data,
    setData,
  } = useChat({
    experimental_prepareRequestBody: ({ messages }) => {
      return {
        messages,
        pricingModel,
      };
    },
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(JSON.parse(initialMessages));
    }
  }, [initialMessages, setMessages]);

  useEffect(() => {
    if (initialPricingModel) {
      setPricingModel(JSON.parse(initialPricingModel));
    }
  }, [initialPricingModel]);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const chatId = "1";
  const defaultPricingModel: z.infer<typeof PricingModelSchema> = {
    features: [],
    products: [],
  };
  const [pricingModel, setPricingModel] = useState<
    z.infer<typeof PricingModelSchema>
  >(() => {
    // Try to load from localStorage on initial render
    if (typeof window !== "undefined") {
      const savedModel = localStorage.getItem("pricingModel");
      return savedModel ? JSON.parse(savedModel) : defaultPricingModel;
    }
    return defaultPricingModel;
  });

  // Save pricingModel to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && status === "ready") {
      localStorage.setItem("pricingModel", JSON.stringify(pricingModel));
    }
  }, [pricingModel, status]);

  // Load messages from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMessages = localStorage.getItem("chatMessages");
      console.log("savedMessages", savedMessages);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  }, [setMessages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      status === "ready" &&
      messages.length > 0
    ) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages, status]);

  const [editorText, setEditorText] = useState(
    JSON.stringify(pricingModel, null, 2)
  );

  useEffect(() => {
    if (data && data.length > 0) {
      const newPricingModel = data[data.length - 1] as z.infer<
        typeof PricingModelSchema
      >;

      // Only update if we have a valid new pricing model
      if (newPricingModel?.products && newPricingModel?.features) {
        setPricingModel((prevModel) => {
          const updatedModel: z.infer<typeof PricingModelSchema> = {
            features: prevModel.features
              .map((prevFeature) => {
                const newFeature = newPricingModel.features.find(
                  (f) => f.id === prevFeature.id
                );
                if (!newFeature) return prevFeature;

                return {
                  ...prevFeature,
                  name: newFeature.name || prevFeature.name,
                  type: newFeature.type || prevFeature.type,
                  display: newFeature.display || prevFeature.display,
                  credit_schema:
                    newFeature.credit_schema || prevFeature.credit_schema,
                };
              })
              .concat(
                // Add any new features that weren't in the previous model
                newPricingModel.features.filter(
                  (newFeature) =>
                    !prevModel.features.some((f) => f.id === newFeature.id)
                )
              ),
            products: [
              // Update existing products
              ...prevModel.products.map((prevProduct) => {
                const newProduct = newPricingModel.products.find(
                  (p: Product) => p.id === prevProduct.id
                );

                if (!newProduct) return prevProduct;

                return {
                  ...prevProduct,
                  name: newProduct.name || prevProduct.name,
                  is_add_on: newProduct.is_add_on ?? prevProduct.is_add_on,
                  // is_default: newProduct.is_default ?? prevProduct.is_default,
                  items: [
                    // Update existing items
                    ...(prevProduct.items?.map((prevItem) => {
                      const newItem = newProduct.items?.find(
                        (i: ProductItem) => i.feature_id === prevItem.feature_id
                      );
                      if (!newItem) return prevItem;

                      return {
                        ...prevItem,
                        included_usage:
                          newItem.included_usage ?? prevItem.included_usage,
                        interval: newItem.interval || prevItem.interval,
                        usage_model:
                          newItem.usage_model || prevItem.usage_model,
                        price: newItem.price ?? prevItem.price,
                        billing_units:
                          newItem.billing_units ?? prevItem.billing_units,
                      };
                    }) || []),
                    // Add new items that aren't in prevProduct.items
                    ...(newProduct.items ?? []).filter(
                      (newItem) =>
                        !prevProduct.items?.some(
                          (i) => i.feature_id === newItem.feature_id
                        )
                    ),
                  ].filter((item) => {
                    if (ProductItemSchema.safeParse(item).success) {
                      return true;
                    }
                    return false;
                  }),
                };
              }),
              // Add any new products that weren't in the previous model
              ...newPricingModel.products
                .filter(
                  (newProduct) =>
                    !prevModel.products.some((p) => p.id === newProduct.id)
                )
                .filter(
                  (product) =>
                    typeof product.id === "string" && product.id.trim() !== ""
                ),
            ],
          };

          return updatedModel;
        });
      }
    }
  }, [data]);

  useEffect(() => {
    if (status === "ready" && data && data.length > 0) {
      const latestPricingModel = data[data.length - 1] as z.infer<
        typeof PricingModelSchema
      >;
      setEditorText(JSON.stringify(latestPricingModel, null, 2));
      setPricingModel(latestPricingModel);
      setData([]);
    }
  }, [status, data, setData]);

  const [tab, setTab] = useState("pricing");
  const [jsonError, setJsonError] = useState(false);
  // bg-[#FAFAFA]
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (messages.length > 0) {
      setShowChat(true);
    }
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    // setData([]);
    // setPricingModel(defaultPricingModel);
    // setInput("");
    // setAttachments([]);

    // localStorage.removeItem("chatMessages");
    // localStorage.removeItem("pricingModel");
  };

  return (
    <div className={cn("relative w-full h-fit flex flex-col")}>
      <div className="flex flex-col h-full w-full justify-end pr-4 pointer-events-none p-2">
        <div className="flex w-full justify-end">
          <div
            className={cn(
              "flex flex-col justify-end h-full pointer-events-auto transition-all duration-300 ease-in-out",
              messages.length > 0 ? "w-[400px]" : "w-full"
            )}
          >
            <Messages
              chatId={chatId}
              status={status}
              messages={messages}
              setMessages={setMessages}
              reload={reload}
              isReadonly={false}
              isArtifactVisible={false}
              tab={tab}
              setTab={setTab}
              editorText={editorText}
              setEditorText={setEditorText}
              pricingModel={pricingModel}
              setPricingModel={setPricingModel}
              jsonError={jsonError}
              setJsonError={setJsonError}
              showChat={showChat}
              setShowChat={setShowChat}
              showConfig={false}
              setShowConfig={() => {}}
            />
            <form className="flex py-4 px-0.5  mb-6 gap-2 w-full md:max-w-3xl">
              <MultimodalInput
                chatId={chatId}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
                clearChat={clearChat}
                showConfig={false}
                setShowConfig={() => {}}
                pricingModel={pricingModel}
                setPricingModel={setPricingModel}
              />
            </form>
          </div>
        </div>
        <div className="pointer-events-auto">
          <PricingModel
            pricingModel={pricingModel}
            setPricingModel={setPricingModel}
            editorText={editorText}
            setEditorText={setEditorText}
            tab={tab}
            setTab={setTab}
            jsonError={jsonError}
            setJsonError={setJsonError}
          />
        </div>
      </div>
    </div>
  );
}
