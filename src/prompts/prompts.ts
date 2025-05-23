import zodToJsonSchema from "zod-to-json-schema";
import { FeatureSchema, ProductSchema } from "../models";

export const explanationOfFeatures = `HOW FEATURES WORK:
- A feature is defined as follows: ${zodToJsonSchema(FeatureSchema)}

- A boolean type refers to a feature that is either accessable or not. For instance, "advanced analytics", or "SOC 2 compliance".

- A singel_use type refers to a countable feature that is "consumed". When the user uses one unit of this feature, it can never be "unused". For instance, "GPU credits", or "API requests", or "AI chat messages".

- A continuous_use type refers to a feature that is countable, but sort of "rentable". For instance, "seats", or "compute instances", or "storage", or "projects". A good model to think about continuous_use is whether the usage can be both incremented and decremented. For instance, you could add or remove a seat.

- The last type is a credit_system. This is the least common, and it allows the user to track usage of different features from a shared balance. ONLY specify the feature as a credit_system if it is needed to track usage of OTHER features. If the user just specifies "credits" as a feature, that doesn't necessarily mean it's a credit_system. "credit_schema" specifies how many credits the feature consumes. Any feature present in the credit_schema MUST be present in the features array as a single_use feature. The two most common examples of a credit system are:

    1. Compute costs. How this usually works is that the user will have a feature for each compute instance (in terms of hours used), and then the credit system will assign an hour price to each compute instance.

    2. General credit system for AI actions. In this case, the user might be building some AI app, and have multiple actions which cost X amount of credits. This is another good application of a credit system.
`;

export const explanationOfProducts = `HOW PRODUCTS WORK:
- A product is defined as follows: ${zodToJsonSchema(
  ProductSchema
)}. The top level fields are self-explanatory. The key field to pay attention to is the items field. Here is how it works:

1. An item is defined as either a feature_item, a price_item, or a priced_feature_item.

Feature: 
- A feature_item is just some entitlement that is included in the product. 
- For countable features, it will have an included_usage field, which is how much of the feature the user gets (it can be "inf" for unlimited). 
- If the feature type is 'single_use', the 'interval' field is relevant. Interval refers to how often the feature usage is reset. For instance, 500 chat messages per month means that the end user will have 500 chat messages to use every month. They can't go past that limit, and unused messages don't roll over to the next month.

Price:
- A price_item simply refers to the price of the product. 
- There is usually only one of this, but in certain cases (eg. one time fee for implementation), there might be multiple. 
- If a user says that the base price of their plan is just $100 / month, or $1000 / year, that would be a price_item. 
- The "interval" field should be used to specify the recurring interval of the price. 

Priced Feature:
- A priced_feature_item is basically a feature that can be charged for.
- In this case, the "interval" field would refer to how often the feature is charged.
- In this case, included_usage works the same way as feature_item (except that it can't be "inf")
- Any usage past included_usage will be charged based on "price" and "billing_units" fields.
- For instance, the combination of {"included_usage": 100, "interval": "month", "price": 10, "billing_units": 15} would mean that the user gets 100 units of the feature for free, and then any usage past that will be charged at $10 per 15 units of the feature.
- Do note that for "continuous_use" features, at each interval, the usage will NOT be reset and will carry to the next interval.
- usage_model should usually be "pay_per_use". "prepaid" is usually used for one time fees. But how it works is that "prepaid" means when the user buys the product, they can specify how many units they want to buy upfront, and then will be charged that amount. The best model for this is add on packs for credits.


`;
