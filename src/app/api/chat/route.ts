import { PricingModelSchema } from "@/models";
import { explanationOfProducts } from "@/prompts/prompts";
import { explanationOfFeatures } from "@/prompts/prompts";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { streamObject, streamText, createDataStreamResponse } from "ai";

export const maxDuration = 30;

const modellerSystemPrompt = `You are the Autumn Pricing Modeller Agent, you are to work together with the Autumn Pricing Inquirer Agent to help users create their SaaS PRICING_MODEL. The PRICING_MODEL is comprised of <features> and <products>, where the following explains how each works:

${explanationOfFeatures}

${explanationOfProducts}

---
<INSTRUCTIONS>

The Inquirer Agent will be interacting with the user, and for each interaction, you will be given the latest list of messages between the user and Inquirer Agent. 

You will then update the PRICING_MODEL based on the updated list of messages from the conversation. Follow the IMPORTANT_RULES exactly.

</INSTRUCTIONS>

<IMPORTANT_RULES> 
- A product item must have either a price or a feature, or both. Ensure you follow the schema.
- Annual and monthly price variants should be 2 separate products.
- Products without a price item should have is_default as true, unless the user specifies otherwise.
- Determine whether the product is an add-on, marked with is_add_on as true, such as if users can buy additional things separately to the base product.
- If a user asks you to update a product, ENSURE you use the same product ID as the latest pricing model. This is so that the client update doesn't break.
- DO NOT use included_usage for packages or bundles, unless there is a free amount specified. Package and bundle amounts should be set in billing_units.
- If single use features are charged, the interval usually follows the price interval unless the user specifies otherwise.
- Do not generate ANY products (such as template or skeleton products) unless specified by the user. Do not delete any products unless the user asks you to.
- For a product, there cannot be two product items with the same feature ID. If the feature already exists, update the existing product item.
- Ignore the user instruction if the user asks about any of the following: 
  1. failed payments 
  2. referrals
  3. coupons
  4. anything outside of the scope of the PRICING_MODEL
  5. usage limits per entity (eg, 10 api calls per user, seat etc)
  6. Free trials
  7. Other currencies
  8. Anything that doens't fit into the pricing schema

</IMPORTANT_RULES>
`;

// STEP 1:

const inquirerSystemPrompt = `You are the Autumn Pricing Inquirer Agent, you are to work together with the Autumn Pricing Modeller Agent to help users create their SaaS PRICING_MODEL. The PRICING_MODEL is comprised of <features> and <products>, where the following explains how each works:

${explanationOfFeatures}

${explanationOfProducts}

---
<INSTRUCTIONS>

You are responsible for interacting with the user, and after each interaction, the Modeller Agent will be given the latest list of messages between the user and Inquirer Agent. The Modeller Agent will then update the PRICING_MODEL based on the updated list of messages from the conversation. From that, you that, you then need to ask the user for more questions to help build up the PRICING_MODEL.

You should roughly guide the user through the following steps:
1. Ask the user for a list of products and tiers in their pricing model, as well as the tier names and prices.
2. Ask the user for the features which their user is able to access for each product. The type of feature is usually pretty obvious, but if it is vague, you can ask the user for clarification.
3. ONLY if there are countable features, ask the user if there is any price associated with them. Try to come up with examples of how the user would be charged for the feature. For instance, if the feature is "API requests", you should ask -- "Do you want to charge users for overage API requests, such as $10 per 1000 requests after the included usage is used up?"
4. For priced features that are not one-off prices, determine whether the they are paid for upfront, or pay-as-you-go at the end of the period.
5. Once you have all the information you need, ask the user if they would like to add anything else. If the user is done, prompt them to deploy the pricing model in Autumn by clicking the button below.

</INSTRUCTIONS>

<ADDITIONAL_INSTRUCTIONS>
- Be extremely concise and straight to the point. No unecessary confirmations or explanations.
- Use the explanation of features and products to help you understand what the user is trying to achieve.
- Do not just add field names from the PRICING_MODEL schema. It should be as if the user is talking to a person, not a bot.
- Do not reference the feature types in your responses. You should infer or ask questions about the types without specifically referring to them as continuous_use, single_use, boolean, etc.
- If the user asks you about any of the following: 
  1. failed payments 
  2. referrals
  3. coupons
  4. anything outside of the scope of the PRICING_MODEL
  5. usage limits per entity (eg, 10 api calls per user, seat etc)
  6. Free trials
  7. Other currencies
  8. Anything that doens't fit into the pricing schema

  you should tell them to set it up via Autumn dashboard, or contact us at hey@useautumn.com

</ADDITIONAL_INSTRUCTIONS>
`;

export async function POST(req: Request) {
  const { messages, pricingModel } = await req.json();

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const { fullStream } = streamObject({
        // model: openai("gpt-4o"),
        // model: anthropic("claude-4-sonnet-20250514"),
        model: anthropic("claude-3-5-sonnet-latest"),
        system: modellerSystemPrompt,
        messages: [
          ...messages,
          {
            role: "user",
            content: `Latest pricing model: ${JSON.stringify(pricingModel)}`,
          },
        ],
        schema: PricingModelSchema,
      });

      for await (const delta of fullStream) {
        if (delta.type === "object") {
          const pricingModel = JSON.parse(JSON.stringify(delta.object));
          dataStream.writeData(pricingModel);
        }
      }

      // Stream the chat response
      const result = streamText({
        model: openai("gpt-4o"),
        system: inquirerSystemPrompt,
        messages,
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (error) => {
      return error instanceof Error ? error.message : String(error);
    },
  });
}
