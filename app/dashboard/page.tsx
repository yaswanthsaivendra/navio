import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-8 text-4xl font-bold">Dashboard</h1>
      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-8">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt="Profile"
            className="h-20 w-20 rounded-full"
          />
        )}
        <div className="text-center">
          <p className="text-xl font-semibold">{session.user?.name}</p>
          <p className="text-gray-400">{session.user?.email}</p>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button
            type="submit"
            className="rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
