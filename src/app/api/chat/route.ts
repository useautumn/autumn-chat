import { PricingModelSchema } from "@/models";
import { explanationOfProducts } from "@/prompts/prompts";
import { explanationOfFeatures } from "@/prompts/prompts";
import { openai } from "@ai-sdk/openai";
import {
  streamObject,
  streamText,
  createDataStreamResponse,
  smoothStream,
} from "ai";

export const maxDuration = 30;

const modellerSystemPrompt = `You are the Autumn Pricing Modeller Agent, you are to work together with the Autumn Pricing Inquirer Agent to help users create their SaaS PRICING_MODEL. The PRICING_MODEL is comprised of <features> and <products>, where the following explains how each works:

${explanationOfFeatures}

${explanationOfProducts}

---
<INSTRUCTIONS>

The Inquirer Agent will be interacting with the user, and for each interaction, you will be given the latest list of messages between the user and Inquirer Agent. 

You will then update the PRICING_MODEL based on the updated list of messages from the conversation. 

</INSTRUCTIONS>

<ADDITIONAL_INSTRUCTIONS> 
- Do not return any product item with no price AND no feature. Feature ID should always be defined
- If a user asks you to update a product, ENSURE you use the same product ID as the latest pricing model. This is so that the client update doesn't break.
- If single use features are charged, the interval usually follows the billing interval unless the user specifies otherwise.
</ADDITIONAL_INSTRUCTIONS>
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
6. If the user is done, prompt them to deploy the pricing model in Autumn in the top right hand corner!

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

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const { fullStream } = streamObject({
        model: openai("gpt-4o"),
        system: modellerSystemPrompt,
        messages: [
          ...messages,
          {
            role: "user",
            content: `Latest pricing model: ${JSON.stringify(pricingModel)}`,
            // content: `I'm currently styling the chat bot. Generate minimal content (like empty product)`,
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
