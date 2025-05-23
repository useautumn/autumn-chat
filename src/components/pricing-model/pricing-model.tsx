import { Feature, Product } from "@/models";
import { toPricecnProduct } from "@/lib/toPricecnProducts";
import { PricingCard } from "../pricing/pricing-table";
import { PricingTable } from "../pricing/pricing-table";
import { isProductUpgrade } from "@/lib/sortProducts";
import { CodeEditor } from "./code-editor2";
import { useState } from "react";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const sortProducts = (a: Product, b: Product) => {
  if (!a.items || !b.items) {
    return 0;
  }

  const isUpgradeA = isProductUpgrade({
    items1: a.items,
    items2: b.items,
  });

  if (isUpgradeA) {
    return -1;
  } else {
    return 1;
  }
};

export const PricingModel = ({
  pricingModel,
  setPricingModel,
  editorText,
  setEditorText,
  tab,
  setTab,
  jsonError,
  setJsonError,
}: {
  pricingModel: {
    products: Product[];
    features: Feature[];
  };
  setPricingModel: (pricingModel: {
    products: Product[];
    features: Feature[];
  }) => void;
  editorText: string;
  setEditorText: (editorText: string) => void;
  tab: string;
  setTab: (tab: string) => void;
  jsonError: boolean;
  setJsonError: (jsonError: boolean) => void;
}) => {
  const pricecnProducts =
    pricingModel?.products
      ?.sort(sortProducts)
      ?.map((product: Product) => {
        const transformed = toPricecnProduct({
          product,
          features: pricingModel.features,
        });
        return transformed;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null) ?? [];

  return (
    <div className="flex flex-col h-full w-full items-center">
      <div className="flex flex-col gap-2 mt-10 max-w-[800px] w-full">
        <PricingTable products={pricecnProducts as any}>
          {pricecnProducts.map((p) => (
            <PricingCard key={p.id} productId={p.id} />
          ))}
        </PricingTable>
      </div>

      {/* {tab === "code" && (
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
            setEditorText(value);
          }}
          error={jsonError}
        />
      )} */}
    </div>
  );
};
