import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client });

import { config } from "dotenv";
config({ path: ".env" }); // or .env.local

import { NextRequest, NextResponse } from "next/server";
import { chatResults } from "@/lib/db/schema";

import KSUID from "ksuid";

export const POST = async (req: NextRequest) => {
  try {
    const { pricingModel } = await req.json();

    const id = KSUID.randomSync().string;

    try {
      let result = await db
        .insert(chatResults)
        .values({
          id,
          data: pricingModel,
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
