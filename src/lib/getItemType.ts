import { notNullish, nullish } from "@/lib/utils";
import { ProductItem } from "@/models";

export const isBooleanFeatureItem = (item: ProductItem) => {
  return (
    notNullish(item.feature_id) &&
    (nullish(item.price) || item.price == 0) &&
    nullish(item.interval) &&
    nullish(item.included_usage)
  );
};

export const isFeatureItem = (item: ProductItem) => {
  return (
    notNullish(item.feature_id) && (nullish(item.price) || item.price == 0)
  );
};

export const isPriceItem = (item: ProductItem) => {
  return notNullish(item.price) && nullish(item.feature_id);
};

export const isFeaturePriceItem = (item: ProductItem) => {
  return notNullish(item.feature_id) && notNullish(item.price);
};
