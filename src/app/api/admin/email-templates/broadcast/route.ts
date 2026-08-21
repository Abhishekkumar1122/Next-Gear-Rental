import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runtimeUsers } from "@/lib/runtime-store";

export async function POST(request: NextRequest) {
  try {
    const { templateId, targetEmails, couponCode, discountPercentage, festivalName, subject } = await request.json();

    if (!templateId) {
      return NextResponse.json({ ok: false, error: "Missing templateId" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    let recipients: { email: string; name: string }[] = [];

    if (Array.isArray(targetEmails) && targetEmails.length > 0) {
      recipients = targetEmails.map((e: string) => ({ email: e.trim(), name: "Rider" }));
    } else if (process.env.DATABASE_URL) {
      const users = await prisma.user.findMany({
        where: { email: { not: null } },
        select: { email: true, name: true },
      });
      recipients = users
        .filter((u) => Boolean(u.email))
        .map((u) => ({ email: u.email as string, name: u.name || "Rider" }));
    } else {
      recipients = runtimeUsers
        .filter((u) => Boolean(u.email))
        .map((u) => ({ email: u.email, name: u.name || "Rider" }));
    }

    if (recipients.length === 0) {
      return NextResponse.json({ ok: false, error: "No target email recipients found" }, { status: 404 });
    }

    const {
      generateWelcomeEmailHtml,
      generateFestiveEmailHtml,
      generateDiscountCouponEmailHtml,
      generateBlogNotificationEmailHtml,
    } = await import("@/lib/email-templates");
    const { dispatchHtmlEmail } = await import("@/lib/alert-dispatch");

    let dispatchedCount = 0;

    for (const user of recipients) {
      let html = "";
      let mailSubject = subject || "Next Gear Special Notification 🎁";

      if (templateId === "welcome") {
        html = generateWelcomeEmailHtml({ userName: user.name, couponCode: couponCode || "WELCOME10", discountPercentage: discountPercentage || 10, baseUrl: origin });
        mailSubject = subject || "Welcome to Next Gear Rentals! Claim Your First Ride Offer 🎁";
      } else if (templateId === "festive") {
        html = generateFestiveEmailHtml({ userName: user.name, festivalName: festivalName || "Festive Season", couponCode: couponCode || "FESTIVE25", discountPercentage: discountPercentage || 25, baseUrl: origin });
        mailSubject = subject || `${festivalName || "Festive"} Special Offer: Flat 25% OFF on Next Gear Rentals! 🎆`;
      } else if (templateId === "discount_coupon") {
        html = generateDiscountCouponEmailHtml({ userName: user.name, couponCode: couponCode || "RIDEGEAR20", discountTitle: "Flat ₹500 Instant Savings", baseUrl: origin });
        mailSubject = subject || "Exclusive Offer: Save Big on Your Next Ride! 🚗";
      } else {
        html = generateBlogNotificationEmailHtml({
          blogTitle: "Top 10 Self-Drive Car Rental Road Trip Routes in India for 2026",
          blogSlug: "car-rental-near-me-delhi-goa-mumbai-guide",
          excerpt: "Planning an unforgettable road trip from Delhi to Leh, Goa, or Manali? Here is your complete self-drive vehicle guide with budget rates.",
          readTimeMinutes: 5,
          userName: user.name,
          baseUrl: origin,
        });
        mailSubject = subject || "New Guide Published on Next Gear Journal 📰";
      }

      void dispatchHtmlEmail({ to: user.email, subject: mailSubject, html });
      dispatchedCount += 1;
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully dispatched email campaign to ${dispatchedCount} recipients`,
      dispatchedCount,
      templateId,
    });
  } catch (error: any) {
    console.error("[Email Broadcast Failed]", error);
    return NextResponse.json({ ok: false, error: error.message || "Failed to broadcast email campaign" }, { status: 500 });
  }
}
