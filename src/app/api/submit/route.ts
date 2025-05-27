import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
const client = postgres(process.env.DATABASE_URL!);

import { config } from "dotenv";
config({ path: ".env" }); // or .env.local

import { NextRequest, NextResponse } from "next/server";
import { chatResults } from "@/lib/db/schema";

import KSUID from "ksuid";
import { Feature, FeatureSchema, Product, ProductSchema } from "@/models";

const db = drizzle({ client });
export const POST = async (req: NextRequest) => {
  try {
    const { pricingModel } = await req.json();

    const parsedFeatures: Feature[] = [];
    for (const feature of pricingModel.features) {
      try {
        parsedFeatures.push(FeatureSchema.parse(feature));
      } catch (error) {}
    }

    const parsedProducts: Product[] = [];
    for (const product of pricingModel.products) {
      try {
        parsedProducts.push(ProductSchema.parse(product));
      } catch (error) {}
    }

    const id = KSUID.randomSync().string;

    try {
      const result = await db
        .insert(chatResults)
        .values({
          id,
          data: {
            ...pricingModel,
            features: parsedFeatures,
            products: parsedProducts,
          },
          created_at: Date.now(),
        })
        .returning();
      console.log(result);
    } catch (error) {
      console.error("Failed to submit chat result!", error);
    }

    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
};
