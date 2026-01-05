// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>PocketSaver</title>
      </head>
      <body className="font-sans bg-secondary text-gray-800 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
