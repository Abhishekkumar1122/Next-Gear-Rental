import { supportTickets } from "@/lib/mock-data";
import { SupportTicketPriority, SupportTicketCategory } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const vendorId = request.nextUrl.searchParams.get("vendorId");
  const status = request.nextUrl.searchParams.get("status");

  let filtered = supportTickets;

  if (userId) {
    filtered = filtered.filter((t) => t.userId === userId);
  }
  if (vendorId) {
    filtered = filtered.filter((t) => t.vendorId === vendorId);
  }
  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }

  return NextResponse.json({ tickets: filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const { userId, userName, userEmail, vendorId, bookingId, category, subject, description, priority } = payload;

  if (!userId || !userName || !userEmail || !category || !subject || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ticket = {
    id: `t${supportTickets.length + 1}`,
    userId,
    userName,
    userEmail,
    vendorId: vendorId ?? undefined,
    bookingId: bookingId ?? undefined,
    category: (category as SupportTicketCategory),
    subject,
    description,
    priority: (priority ?? "medium" as SupportTicketPriority),
    status: "open" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  supportTickets.unshift(ticket);

  return NextResponse.json({ ticket }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const payload = await request.json();
  const { id, status } = payload;

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  const ticket = supportTickets.find((t) => t.id === id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();

  if (status === "resolved" || status === "closed") {
    ticket.resolvedAt = new Date().toISOString();
  }

  return NextResponse.json({ ticket }, { status: 200 });
}
