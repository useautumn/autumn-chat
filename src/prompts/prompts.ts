import zodToJsonSchema from "zod-to-json-schema";
import { FeatureSchema, ProductSchema } from "../models";

export const explanationOfFeatures = `HOW FEATURES WORK:
- A feature is defined as follows: ${zodToJsonSchema(FeatureSchema)}

- A boolean type refers to a feature that can either be on or off. For instance, "advanced analytics", or "access to premium models".

- A single_use type refers to a metered feature that is "consumed". When the user uses one unit of this feature, it can never be "unused". For instance, "GPU credits", or "API requests", or "AI chat messages".

- A continuous_use type refers to a metered feature that is in-use on an ongoing basis. For instance, "seats", or "compute instances", or "storage", or "projects".

- A credit_system allows the user to track usage of different features from a shared balance. ONLY specify the feature as a credit_system if it is needed to track usage of OTHER features. "credit_schema" specifies how many credits the feature consumes. Any feature present in the credit_schema MUST be present in the features array as a single_use feature.
`;

export const explanationOfProducts = `HOW PRODUCTS WORK:
- A product is defined as follows: ${zodToJsonSchema(
  ProductSchema
)}. The top level fields are self-explanatory. The key field to pay attention to is the items field. Here is how it works:

1. An item is defined as either a feature_item, a price_item, or a priced_feature_item.

Feature: 
- A feature_item is just some entitlement that is included in the product. 
- For metered features, it will have an included_usage field, which is how much of the feature the user gets for free. It can be "inf" for unlimited. 
- If the feature type is 'single_use', the 'interval' field is relevant. Interval refers to how often the feature usage is reset. For instance, 500 chat messages per month.

Price:
- A price_item simply refers to the fixed price of the product. It can be one-off or a subscription.
- The "interval" field should be used to specify the recurring interval of the price. 

Priced Feature:
- A priced_feature_item is a feature that can be charged based on usage.
- In this case, the "interval" field would refer to how often the feature is charged.
- Included_usage is how much usage is available for free. For priced features it cannot be "inf".
- Any usage past included_usage will be charged based on "price" and "billing_units" fields.
- For instance, the combination of {"included_usage": 100, "interval": "month", "price": 10, "billing_units": 15} would mean that the user gets 100 units of the feature for free, and then any usage past that will be charged at $10 per 15 units of the feature.
- usage_model should be "pay_per_use" by default. If the user specifies that a usage quantity is bought upfront, or the priced feature is a one-off fee, then usage_model should be "prepaid".

`;
