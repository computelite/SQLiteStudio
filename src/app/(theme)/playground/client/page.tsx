import ClientOnly from "@/components/client-only";
import { Metadata } from "next";
import ThemeLayout from "../../theme_layout";
import PlaygroundEditorBody from "./page-client";

export const metadata: Metadata = {
  title:
    "SQLite Online Playground - Powerful and lightweight editor on your browser",
  description:
    "Explore the powerful SQLite Playground in your browser – no downloads or registration needed. Effortlessly load your SQLite files or start with a blank database, then save your work with ease. Enjoy a robust data editor, advanced query capabilities, table creation, and much more.",
  keywords: [
    "sqlite",
    "libsql",
    "browser",
    "client",
    "gui",
    "playground",
    "sandbox",
    "explorer",
    "studio",
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default async function PlaygroundEditor() {

  return (
    <ThemeLayout>
      <ClientOnly>
        <PlaygroundEditorBody />
      </ClientOnly>
    </ThemeLayout>
  );
}
