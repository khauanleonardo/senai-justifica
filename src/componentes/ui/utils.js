// Junta classes CSS do Tailwind sem conflitos (ex.: cn("p-2", ativo && "bg-primary")).
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
