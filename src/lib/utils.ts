import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeText(text: string) {
  return text.replace("<has_function_call>", "");
}

export const nullish = (value: any) => {
  return value === null || value === undefined;
};

export const notNullish = (value: any) => {
  return !nullish(value);
};
