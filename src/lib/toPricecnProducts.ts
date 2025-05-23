import { isPriceItem, isFeaturePriceItem } from "@/lib/getItemType";
import { notNullish, nullish } from "@/lib/utils";
import { getFeatureName } from "@/lib/getFeatureName";
import { Feature, Product, ProductItem } from "@/models";

export const numberWithCommas = (x: number) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const sortProductItems = (items: ProductItem[], features: Feature[]) => {
  items.sort((a, b) => {
    const aIsPriceItem = isPriceItem(a);
    const bIsPriceItem = isPriceItem(b);

    if (aIsPriceItem && bIsPriceItem) {
      return 0;
    }

    if (aIsPriceItem && !bIsPriceItem) {
      return -1;
    }

    if (!aIsPriceItem && bIsPriceItem) {
      return 1;
    }

    // 2. Put feature price next
    const aIsFeatureItem = isFeaturePriceItem(a);
    const bIsFeatureItem = isFeaturePriceItem(b);

    if (aIsFeatureItem && !bIsFeatureItem) {
      return -1;
    }

    if (!aIsFeatureItem && bIsFeatureItem) {
      return 1;
    }

    // 3. Put feature price items in alphabetical order
    const feature = features.find((f) => f.id == a.feature_id);
    const aFeatureName = feature?.name;
    const bFeatureName = features.find((f) => f.id == b.feature_id)?.name;

    if (!aFeatureName || !bFeatureName) {
      return 0;
    }

    return aFeatureName.localeCompare(bFeatureName);
  });

  return items;
};

export const getIncludedFeatureName = ({
  item,
  feature,
}: {
  item: ProductItem;
  feature: Feature;
}) => {
  return getFeatureName({
    feature,
    plural: typeof item.included_usage === "number" && item.included_usage > 1,
  });
};

export const getPriceText = ({ item }: { item: ProductItem }) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 10,
    }).format(amount);
  };

  return formatAmount(item.price as number);
};

export const getPricecnPrice = ({
  items,
  features,
  isMainPrice = true,
}: {
  features: Feature[];
  items: ProductItem[];
  isMainPrice?: boolean;
}) => {
  const priceExists = items.some(
    (i) => isPriceItem(i) || isFeaturePriceItem(i)
  );

  if (!priceExists) {
    return {
      primaryText: "Free",
      secondaryText: " ",
    };
  }

  const priceItem = items[0];

  if (isPriceItem(priceItem)) {
    return {
      primaryText: getPriceText({ item: priceItem }),
      secondaryText: priceItem.interval ? `per ${priceItem.interval}` : "",
    };
  } else {
    const feature = features.find((f) => f.id == priceItem.feature_id);
    return featurePricetoPricecnItem({
      feature,
      item: priceItem,
      isMainPrice,
    });
  }
};

export const featureToPricecnItem = ({
  feature,
  item,
}: {
  feature?: Feature;
  item: ProductItem;
}) => {
  if (!feature) {
    throw new Error(`Feature ${item.feature_id} not found`);
  }
  // 1. If feature
  if (feature.type == "boolean") {
    return {
      primaryText: feature.name,
    };
  }

  const featureName = getIncludedFeatureName({
    feature,
    item,
  });

  const includedUsageTxt =
    item.included_usage == "inf"
      ? "Unlimited "
      : nullish(item.included_usage) || item.included_usage == 0
      ? ""
      : `${numberWithCommas(item.included_usage!)} `;

  return {
    primaryText: `${includedUsageTxt}${featureName}`,
  };
};

export const featurePricetoPricecnItem = ({
  feature,
  item,
  isMainPrice = false,
  withNameAfterIncluded = false,
}: {
  feature?: Feature;
  item: ProductItem;
  isMainPrice?: boolean;
  withNameAfterIncluded?: boolean;
}) => {
  if (!feature) {
    throw new Error(`Feature ${item.feature_id} not found`);
  }

  // 1. Get included usage
  const includedFeatureName = getIncludedFeatureName({
    feature,
    item,
  });

  const includedUsageStr =
    nullish(item.included_usage) || item.included_usage == 0
      ? ""
      : `${numberWithCommas(item.included_usage as number)} ${
          withNameAfterIncluded ? `${includedFeatureName} ` : ""
        }included`;

  const priceStr = getPriceText({ item });
  const billingFeatureName = getFeatureName({
    feature,
    plural: typeof item.billing_units == "number" && item.billing_units > 1,
  });

  let priceStr2 = "";
  if (item.billing_units && item.billing_units > 1) {
    priceStr2 = `${numberWithCommas(item.billing_units)} ${billingFeatureName}`;
  } else {
    priceStr2 = `${billingFeatureName}`;
  }

  const intervalStr =
    isMainPrice && item.interval ? ` per ${item.interval}` : "";

  if (includedUsageStr) {
    return {
      primaryText: includedUsageStr,
      secondaryText: `then ${priceStr} per ${priceStr2}${intervalStr}`,
    };
  }

  return {
    primaryText: priceStr,
    secondaryText: `per ${priceStr2}${intervalStr}`,
  };
};

export const toPricecnProduct = ({
  product,
  features,
}: {
  product: Product;
  features: Feature[];
}) => {
  try {
    if (!product.items) {
      return null;
    }

    const items = structuredClone(product.items);

    sortProductItems(items, features);

    const priceExists = items.some(
      (i) => isPriceItem(i) || isFeaturePriceItem(i)
    );

    const price = getPricecnPrice({ items, features });
    const itemsWithoutPrice = priceExists ? items.slice(1) : items;

    const pricecnItems = itemsWithoutPrice

      .map((i) => {
        const feature = features.find((f) => f.id == i.feature_id);
        if (!feature) {
          return null;
        }

        if (isFeaturePriceItem(i)) {
          return featurePricetoPricecnItem({ feature, item: i });
        } else {
          return featureToPricecnItem({ feature, item: i });
        }
      })
      .filter(notNullish);

    return {
      id: product.id,
      name: product.name,
      buttonText: "Get Started",
      price: price,
      items: pricecnItems,
      // buttonUrl: org.stripe_config?.success_url,
    };
  } catch (error) {
    console.log("Product", product);
    console.error(error);
    return null;
  }
};

function patchObject<T>(prev: T, next: Partial<T>): T {
  const result = { ...prev };
  for (const key in next) {
    if (next[key] !== undefined) {
      result[key] = next[key];
    }
  }
  return result;
}
