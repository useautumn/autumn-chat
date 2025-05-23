import { ProductItem, ProductItemInterval } from "@/models";

const isFreeProduct = (items: ProductItem[]) => {
  return items.every((item) => !item.price);
};

const ProductItemIntervalOrder = [
  null,
  undefined,
  ProductItemInterval.Minute,
  ProductItemInterval.Hour,
  ProductItemInterval.Day,
  ProductItemInterval.Week,
  ProductItemInterval.Month,
  ProductItemInterval.Quarter,
  ProductItemInterval.SemiAnnual,
  ProductItemInterval.Year,
];

export const getBillingInterval = (items: ProductItem[]) => {
  if (items.length === 0) {
    return null;
  }

  const itemsCopy = structuredClone(items);

  try {
    itemsCopy.sort((a, b) => {
      return (
        ProductItemIntervalOrder.indexOf(b.interval) -
        ProductItemIntervalOrder.indexOf(a.interval)
      );
    });
  } catch (error) {
    console.log("Error sorting prices:", error);
    throw error;
  }

  return itemsCopy[itemsCopy.length - 1].interval;
};

export const isProductUpgrade = ({
  items1,
  items2,
}: {
  items1: ProductItem[];
  items2: ProductItem[];
}) => {
  if (isFreeProduct(items1) && !isFreeProduct(items2)) {
    return true;
  }

  if (!isFreeProduct(items1) && isFreeProduct(items2)) {
    return false;
  }

  const billingInterval1 = getBillingInterval(items1);
  const billingInterval2 = getBillingInterval(items2);

  // 2. Get total price for each product
  const getTotalPrice = (items: ProductItem[]) => {
    // Get each product's price prorated to a year
    let totalPrice = 0;
    for (const item of items) {
      totalPrice += item.price || 0;
    }
    return totalPrice;
  };

  // 3. Compare prices
  if (billingInterval1 == billingInterval2) {
    return getTotalPrice(items1) < getTotalPrice(items2);
  } else {
    // If billing interval is different, compare the billing intervals
    return (
      ProductItemIntervalOrder.indexOf(billingInterval1) <
      ProductItemIntervalOrder.indexOf(billingInterval2)
    );
  }
};
