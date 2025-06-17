import { Feature, Product } from "@/models";
import { groupProductsByBilling, toPricecnProductWithBilling } from "@/lib/toPricecnProducts";
import { PricingCard } from "../pricing/pricing-table";
import { PricingTable } from "../pricing/pricing-table";
import { isProductUpgrade } from "@/lib/sortProducts";
import { CodeEditor } from "./code-editor2";
import { useState } from "react";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

const sortProducts = (a: Product, b: Product) => {
  if (!a.items || !b.items) return 0;

  const isUpgradeA = isProductUpgrade({
    items1: a.items,
    items2: b.items,
  });

  return isUpgradeA ? -1 : 1;
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
  const productGroups = groupProductsByBilling(pricingModel?.products ?? []);

  const pricecnProducts = productGroups
    .map((group) => toPricecnProductWithBilling({
      productGroup: group,
      features: pricingModel.features,
    }))
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => {
      const aProduct = pricingModel.products.find(p => p.id === a.id);
      const bProduct = pricingModel.products.find(p => p.id === b.id);
      if (aProduct && bProduct) {
        return sortProducts(aProduct, bProduct);
      }
      return 0;
    });

  return (
    <div className="flex flex-col h-full w-full items-center">
      <div className="flex flex-col gap-2 mt-10 max-w-[800px] w-full">
        <PricingTable products={pricecnProducts as any}>
          {pricecnProducts.map((p) => (
            <PricingCard key={p.id} productId={p.id} />
          ))}
        </PricingTable>
      </div>
      <div className="mt-6 w-full max-w-[400px]">
        {/* Temporary: always show for debugging */}
        {pricingModel.features.some(
          (feature) => feature.type === "credit_system"
        ) && (
            <div className="bg-white border border-gray-200 rounded-xs p-4 shadow-md">
              {pricingModel.features
                .filter((feature) => feature.type === "credit_system")
                .map((creditFeature) => (
                  <div key={creditFeature.id} className="mb-4 last:mb-0">
                    <span className="uppercase text-sm font-medium mb-2">
                      {creditFeature.name}
                    </span>
                    {creditFeature.credit_schema &&
                      creditFeature.credit_schema.length > 0 ? (
                      <div className="space-y-1 mt-2">
                        {creditFeature.credit_schema.map((schema, index) => {
                          const meteredFeature = pricingModel.features.find(
                            (f) => f.id === schema.metered_feature_id
                          );
                          return (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-secondary px-3 py-1 rounded-xs border"
                            >
                              <span className="text-sm text-zinc-500">
                                {meteredFeature?.name ||
                                  schema.metered_feature_id}
                              </span>
                              <span className="text-sm text-gray-600">
                                {schema.credit_cost}{" "}
                                {schema.credit_cost === 1 ? "credit" : "credits"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No credit schema defined
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}
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
