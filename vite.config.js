// Configuração do Vite: React + Tailwind. Rode "npm run dev" para abrir em http://localhost:5173
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
