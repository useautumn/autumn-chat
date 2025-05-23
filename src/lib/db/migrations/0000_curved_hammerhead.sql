CREATE TABLE "chat_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" numeric DEFAULT extract(epoch from now()) * 1000 NOT NULL
);
