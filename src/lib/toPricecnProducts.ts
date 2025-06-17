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
  const sortedItems = sortProductItems([...product.items], features);

  const items = sortedItems
    .map((item) => {
      if (isPriceItem(item)) {
        return null;
      }

      const feature = features.find((f) => f.id == item.feature_id);
      return featureToPricecnItem({
        feature,
        item,
      });
    })
    .filter(notNullish);

  const price = getPricecnPrice({
    items: sortedItems,
    features,
  });

  return {
    id: product.id,
    name: product.name,
    price,
    items,
  };
};

export const groupProductsByBilling = (products: Product[]) => {
  const groups = new Map<string, { monthly?: Product; yearly?: Product }>();
  
  products.forEach(product => {
    const isMonthly = product.name.toLowerCase().includes('monthly');
    const isYearly = product.name.toLowerCase().includes('yearly') || 
                     product.items?.some(item => item.interval === 'year');
    
    const baseName = product.name
      .replace(/\s*(monthly|yearly)\s*/i, '')
      .trim();
    
    if (!groups.has(baseName)) {
      groups.set(baseName, {});
    }
    
    const group = groups.get(baseName)!;
    if (isMonthly) {
      group.monthly = product;
    } else if (isYearly) {
      group.yearly = product;
    } else {
      group.monthly = product; // default to monthly
    }
  });
  
  return Array.from(groups.entries()).map(([name, group]) => ({
    ...group,
    base: group.monthly || group.yearly!,
  }));
};

export const toPricecnProductWithBilling = ({
  productGroup,
  features,
}: {
  productGroup: { monthly?: Product; yearly?: Product; base: Product };
  features: Feature[];
}) => {
  const { monthly, yearly, base } = productGroup;
  const baseProduct = monthly || yearly || base;
  
  const items = sortProductItems([...baseProduct.items], features)
    .filter(item => !isPriceItem(item))
    .map((item) => {
      const feature = features.find((f) => f.id == item.feature_id);
      return featureToPricecnItem({ feature, item });
    })
    .filter(notNullish);
  
  const getPrice = (product: Product) => getPricecnPrice({
    items: sortProductItems([...product.items], features),
    features,
  });
  
  const price = monthly ? getPrice(monthly) : yearly ? getPrice(yearly) : 
                { primaryText: "Free", secondaryText: " " };
  const priceAnnual = yearly && monthly ? getPrice(yearly) : undefined;
  
  const cleanName = baseProduct.name.replace(/\s*(monthly|yearly)\s*/i, '').trim();
  
  return {
    id: baseProduct.id,
    name: cleanName,
    price,
    priceAnnual,
    items,
    buttonText: "Get Started",
  };
};

// side note, what the fuck does this do?
function patchObject<T>(prev: T, next: Partial<T>): T {
  return {
    ...prev,
    ...next,
  };
}
