import { envSchema } from "@/lib/env";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(envSchema.RESEND_API_KEY);

type ContactBody = {
  email: string;
  message: string;
  name: string;
  topic: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactBody;

    if (!body.name || !body.email || !body.topic || !body.message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Send notification to November Sierra
    await resend.emails.send({
      from: envSchema.CONTACT_EMAIL_FROM,
      replyTo: body.email,
      subject: `[November Sierra] ${body.topic} — from ${body.name}`,
      text: [`Name: ${body.name}`, `Email: ${body.email}`, `Topic: ${body.topic}`, "", "Message:", body.message].join(
        "\n",
      ),
      to: envSchema.CONTACT_EMAIL_TO,
    });

    // Send confirmation to the submitter
    await resend.emails.send({
      from: envSchema.CONTACT_EMAIL_FROM,
      subject: "We received your message — November Sierra",
      text: [
        `Hi ${body.name},`,
        "",
        "Thanks for reaching out! We've received your message and will get back to you soon.",
        "",
        "Best,",
        "November Sierra",
      ].join("\n"),
      to: body.email,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
