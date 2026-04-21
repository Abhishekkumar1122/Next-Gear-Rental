import { createContactRequest } from "@/lib/contact-requests";
import { NextResponse } from "next/server";
import { z } from "zod";

const contactPayloadSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(24),
  message: z.string().trim().min(10).max(1200),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = contactPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid contact message", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const contactRequest = await createContactRequest(parsed.data);
  return NextResponse.json({ message: "Message sent successfully", contactRequest }, { status: 201 });
}
