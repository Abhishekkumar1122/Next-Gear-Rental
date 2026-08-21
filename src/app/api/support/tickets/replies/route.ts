import { ticketReplies, supportTickets } from "@/lib/mock-data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ticketId = request.nextUrl.searchParams.get("ticketId");

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId required" }, { status: 400 });
  }

  const replies = ticketReplies.filter((r) => r.ticketId === ticketId);

  return NextResponse.json({ replies: replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const { ticketId, userId, userName, userRole, message } = payload;

  if (!ticketId || !userId || !userName || !userRole || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ticket = supportTickets.find((t) => t.id === ticketId);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const reply = {
    id: `tr${ticketReplies.length + 1}`,
    ticketId,
    userId,
    userName,
    userRole: userRole as "admin" | "customer" | "vendor",
    message,
    createdAt: new Date().toISOString(),
  };

  ticketReplies.push(reply);
  ticket.updatedAt = new Date().toISOString();

  // If Admin or Vendor replied, notify customer via Email
  if ((userRole === "admin" || userRole === "vendor") && (ticket as any).userEmail) {
    const origin = request.nextUrl.origin;
    const customerEmail = (ticket as any).userEmail;
    void (async () => {
      try {
        const { generateSupportTicketEmailHtml } = await import("@/lib/email-templates");
        const { dispatchHtmlEmail } = await import("@/lib/alert-dispatch");
        const html = generateSupportTicketEmailHtml({
          ticketId,
          subject: ticket.subject,
          category: ticket.category || "General Support",
          message: `Update from Support Team (${userName}):\n\n${message}`,
          customerName: ticket.userName || "Valued Customer",
          baseUrl: origin,
        });
        await dispatchHtmlEmail({
          to: customerEmail,
          subject: `Support Reply Re: ${ticket.subject} [Ticket #${ticketId}]`,
          html,
        });
      } catch (e) {
        console.error("[Support Ticket Reply Email Error]", e);
      }
    })();
  }

  return NextResponse.json({ reply }, { status: 201 });
}
