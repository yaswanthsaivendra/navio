import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PreferencesClient from "./preferences-client";
export default async function PreferencesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <PreferencesClient
      user={{
        name: session.user.name || "",
        email: session.user.email || "",
      }}
    />
  );
}
