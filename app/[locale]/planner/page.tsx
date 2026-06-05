import { redirect } from "next/navigation";

// Alias so a direct link to /planner (and /en/planner, /de/planner) works —
// the canonical route is /meal-planner.
export default function PlannerRedirect() {
  redirect("/meal-planner");
}
