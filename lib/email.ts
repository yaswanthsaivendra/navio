import { Resend } from "resend";
import InvitationEmail from "@/emails/invitation-email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail({
  to,
  invitedByName,
  organizationName,
  token,
  role,
}: {
  to: string;
  invitedByName: string;
  organizationName: string;
  token: string;
  role: string;
}) {
  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
  }

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

  try {
    // For testing: Use delivered@resend.dev instead of actual email
    // This bypasses domain verification requirements
    const testMode = !process.env.RESEND_DOMAIN_VERIFIED;
    const recipientEmail = testMode ? "delivered@resend.dev" : to;

    const { data, error } = await resend.emails.send({
      from: "Navio <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `${invitedByName} invited you to join ${organizationName}`,
      react: InvitationEmail({
        invitedByName,
        organizationName,
        inviteLink,
        role,
      }),
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Email service error:", error);
    throw error;
  }
}
