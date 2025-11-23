// Quick test script to verify Resend is working
// Run with: npx tsx scripts/test-email.ts

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log("\n🧪 Testing Resend Email Service...\n");

  // Check environment variables
  console.log("Environment Check:");
  console.log(
    "✓ RESEND_API_KEY:",
    process.env.RESEND_API_KEY
      ? `${process.env.RESEND_API_KEY.substring(0, 10)}...`
      : "❌ NOT SET"
  );
  console.log(
    "✓ NEXT_PUBLIC_APP_URL:",
    process.env.NEXT_PUBLIC_APP_URL || "❌ NOT SET"
  );
  console.log("");

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is not set in .env.local");
    console.log("\n💡 Add this to your .env.local file:");
    console.log("RESEND_API_KEY=re_your_api_key_here\n");
    process.exit(1);
  }

  try {
    console.log("📧 Sending test email...\n");

    const { data, error } = await resend.emails.send({
      from: "Navio <onboarding@resend.dev>",
      to: ["delivered@resend.dev"], // Resend test email
      subject: "Test Email from Navio",
      html: `
        <h1>✅ Email Test Successful!</h1>
        <p>If you're seeing this, your Resend integration is working correctly.</p>
        <p><strong>Next steps:</strong></p>
        <ul>
          <li>Check your Resend dashboard for this email</li>
          <li>Try sending an invitation from your app</li>
          <li>Check server logs for email debugging info</li>
        </ul>
      `,
    });

    if (error) {
      console.error("❌ Resend API Error:");
      console.error(JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log("✅ Email sent successfully!");
    console.log("📧 Email ID:", data?.id);
    console.log("\n💡 Check your Resend dashboard:");
    console.log("https://resend.com/emails\n");
  } catch (error) {
    console.error("❌ Failed to send email:");
    console.error(error);
    process.exit(1);
  }
}

testEmail();
