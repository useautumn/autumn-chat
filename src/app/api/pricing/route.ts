import { PricingModelSchema } from "@/models";
import { explanationOfProducts } from "@/prompts/prompts";
import { explanationOfFeatures } from "@/prompts/prompts";
import { openai } from "@ai-sdk/openai";
import { generateObject, streamObject, streamText } from "ai";

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

export async function POST(req: Request) {
  const { messages } = await req.json();

  // for (const message of messages) {
  //   console.log("message", message);
  //   console.log("parts", message.parts);
  // }

  const result = streamObject({
    model: openai("gpt-4o"),
    system: modellerSystemPrompt,
    messages,
    schema: PricingModelSchema,
  });

  // console.log("--------------------------------");
  // for (const product of latestModel.products) {
  //   console.log("product:", product.name);
  //   for (const item of product.items) {
  //     console.log(item);
  //   }
  //   console.log("");
  // }
  // console.log("\n");
  // for (const feature of latestModel.features) {
  //   console.log(feature);
  // }

  // const result = streamText({
  //   model: openai("gpt-4o"),
  //   system: inquirerSystemPrompt,
  //   messages,
  // });

  return result.toTextStreamResponse();
}
