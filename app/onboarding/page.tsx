import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import OnboardingClient from "./onboarding-client";

export default async function OnboardingPage() {
  const session = await auth();

  // Must be authenticated
  if (!session) {
    redirect("/login");
  }

  return <OnboardingClient />;
}
