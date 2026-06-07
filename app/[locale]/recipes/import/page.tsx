import ImportClient from "./ImportClient";

// Behind auth (middleware protects /recipes/*). No need to index this page.
export const dynamic = "force-dynamic";

export default function ImportRecipePage() {
  return <ImportClient />;
}
