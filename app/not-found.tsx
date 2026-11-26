import type { Metadata } from "next";
import SystemPage from "@/components/SystemPage";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return <SystemPage kind="notFound" />;
}
