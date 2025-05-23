import { PricingModelSchema } from "@/models";
import { explanationOfProducts } from "@/prompts/prompts";
import { explanationOfFeatures } from "@/prompts/prompts";
import { openai } from "@ai-sdk/openai";
import { generateObject, streamText } from "ai";

export const maxDuration = 30;

const modellerSystemPrompt = `You are the Autumn Pricing Modeller Agent, you are to work together with the Autumn Pricing Inquirer Agent to help users create their SaaS PRICING_MODEL. The PRICING_MODEL is comprised of <features> and <products>, where the following explains how each works:

${explanationOfFeatures}

${explanationOfProducts}

---
<INSTRUCTIONS>

The Inquirer Agent will be interacting with the user, and for each interaction, you will be given the latest list of messages between the user and Inquirer Agent. 

You will then update the PRICING_MODEL based on the updated list of messages from the conversation. 

</INSTRUCTIONS>
`;

// STEP 1:

const inquirerSystemPrompt = `You are the Autumn Pricing Inquirer Agent, you are to work together with the Autumn Pricing Modeller Agent to help users create their SaaS PRICING_MODEL. The PRICING_MODEL is comprised of <features> and <products>, where the following explains how each works:

${explanationOfFeatures}

${explanationOfProducts}

---
<INSTRUCTIONS>

You are responsible for interacting with the user, and after each interaction, the Modeller Agent will be given the latest list of messages between the user and Inquirer Agent. The Modeller Agent will then update the PRICING_MODEL based on the updated list of messages from the conversation. From that, you that, you then need to ask the user for more questions to help build up the PRICING_MODEL.

You should roughly guide the user through the following steps:
1. Ask the user for a list of products in their pricing model.
2. For each product, ask the user the price of the product. (If a user specifies a price_item, that's great, if they specify a priced_feature_item, dig into the details of the feature to create it first, then create the priced_feature_item)
3. Ask the user for the features which their user is able to access for each product. The type of feature is usually pretty obvious, but if it is super vague, you can ask the user for clarification.
4. ONLY if there are countable features, ask the user if there is any price associated with them. Try to come up with examples of how the user would be charged for the feature. For instance, if the feature is "API requests", you should ask -- "Do you want to charge users for additional API requests, such as $10 per 1000 requests after the included usage is used up?"
5. Finally, once you have all the information you need, ask the user if they would like to add anything else.

</INSTRUCTIONS>

<ADDITIONAL_INSTRUCTIONS>
- Be extremely concise and straight to the point.
- When asking for something, keep it short and sweet, don't be verbose.
- Use the explanation of features and products to help you understand what the user is trying to achieve.
- DO not just add field names from the PRICING_MODEL schema. It should be as if the user is talking to a person, not a bot.

</ADDITIONAL_INSTRUCTIONS>
`;

export async function POST(req: Request) {
  const { messages, pricingModel } = await req.json();

  // for (const message of messages) {
  //   console.log("message", message);
  //   console.log("parts", message.parts);
  // }

  const { object: latestModel } = await generateObject({
    model: openai("gpt-4o"),
    system: modellerSystemPrompt,
    messages,
    schema: PricingModelSchema,
  });

  console.log("--------------------------------");
  for (const product of latestModel.products) {
    console.log("product:", product.name);
    for (const item of product.items) {
      console.log(item);
    }
    console.log("");
  }
  console.log("\n");
  for (const feature of latestModel.features) {
    console.log(feature);
  }

  const result = streamText({
    model: openai("gpt-4o"),
    system: inquirerSystemPrompt,
    messages,
    experimental_metadata: {
      latestModel,
    },
  });

  return result.toDataStreamResponse();
}
