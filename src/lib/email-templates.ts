/**
 * NEXT GEAR Rentals - Official Email Design System
 * 100% Universal Compatibility Across All Mobile & Desktop Email Clients (Gmail, Apple Mail, Outlook)
 */

import { getCustomTemplateById } from "@/lib/custom-templates-store";

export interface MasterTemplateProps {
  categoryText?: string;
  headerIconText?: string;
  title: string;
  titleBadge?: string;
  userName?: string;
  preheader?: string;
  heroIllustrationHtml?: string;
  contentHtml: string;
  baseUrl?: string;
  maxWidth?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  googlePlayUrl?: string;
  appStoreUrl?: string;
  supportEmail?: string;
  websiteUrl?: string;
}

/**
 * MASTER CONTAINER WRAPPER
 */
export function wrapInMasterEmailTemplate({
  categoryText = "NOTIFICATION",
  headerIconText = "🎧 Need Help?",
  title,
  titleBadge = "",
  userName = "Abhishek Singh",
  preheader = "Next Gear Notification",
  heroIllustrationHtml = `<div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%); border: 2px solid #f87171; text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">🚘</div>`,
  contentHtml,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-gear.app",
  maxWidth = "560px",
  facebookUrl = "https://facebook.com",
  instagramUrl = "https://instagram.com",
  twitterUrl = "https://twitter.com",
  linkedinUrl = "https://linkedin.com",
  googlePlayUrl = "https://play.google.com",
  appStoreUrl = "https://apps.apple.com",
  supportEmail = "support@next-gear.app",
  websiteUrl = "https://www.next-gear.app",
}: MasterTemplateProps): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const logoUrl = "https://next-gear.app/Logo1.png";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Next Gear</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #050505; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #ffffff; }
    
    .btn-red {
      background-color: #dc2626 !important;
      color: #ffffff !important;
      text-decoration: none !important;
      font-weight: 700 !important;
      border-radius: 10px !important;
      display: inline-block !important;
      box-shadow: 0 4px 18px rgba(220, 38, 38, 0.4) !important;
    }
    .btn-red:hover {
      background-color: #b91c1c !important;
      box-shadow: 0 0 25px rgba(220, 38, 38, 0.7) !important;
    }

    /* MOBILE RESPONSIVE QUERIES FOR GMAIL MOBILE & APPLE MAIL */
    @media only screen and (max-width: 520px) {
      .outer-card-td { padding: 8px 4px !important; }
      .outer-card-table { width: 100% !important; border-radius: 16px !important; }
      .hero-left-td { display: block !important; width: 100% !important; padding-right: 0 !important; text-align: center !important; }
      .hero-art-td { display: block !important; width: 100% !important; margin: 12px auto 0 auto !important; text-align: center !important; }
      .summary-cell { display: block !important; width: 100% !important; text-align: left !important; margin-bottom: 8px !important; padding-bottom: 8px !important; border-bottom: 1px dashed rgba(255,255,255,0.08) !important; }
      .summary-cell:last-child { margin-bottom: 0 !important; padding-bottom: 0 !important; border-bottom: none !important; }
      .summary-cell-right { text-align: left !important; }
      .footer-left-td { display: block !important; width: 100% !important; padding-right: 0 !important; border-right: none !important; border-bottom: 1px solid #18181c !important; padding-bottom: 16px !important; margin-bottom: 16px !important; text-align: center !important; }
      .footer-right-td { display: block !important; width: 100% !important; padding-left: 0 !important; text-align: center !important; }
      .footer-app-align { margin: 0 auto !important; float: none !important; }
      .footer-social-align { margin: 0 auto !important; }
      .grid-col-half { display: block !important; width: 100% !important; padding: 0 !important; margin-bottom: 12px !important; }
      .header-icon-td { display: none !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050505; color: #ffffff;">

  <!-- Preheader -->
  <div style="display: none; font-size: 1px; color: #050505; line-height: 1px; max-height: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505;">
    <tr>
      <td class="outer-card-td" align="center" style="padding: 16px 8px;">

        <!-- Main Outer Card -->
        <table class="outer-card-table" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: ${maxWidth}; background-color: #09090c; border: 1px solid #1c1c22; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.95);">

          <!-- 1. TOP SUB-HEADER STRIP -->
          <tr>
            <td style="padding: 12px 18px; background-color: #060608; border-bottom: 1px solid #16161b;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                <tr>
                  <td align="left" style="color: #a1a1aa;">${categoryText}</td>
                  <td align="right"><a href="${cleanBase}" style="color: #71717a; text-decoration: none; font-weight: 700;">View in Browser</a></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. BRAND HEADER ROW -->
          <tr>
            <td style="padding: 16px 18px; background-color: #09090c; border-bottom: 1px solid #16161b;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Left: Official Logo + NEXT GEAR text + Tagline -->
                  <td align="left" valign="middle">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="padding-right: 10px;">
                          <a href="${cleanBase}"><img src="${logoUrl}" alt="Next Gear Logo" style="height: 40px; width: auto; display: block; border: 0; filter: drop-shadow(0 0 10px rgba(225,6,0,0.5));" /></a>
                        </td>
                        <td valign="middle">
                          <div style="font-size: 17px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; line-height: 1;">
                            NEXT <span style="color: #dc2626;">GEAR</span>
                          </div>
                          <div style="font-size: 8px; font-weight: 800; color: #71717a; letter-spacing: 2px; text-transform: uppercase; margin-top: 3px;">
                            RENT. RIDE. REPEAT.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Right: Header Icon / Security Badge -->
                  <td class="header-icon-td" align="right" valign="middle" style="font-size: 11px; color: #a1a1aa; line-height: 1.4;">
                    ${headerIconText}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. HERO SECTION WITH UNIVERSAL GMAIL COMPATIBLE ICON BADGE -->
          <tr>
            <td style="padding: 22px 18px 16px 18px; background: linear-gradient(180deg, #0e0e12 0%, #09090c 100%);">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Left Hero Text -->
                  <td class="hero-left-td" align="left" valign="middle" style="padding-right: 10px;">
                    <h1 style="margin: 0 0 6px 0; font-size: 21px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; line-height: 1.25;">
                      ${title} ${titleBadge ? `<span style="font-size: 18px;">${titleBadge}</span>` : ""}
                    </h1>
                    <p style="margin: 0; font-size: 13px; font-weight: 700; color: #ffffff;">
                      Hi <span style="color: #dc2626;">${userName}</span>,
                    </p>
                  </td>

                  <!-- Right Hero Artwork Illustration (UNIVERSAL 100% GMAIL COMPATIBLE) -->
                  <td class="hero-art-td" align="right" valign="middle" style="width: 80px;">
                    ${heroIllustrationHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. MAIN CONTENT CONTAINER -->
          <tr>
            <td style="padding: 0 18px 20px 18px; background-color: #09090c;">
              ${contentHtml}
            </td>
          </tr>

          <!-- 5. FOOTER SECTION -->
          <tr>
            <td style="padding: 18px; background-color: #050507; border-top: 1px solid #16161b;">
              
              <!-- Social Links & App Download Badges Row -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px; border-bottom: 1px solid #16161b; padding-bottom: 16px;">
                <tr>
                  <!-- Left Column: Stay Connected With Us -->
                  <td class="footer-left-td" align="left" valign="top" style="width: 48%; padding-right: 10px; border-right: 1px solid #18181c;">
                    <div style="font-size: 10px; font-weight: 800; color: #d4d4d8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                      Stay Connected With Us
                    </div>
                    <table class="footer-social-align" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 6px;">
                          <a href="${facebookUrl}" style="text-decoration: none; display: inline-block;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #1877F2; text-align: center; line-height: 28px; color: #ffffff; font-weight: 900; font-size: 15px; font-family: sans-serif;">
                              f
                            </div>
                          </a>
                        </td>
                        <td style="padding-right: 6px;">
                          <a href="${instagramUrl}" style="text-decoration: none; display: inline-block;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%); text-align: center; line-height: 28px; color: #ffffff; font-size: 14px;">
                              📸
                            </div>
                          </a>
                        </td>
                        <td style="padding-right: 6px;">
                          <a href="${twitterUrl}" style="text-decoration: none; display: inline-block;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #1DA1F2; text-align: center; line-height: 28px; color: #ffffff; font-size: 13px; font-weight: 900;">
                              𝕏
                            </div>
                          </a>
                        </td>
                        <td>
                          <a href="${linkedinUrl}" style="text-decoration: none; display: inline-block;">
                            <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #0A66C2; text-align: center; line-height: 28px; color: #ffffff; font-weight: 900; font-size: 13px; font-family: sans-serif;">
                              in
                            </div>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Right Column: Download Our App Badges -->
                  <td class="footer-right-td" align="right" valign="top" style="width: 52%; padding-left: 10px;">
                    <div style="font-size: 10px; font-weight: 800; color: #d4d4d8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                      Download Our App
                    </div>
                    <table class="footer-app-align" border="0" cellpadding="0" cellspacing="0" align="right">
                      <tr>
                        <td style="padding-right: 6px;">
                          <a href="${googlePlayUrl}" style="display: inline-block; background-color: #000000; border: 1px solid #333333; border-radius: 8px; padding: 4px 8px; text-decoration: none;">
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-right: 5px;" valign="middle">
                                  <svg width="14" height="16" viewBox="0 0 18 20" fill="none">
                                    <path d="M1 1L11.5 10L1 19V1Z" fill="#00E676"/>
                                    <path d="M1 1L11.5 10L14.5 7L3.5 0.5L1 1Z" fill="#00E5FF"/>
                                    <path d="M11.5 10L1 19L3.5 19.5L14.5 13L11.5 10Z" fill="#FFEA00"/>
                                    <path d="M11.5 10L14.5 7L17 8.5C17.5 8.8 17.5 9.2 17 9.5L14.5 13L11.5 10Z" fill="#FF3D00"/>
                                  </svg>
                                </td>
                                <td valign="middle" style="text-align: left;">
                                  <div style="font-size: 6px; color: #a1a1aa; text-transform: uppercase; font-weight: 700; line-height: 1;">GET IT ON</div>
                                  <div style="font-size: 10px; font-weight: 800; color: #ffffff; line-height: 1.2;">Google Play</div>
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>
                        <td>
                          <a href="${appStoreUrl}" style="display: inline-block; background-color: #000000; border: 1px solid #333333; border-radius: 8px; padding: 4px 8px; text-decoration: none;">
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-right: 5px; font-size: 16px; color: #ffffff;" valign="middle">
                                  
                                </td>
                                <td valign="middle" style="text-align: left;">
                                  <div style="font-size: 6px; color: #a1a1aa; font-weight: 700; line-height: 1;">Download on the</div>
                                  <div style="font-size: 10px; font-weight: 800; color: #ffffff; line-height: 1.2;">App Store</div>
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Bottom Copyright Strip -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 9px; color: #71717a;">
                <tr>
                  <td align="left">
                    © 2026 Next Gear. All Rights Reserved.
                  </td>
                  <td align="center">
                    | &nbsp; <a href="mailto:${supportEmail}" style="color: #a1a1aa; text-decoration: none;">${supportEmail}</a> &nbsp; |
                  </td>
                  <td align="right">
                    <a href="${websiteUrl}" style="color: #a1a1aa; text-decoration: none;">${websiteUrl.replace(/^https?:\/\//, "")}</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * 💳 4. PAYMENT SUCCESSFUL EMAIL
 */
export function generatePaymentSuccessEmailHtml(input: {
  transactionId: string;
  bookingId: string;
  customerName: string;
  vehicleTitle: string;
  baseFareINR: number;
  taxesINR: number;
  discountINR: number;
  totalPaidINR: number;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("payment_success");
  const categoryText = customCfg?.categoryText || "PAYMENT RECEIPT";
  const title = customCfg?.headline || "Payment Successful!";
  const titleBadge = "✅";

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">🛡️</td>
        <td style="text-align: right;">
          <strong style="color: #34d399; font-size: 10px; display: block;">100% Secure</strong>
          <span style="font-size: 8px; color: #71717a;">Payment</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #064e3b 100%); border: 2px solid #34d399; box-shadow: 0 0 16px rgba(16,185,129,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      💳
    </div>
  `;

  const currentDateStr = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      Your payment has been processed successfully.<br/>
      Thank you for choosing Next Gear.
    </p>

    <!-- DASHED TRANSACTION BAR WITH RESPONSIVE STACKABLE CELLS -->
    <div style="border: 1px dashed #dc2626; background: rgba(220,38,38,0.03); border-radius: 14px; padding: 12px; margin-bottom: 16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 10px;">
        <tr>
          <td class="summary-cell" valign="top">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">TRANSACTION ID</div>
            <div style="color: #ffffff; font-weight: 800; font-family: monospace; font-size: 10px; margin-top: 2px;">${input.transactionId}</div>
          </td>
          <td class="summary-cell" valign="top">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">PAYMENT DATE</div>
            <div style="color: #ffffff; font-weight: 700; margin-top: 2px;">${currentDateStr}</div>
          </td>
          <td class="summary-cell" valign="top">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">METHOD</div>
            <div style="color: #34d399; font-weight: 800; margin-top: 2px;">UPI</div>
          </td>
          <td class="summary-cell summary-cell-right" valign="top" align="right">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">STATUS</div>
            <div style="display: inline-block; background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 2px 6px; border-radius: 6px; font-weight: 800; margin-top: 2px;">Success</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- PAYMENT SUMMARY CARD -->
    <div style="background-color: #121216; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 16px;">
      <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
        <tr>
          <td style="padding-right: 6px;">
            <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #881337; border: 1px solid #ef4444; text-align: center; line-height: 18px; font-size: 10px; color: #ffffff;">
              💳
            </div>
          </td>
          <td style="font-size: 10px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
            PAYMENT SUMMARY
          </td>
        </tr>
      </table>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 11px; color: #d4d4d8;">
        <tr>
          <td style="padding: 4px 0; color: #71717a;">Booking ID:</td>
          <td align="right" style="padding: 4px 0; font-weight: 800; color: #ffffff; font-family: monospace;">${input.bookingId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #71717a;">Vehicle:</td>
          <td align="right" style="padding: 4px 0; font-weight: 700; color: #ffffff;">${input.vehicleTitle}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #71717a;">Base Fare:</td>
          <td align="right" style="padding: 4px 0; font-weight: 600; color: #ffffff;">₹ ${input.baseFareINR.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #71717a;">Taxes & Fees:</td>
          <td align="right" style="padding: 4px 0; font-weight: 600; color: #ffffff;">₹ ${input.taxesINR.toLocaleString("en-IN")}</td>
        </tr>
        ${input.discountINR > 0 ? `
        <tr>
          <td style="padding: 4px 0; color: #34d399;">Discount:</td>
          <td align="right" style="padding: 4px 0; font-weight: 700; color: #34d399;">- ₹ ${input.discountINR.toLocaleString("en-IN")}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0 0 0; font-size: 12px; font-weight: 800; color: #ffffff; border-top: 1px dashed #27272a;">Total Paid:</td>
          <td align="right" style="padding: 6px 0 0 0; font-size: 14px; font-weight: 900; color: #dc2626; border-top: 1px dashed #27272a;">₹ ${input.totalPaidINR.toLocaleString("en-IN")}</td>
        </tr>
      </table>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.customerName || "Abhishek Singh",
    preheader: `Payment Successful! Transaction #${input.transactionId}`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

/**
 * 🔑 1. OTP VERIFICATION EMAIL
 */
export function generateOtpEmailHtml(input: {
  otp: string;
  userName?: string;
  purpose?: "login" | "registration" | "verification";
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("otp");
  const isReg = input.purpose === "registration";
  const title = customCfg?.headline || (isReg ? "Welcome to Next Gear!" : "Your OTP Code");
  const titleBadge = isReg ? "👋" : "🔴";
  const categoryText = customCfg?.categoryText || "OTP VERIFICATION";

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right: 6px;">
          <div style="width: 24px; height: 24px; border-radius: 6px; background: rgba(220,38,38,0.2); border: 1px solid #dc2626; text-align: center; line-height: 22px; font-size: 12px;">
            🔒
          </div>
        </td>
        <td style="text-align: right;">
          <strong style="color: #ffffff; font-size: 10px; display: block;">Secure Login</strong>
          <span style="font-size: 8px; color: #71717a;">Verification</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%); border: 2px solid #f87171; box-shadow: 0 0 16px rgba(239,68,68,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      🔒
    </div>
  `;

  const formattedOtp = input.otp.split("").join("&nbsp;&nbsp;");

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      Use the OTP below to verify your account.<br/>
      This code is valid for 10 minutes only.
    </p>

    <!-- DASHED RED OTP BOX -->
    <div style="border: 1px dashed #dc2626; background: rgba(220,38,38,0.03); border-radius: 14px; padding: 16px 12px; text-align: center; margin-bottom: 14px;">
      <div style="font-size: 8px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">
        YOUR 6-DIGIT OTP CODE
      </div>
      <div style="font-size: 28px; font-weight: 900; font-family: 'Courier New', monospace; color: #ffffff; text-shadow: 0 0 18px rgba(239,68,68,0.8); margin-bottom: 10px;">
        ${formattedOtp}
      </div>
      <div style="display: inline-block; background: rgba(0,0,0,0.6); border: 1px solid rgba(248,113,113,0.3); padding: 4px 10px; border-radius: 9999px; font-size: 9px; color: #f87171; font-weight: 700;">
        ⏱️ Valid for 10 minutes only
      </div>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.userName || "Abhishek Singh",
    preheader: `Your Next Gear OTP code is ${input.otp}. Valid for 10 minutes.`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    maxWidth: "440px",
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

/**
 * 🔐 2. PASSWORD RESET EMAIL
 */
export function generateForgotPasswordEmailHtml(input: {
  otp: string;
  userName?: string;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("password_reset");
  const categoryText = customCfg?.categoryText || "PASSWORD RESET";
  const title = customCfg?.headline || "Reset Your Password";
  const titleBadge = "🔒";

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">🔒</td>
        <td style="text-align: right;">
          <strong style="color: #ffffff; font-size: 10px; display: block;">Account</strong>
          <span style="font-size: 8px; color: #71717a;">Security</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%); border: 2px solid #f87171; box-shadow: 0 0 16px rgba(239,68,68,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      💻
    </div>
  `;

  const resetUrl = `${(input.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://next-gear.app").replace(/\/$/, "")}/login?reset=true`;

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      We received a request to reset your password.<br/>
      Click the button below to create a new password.
    </p>

    <!-- RED RESET BUTTON -->
    <div style="text-align: center; margin: 16px 0;">
      <a href="${resetUrl}" class="btn-red" style="padding: 10px 30px; font-size: 12px;">
        Reset Password
      </a>
    </div>

    <!-- CODE BACKUP BOX -->
    <div style="border: 1px dashed #27272a; background: rgba(255,255,255,0.02); border-radius: 12px; padding: 10px; text-align: center; margin-bottom: 14px;">
      <div style="font-size: 8px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">
        OR USE AUTHORIZATION CODE
      </div>
      <div style="font-size: 20px; font-weight: 900; font-family: monospace; color: #ffffff; letter-spacing: 4px;">
        ${input.otp}
      </div>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.userName || "Abhishek Singh",
    preheader: `Reset your Next Gear password. Code: ${input.otp}`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    maxWidth: "440px",
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

/**
 * 🚘 3. BOOKING CONFIRMED EMAIL
 */
export function generateBookingConfirmationEmailHtml(input: {
  bookingId: string;
  customerName: string;
  vehicleTitle: string;
  vehicleType?: string;
  vehicleImage?: string;
  cityName: string;
  pickupAddress?: string;
  mapsUrl?: string;
  startDate: string;
  endDate: string;
  totalAmountINR: number;
  subtotalAmountINR?: number;
  discountINR?: number;
  passUrl?: string;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("booking");
  const categoryText = customCfg?.categoryText || "BOOKING CONFIRMATION";
  const title = customCfg?.headline || "Booking Confirmed!";
  const titleBadge = "🔴";

  const isCar = (input.vehicleType || "").toLowerCase().includes("car") || input.vehicleTitle.toLowerCase().includes("car") || input.vehicleTitle.toLowerCase().includes("thar") || input.vehicleTitle.toLowerCase().includes("creta") || input.vehicleTitle.toLowerCase().includes("swift");
  const fallbackImg = isCar
    ? "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80"
    : "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80";
  const vehicleImgSrc = (input.vehicleImage && input.vehicleImage !== "/Logo1.png" && input.vehicleImage.trim() !== "")
    ? input.vehicleImage
    : fallbackImg;

  const mapsLink = input.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(input.pickupAddress?.trim() || `Next Gear Rentals Station Hub, ${input.cityName}`)}`;

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">🎧</td>
        <td style="text-align: right;">
          <strong style="color: #ffffff; font-size: 10px; display: block;">Need Help?</strong>
          <a href="mailto:support@next-gear.app" style="color: #a1a1aa; text-decoration: none; font-size: 8px;">support@next-gear.app</a>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%); border: 2px solid #f87171; box-shadow: 0 0 16px rgba(239,68,68,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      🚘
    </div>
  `;

  const passLink = input.passUrl ?? `${(input.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://next-gear.app").replace(/\/$/, "")}/api/bookings/${input.bookingId}/pass`;
  const currentDateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      Your booking has been confirmed successfully.<br/>
      Get ready for a smooth and safe ride.
    </p>

    <!-- DASHED SUMMARY BAR WITH RESPONSIVE STACKABLE CELLS -->
    <div style="border: 1px dashed #dc2626; background: rgba(220,38,38,0.03); border-radius: 14px; padding: 12px; margin-bottom: 16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 10px;">
        <tr>
          <td class="summary-cell" valign="top">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">BOOKING ID</div>
            <div style="color: #ffffff; font-weight: 800; font-family: monospace; font-size: 10px; margin-top: 2px;">${input.bookingId}</div>
          </td>
          <td class="summary-cell" valign="top">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">DATE</div>
            <div style="color: #ffffff; font-weight: 700; margin-top: 2px;">${currentDateStr}</div>
          </td>
          <td class="summary-cell" valign="top">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">STATUS</div>
            <div style="display: inline-block; background: rgba(220,38,38,0.2); color: #f87171; border: 1px solid rgba(220,38,38,0.4); padding: 2px 6px; border-radius: 6px; font-weight: 800; margin-top: 2px;">Confirmed</div>
          </td>
          <td class="summary-cell summary-cell-right" valign="top" align="right">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">PAYMENT</div>
            <div style="display: inline-block; background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 2px 6px; border-radius: 6px; font-weight: 800; margin-top: 2px;">Paid</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- BOOKING DETAILS & VEHICLE CARD -->
    <div style="background-color: #121216; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 16px;">
      <!-- Vehicle Image + Title Row -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px; border-bottom: 1px solid #1f1f24; padding-bottom: 12px;">
        <tr>
          <td width="90" valign="middle" style="padding-right: 12px;">
            <img src="${vehicleImgSrc}" alt="${input.vehicleTitle}" style="width: 85px; height: 55px; object-fit: cover; border-radius: 8px; border: 1.5px solid #27272a; display: block;" />
          </td>
          <td valign="middle">
            <span style="color: #71717a; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block;">🚘 Booked Vehicle (${(input.vehicleType || "Rental Vehicle").toUpperCase()})</span>
            <strong style="color: #ffffff; font-size: 13px; display: block; margin-top: 2px;">${input.vehicleTitle}</strong>
          </td>
        </tr>
      </table>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 11px; color: #d4d4d8;">
        <tr>
          <td class="grid-col-half" valign="top" style="width: 50%; padding-right: 6px;">
            <div style="margin-bottom: 10px;">
              <span style="color: #71717a; font-size: 8px; font-weight: 700; text-transform: uppercase; display: block;">🗓️ Pickup Date & Time</span>
              <strong style="color: #ffffff;">${input.startDate}</strong>
            </div>
            <div>
              <span style="color: #71717a; font-size: 8px; font-weight: 700; text-transform: uppercase; display: block;">🗓️ Drop-off Date</span>
              <strong style="color: #ffffff;">${input.endDate}</strong>
            </div>
          </td>

          <td class="grid-col-half" valign="top" style="width: 50%; padding-left: 6px;">
            <div style="margin-bottom: 10px;">
              <span style="color: #71717a; font-size: 8px; font-weight: 700; text-transform: uppercase; display: block;">📍 Pickup Station</span>
              <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Hub Station, ${input.cityName}</strong>
              <a href="${mapsLink}" target="_blank" style="display: inline-block; font-size: 9px; font-weight: 700; color: #60a5fa; text-decoration: none; border: 1px solid rgba(96,165,250,0.3); background: rgba(96,165,250,0.1); padding: 3px 8px; border-radius: 6px;">
                🗺️ Get Directions (Google Maps) ↗
              </a>
            </div>
            <div>
              <span style="color: #71717a; font-size: 8px; font-weight: 700; text-transform: uppercase; display: block;">💰 Total Amount</span>
              <strong style="color: #dc2626; font-size: 13px;">₹ ${input.totalAmountINR.toLocaleString("en-IN")}</strong>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- SCANNABLE QR PASS BOX EMBEDDED IN EMAIL -->
    <div style="background-color: #121216; border: 2px dashed #ef4444; border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 16px;">
      <div style="font-size: 9px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
        🎟️ DIGITAL VERIFICATION QR PASS
      </div>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${input.bookingId}" alt="Booking QR Pass" style="width: 130px; height: 130px; border-radius: 8px; border: 2px solid #ffffff; display: block; margin: 0 auto 8px auto;" />
      <div style="font-size: 10px; color: #d4d4d8; font-weight: 700;">
        Show this QR Code at the pickup hub for instant vehicle key handover.
      </div>
    </div>

    <!-- DOWNLOAD PASS CTA BUTTON -->
    <div style="text-align: center;">
      <a href="${passLink}" class="btn-red" style="padding: 10px 28px; font-size: 12px;">
        🎟️ Download Booking Pass & E-Receipt
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.customerName || "Abhishek Singh",
    preheader: `Booking Confirmed #${input.bookingId} for ${input.vehicleTitle}`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

/**
 * 🎧 5. SUPPORT TICKET RECEIVED EMAIL
 */
export function generateContactReceiptEmailHtml(input: {
  fullName: string;
  email: string;
  phone: string;
  message: string;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("contact_receipt");
  const categoryText = customCfg?.categoryText || "SUPPORT TICKET RECEIVED";
  const title = customCfg?.headline || "We've Received Your Request!";
  const titleBadge = "💬";

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">🎧</td>
        <td style="text-align: right;">
          <strong style="color: #ffffff; font-size: 10px; display: block;">We're Here</strong>
          <span style="font-size: 8px; color: #71717a;">To Help</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%); border: 2px solid #f87171; box-shadow: 0 0 16px rgba(239,68,68,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      🎧
    </div>
  `;

  const ticketId = `NGT-2026-${Math.floor(100000 + Math.random() * 900000)}`;

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      Your support ticket has been created successfully.<br/>
      Our team will review your request and get back to you as soon as possible.
    </p>

    <!-- TICKET SUMMARY BAR WITH RESPONSIVE STACKABLE CELLS -->
    <div style="border: 1px dashed #dc2626; background: rgba(220,38,38,0.03); border-radius: 14px; padding: 12px; margin-bottom: 16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 10px;">
        <tr>
          <td class="summary-cell" valign="top">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">TICKET ID</div>
            <div style="color: #ffffff; font-weight: 800; font-family: monospace; font-size: 10px; margin-top: 2px;">${ticketId}</div>
          </td>
          <td class="summary-cell" valign="top">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">SUBJECT</div>
            <div style="color: #ffffff; font-weight: 700; font-size: 10px; margin-top: 2px;">Booking Issue</div>
          </td>
          <td class="summary-cell" valign="top">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">PRIORITY</div>
            <div style="display: inline-block; background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.4); padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px; margin-top: 2px;">Medium</div>
          </td>
          <td class="summary-cell summary-cell-right" valign="top" align="right">
            <div style="color: #71717a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; font-size: 8px;">STATUS</div>
            <div style="display: inline-block; background: rgba(220,38,38,0.2); color: #f87171; border: 1px solid rgba(220,38,38,0.4); padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 9px; margin-top: 2px;">Open</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- WHAT'S NEXT BOX -->
    <div style="background-color: #121216; border: 1px solid #27272a; border-radius: 12px; padding: 12px; font-size: 11px; color: #a1a1aa; line-height: 1.5;">
      <span style="color: #ffffff; font-weight: 800;">📬 What's Next?</span> You will receive updates on this ticket via email. You can also check the status in your account.
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.fullName || "Abhishek Singh",
    preheader: `Support Ticket #${ticketId} created successfully.`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

/**
 * 🚨 6. ADMIN DISPATCH EMAIL
 */
export function generateContactAdminAlertHtml(input: {
  fullName: string;
  email: string;
  phone: string;
  message: string;
  baseUrl?: string;
}): string {
  const categoryText = "ADMIN DISPATCH";
  const title = "New Customer Inquiry";
  const titleBadge = "⚡";

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">⚙️</td>
        <td style="text-align: right;">
          <strong style="color: #f87171; font-size: 10px; display: block;">Admin</strong>
          <span style="font-size: 8px; color: #71717a;">Control</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%); border: 2px solid #f87171; box-shadow: 0 0 16px rgba(239,68,68,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      ⚡
    </div>
  `;

  const adminUrl = `${(input.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://next-gear.app").replace(/\/$/, "")}/dashboard/admin?section=contact-requests`;

  const contentHtml = `
    <div style="border: 1px dashed #dc2626; background: rgba(220,38,38,0.04); border-radius: 14px; padding: 12px; margin-bottom: 16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 11px;">
        <tr>
          <td style="color: #71717a; font-weight: 700; width: 75px;">Customer:</td>
          <td style="color: #ffffff; font-weight: 800;">${input.fullName}</td>
        </tr>
        <tr>
          <td style="color: #71717a; font-weight: 700;">Email:</td>
          <td><a href="mailto:${input.email}" style="color: #f87171; text-decoration: none; font-weight: 700;">${input.email}</a></td>
        </tr>
        <tr>
          <td style="color: #71717a; font-weight: 700;">Phone:</td>
          <td><a href="tel:${input.phone}" style="color: #ffffff; text-decoration: none; font-weight: 700;">${input.phone}</a></td>
        </tr>
      </table>
    </div>

    <!-- MESSAGE BODY -->
    <div style="background-color: #121216; border-radius: 12px; padding: 12px; border: 1px solid #27272a; margin-bottom: 18px;">
      <div style="font-size: 8px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
        MESSAGE BODY
      </div>
      <p style="margin: 0; font-size: 11px; color: #ffffff; line-height: 1.5; white-space: pre-wrap;">${input.message}</p>
    </div>

    <!-- ADMIN ACTION BUTTON -->
    <div style="text-align: center;">
      <a href="${adminUrl}" class="btn-red" style="padding: 10px 26px; font-size: 11px;">
        Open Admin Control Panel ⚙️
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.fullName || "Abhishek Singh",
    preheader: `New website inquiry from ${input.fullName}`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
  });
}

/**
 * 📰 7. NEW BLOG POST PUBLISHED EMAIL
 */
export function generateBlogNotificationEmailHtml(input: {
  blogTitle: string;
  blogSlug: string;
  excerpt: string;
  readTimeMinutes?: number;
  publishedDate?: string;
  authorName?: string;
  userName?: string;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("blog");
  const categoryText = customCfg?.categoryText || "NEW BLOG PUBLISHED";
  const title = input.blogTitle;
  const titleBadge = "📰";

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">📚</td>
        <td style="text-align: right;">
          <strong style="color: #ffffff; font-size: 10px; display: block;">Next Gear</strong>
          <span style="font-size: 8px; color: #71717a;">Journal & Guides</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%); border: 2px solid #f87171; box-shadow: 0 0 16px rgba(239,68,68,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      📰
    </div>
  `;

  const blogUrl = `${(input.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://next-gear.app").replace(/\/$/, "")}/blogs/${input.blogSlug}`;

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      We just published a brand new guide on Next Gear Journal!<br/>
      Check out the latest article below to level up your travel & rental experience.
    </p>

    <!-- BLOG DETAILS CARD -->
    <div style="background-color: #121216; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 9px;">
        <span style="color: #ef4444; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">⏱️ ${input.readTimeMinutes ?? 5} MIN READ</span>
        <span style="color: #71717a; font-weight: 600;">✍️ ${input.authorName ?? "Next Gear Editorial"}</span>
      </div>

      <div style="font-size: 13px; font-weight: 800; color: #ffffff; line-height: 1.4; margin-bottom: 8px;">
        ${input.blogTitle}
      </div>

      <div style="background-color: #18181c; border-radius: 10px; padding: 10px; font-size: 11px; color: #d4d4d8; line-height: 1.5; border: 1px solid rgba(255,255,255,0.05);">
        "${input.excerpt}"
      </div>
    </div>

    <!-- READ BLOG CTA BUTTON -->
    <div style="text-align: center;">
      <a href="${blogUrl}" class="btn-red" style="padding: 10px 28px; font-size: 12px;">
        Read Full Article 📖
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.userName || "Abhishek Singh",
    preheader: `New Blog: ${input.blogTitle}`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

/**
 * 👋 8. WELCOME & FIRST LOGIN EMAIL
 */
export function generateWelcomeEmailHtml(input: {
  userName?: string;
  couponCode?: string;
  discountPercentage?: number;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("welcome");
  const categoryText = customCfg?.categoryText || "WELCOME TO NEXT GEAR";
  const title = customCfg?.headline || "Welcome to Next Gear Family!";
  const titleBadge = "🚀";
  const code = input.couponCode ?? "WELCOME10";
  const discount = input.discountPercentage ?? 10;

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">🏎️</td>
        <td style="text-align: right;">
          <strong style="color: #ffffff; font-size: 10px; display: block;">Pan-India</strong>
          <span style="font-size: 8px; color: #71717a;">24+ Cities</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%); border: 2px solid #f87171; box-shadow: 0 0 16px rgba(239,68,68,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      👋
    </div>
  `;

  const exploreUrl = `${(input.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://next-gear.app").replace(/\/$/, "")}/vehicles`;

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      Thank you for joining Next Gear Rentals! We're thrilled to have you on board.<br/>
      Whether you need a sleek car for a weekend trip or a high-performance bike for mountain highways, we have you covered across 24+ cities in India.
    </p>

    <!-- WELCOME PERKS CARD -->
    <div style="background-color: #121216; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 16px;">
      <div style="font-size: 9px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">
        🌟 WHY RIDE WITH NEXT GEAR?
      </div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 11px; color: #d4d4d8;">
        <tr>
          <td style="padding: 4px 0; color: #ffffff;">⚡ <strong>Instant Key Handover</strong> at 50+ Hubs</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #ffffff;">🔒 <strong>Zero Security Deposit Options</strong> Available</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #ffffff;">🌐 <strong>NRI Friendly</strong> (International DL & Passport Accepted)</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #ffffff;">🛠️ <strong>24/7 Roadside Assistance</strong> & Helmet Provided</td>
        </tr>
      </table>
    </div>

    <!-- FIRST RIDE COUPON BADGE -->
    <div style="border: 2px dashed #ef4444; background: rgba(220,38,38,0.05); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 18px;">
      <div style="font-size: 8px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">
        🎁 YOUR EXCLUSIVE FIRST RIDE COUPON
      </div>
      <div style="font-size: 14px; font-weight: 800; color: #ffffff; margin-bottom: 8px;">
        Get <span style="color: #ef4444; font-size: 18px;">${discount}% OFF</span> On Your First Booking
      </div>
      <div style="font-size: 22px; font-weight: 900; font-family: monospace; color: #ffffff; letter-spacing: 4px; background: rgba(0,0,0,0.6); padding: 8px 16px; border-radius: 8px; display: inline-block; border: 1px solid #ef4444; margin-bottom: 6px;">
        ${code}
      </div>
      <div style="font-size: 9px; color: #a1a1aa;">Use code at checkout to claim your discount</div>
    </div>

    <!-- BOOK FIRST RIDE CTA -->
    <div style="text-align: center;">
      <a href="${exploreUrl}" class="btn-red" style="padding: 12px 32px; font-size: 13px;">
        Book Your First Ride 🏎️
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.userName || "Abhishek Singh",
    preheader: `Welcome to Next Gear! Here is your ${discount}% OFF coupon code: ${code}`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

/**
 * 🎆 9. FESTIVE & SEASONAL SPECIAL EMAIL
 */
export function generateFestiveEmailHtml(input: {
  userName?: string;
  festivalName?: string;
  couponCode?: string;
  discountPercentage?: number;
  validUntil?: string;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("festive");
  const categoryText = customCfg?.categoryText || "FESTIVE SPECIAL OFFER";
  const festName = input.festivalName ?? "Festive Season";
  const title = customCfg?.headline || `${festName} Special Deal!`;
  const titleBadge = "🎆";
  const code = input.couponCode ?? "FESTIVE25";
  const discount = input.discountPercentage ?? 25;
  const validUntil = input.validUntil ?? "Limited Time Only";

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">🎉</td>
        <td style="text-align: right;">
          <strong style="color: #fbbf24; font-size: 10px; display: block;">Holiday Sale</strong>
          <span style="font-size: 8px; color: #71717a;">Limited Time</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%); border: 2px solid #fbbf24; box-shadow: 0 0 16px rgba(245,158,11,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      🎁
    </div>
  `;

  const exploreUrl = `${(input.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://next-gear.app").replace(/\/$/, "")}/vehicles`;

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      Celebrate this <strong>${festName}</strong> with an unforgettable getaway!<br/>
      Book any self-drive car, luxury bike, or scooter across India and enjoy massive festive savings.
    </p>

    <!-- FESTIVE BANNER BOX -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); border: 1px solid #4338ca; border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 16px;">
      <div style="font-size: 9px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">
        ✨ ${festName.toUpperCase()} EXCLUSIVE DISCOUNT
      </div>
      <div style="font-size: 26px; font-weight: 900; color: #ffffff; text-shadow: 0 0 20px rgba(129,140,248,0.8); margin-bottom: 6px;">
        FLAT <span style="color: #fbbf24;">${discount}% OFF</span>
      </div>
      <div style="font-size: 10px; color: #cbd5e1; font-weight: 600;">Applicable on all vehicles & 24+ Indian cities</div>
    </div>

    <!-- COUPON CODE CONTAINER -->
    <div style="border: 2px dashed #fbbf24; background: rgba(245,158,11,0.05); border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 18px;">
      <div style="font-size: 8px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">
        PROMO CODE AT CHECKOUT
      </div>
      <div style="font-size: 22px; font-weight: 900; font-family: monospace; color: #ffffff; letter-spacing: 4px; background: rgba(0,0,0,0.6); padding: 8px 16px; border-radius: 8px; display: inline-block; border: 1px solid #fbbf24; margin-bottom: 6px;">
        ${code}
      </div>
      <div style="font-size: 9px; color: #fbbf24; font-weight: 700;">⏱️ ${validUntil}</div>
    </div>

    <!-- CTA BUTTON -->
    <div style="text-align: center;">
      <a href="${exploreUrl}" class="btn-red" style="padding: 12px 32px; font-size: 13px; background-color: #d97706 !important; box-shadow: 0 4px 18px rgba(217,119,6,0.4) !important;">
        Claim Festive Discount 🎁
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.userName || "Abhishek Singh",
    preheader: `${festName} Offer! Get ${discount}% OFF on Next Gear Rentals with code ${code}`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

/**
 * 🎟️ 10. EXCLUSIVE DISCOUNT COUPON EMAIL
 */
export function generateDiscountCouponEmailHtml(input: {
  userName?: string;
  couponCode?: string;
  discountTitle?: string;
  discountDetails?: string;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("discount_coupon");
  const categoryText = customCfg?.categoryText || "SPECIAL PROMO CODE";
  const title = customCfg?.headline || "Special Discount Coupon Just For You!";
  const titleBadge = "🎟️";
  const code = input.couponCode ?? "RIDEGEAR20";
  const discountTitle = input.discountTitle ?? "Flat ₹500 Instant Savings";
  const details = input.discountDetails ?? "Valid on SUV, Sedan, and Sports Bike bookings above ₹1,999.";

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">🏷️</td>
        <td style="text-align: right;">
          <strong style="color: #34d399; font-size: 10px; display: block;">Special Reward</strong>
          <span style="font-size: 8px; color: #71717a;">Verified Code</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #064e3b 100%); border: 2px solid #34d399; box-shadow: 0 0 16px rgba(16,185,129,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      🎟️
    </div>
  `;

  const exploreUrl = `${(input.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://next-gear.app").replace(/\/$/, "")}/vehicles`;

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      As a valued Next Gear rider, here is an exclusive coupon code for your next journey.<br/>
      Use it at checkout for instant price savings on any self-drive car or bike!
    </p>

    <!-- PROMO REWARD CARD -->
    <div style="background-color: #121216; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 16px; text-align: center;">
      <div style="font-size: 16px; font-weight: 800; color: #34d399; margin-bottom: 4px;">
        ${discountTitle}
      </div>
      <div style="font-size: 11px; color: #d4d4d8; font-weight: 600;">${details}</div>
    </div>

    <!-- COUPON CODE BOX -->
    <div style="border: 2px dashed #34d399; background: rgba(16,185,129,0.05); border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 18px;">
      <div style="font-size: 8px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">
        YOUR COUPON CODE
      </div>
      <div style="font-size: 22px; font-weight: 900; font-family: monospace; color: #ffffff; letter-spacing: 4px; background: rgba(0,0,0,0.6); padding: 8px 16px; border-radius: 8px; display: inline-block; border: 1px solid #34d399; margin-bottom: 6px;">
        ${code}
      </div>
      <div style="font-size: 9px; color: #a1a1aa;">Copy and paste code on checkout page</div>
    </div>

    <!-- CTA BUTTON -->
    <div style="text-align: center;">
      <a href="${exploreUrl}" class="btn-red" style="padding: 12px 32px; font-size: 13px;">
        Apply Coupon & Rent Now 🚗
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.userName || "Abhishek Singh",
    preheader: `Exclusive Coupon: Use ${code} for ${discountTitle} on Next Gear Rentals`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

/**
 * ⏰ 11. PRE-TRIP PICKUP REMINDER EMAIL
 */
export function generateTripReminderEmailHtml(input: {
  bookingId: string;
  customerName: string;
  vehicleTitle: string;
  cityName: string;
  pickupAddress?: string;
  startDate: string;
  vendorPhone?: string;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("trip_reminder");
  const categoryText = customCfg?.categoryText || "TRIP REMINDER";
  const title = customCfg?.headline || "Your Ride Starts Tomorrow!";
  const titleBadge = "⏰";
  const pickupAddress = input.pickupAddress ?? `Next Gear Hub, ${input.cityName}`;
  const vendorPhone = input.vendorPhone ?? "+91-9523765172";

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">📍</td>
        <td style="text-align: right;">
          <strong style="color: #ffffff; font-size: 10px; display: block;">Pickup Ready</strong>
          <span style="font-size: 8px; color: #71717a;">Verified Fleet</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%); border: 2px solid #f87171; box-shadow: 0 0 16px rgba(239,68,68,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      ⏰
    </div>
  `;

  const passUrl = `${(input.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://next-gear.app").replace(/\/$/, "")}/api/bookings/${input.bookingId}/pass`;

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      This is a quick reminder that your vehicle pickup is scheduled for tomorrow.<br/>
      Please bring your original Driving License and show your Digital QR Pass for instant key handover.
    </p>

    <!-- TRIP REMINDER CARD -->
    <div style="background-color: #121216; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 16px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 11px; color: #d4d4d8;">
        <tr>
          <td style="padding: 4px 0; color: #71717a; width: 110px;">Booking ID:</td>
          <td style="padding: 4px 0; font-weight: 800; color: #ffffff; font-family: monospace;">${input.bookingId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #71717a;">Vehicle:</td>
          <td style="padding: 4px 0; font-weight: 700; color: #ffffff;">${input.vehicleTitle}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #71717a;">Pickup Date & Time:</td>
          <td style="padding: 4px 0; font-weight: 700; color: #dc2626;">${input.startDate}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #71717a;">Pickup Hub:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #ffffff;">${pickupAddress}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #71717a;">Hub Manager Phone:</td>
          <td style="padding: 4px 0; font-weight: 700; color: #34d399;"><a href="tel:${vendorPhone}" style="color: #34d399; text-decoration: none;">${vendorPhone}</a></td>
        </tr>
      </table>
    </div>

    <!-- DIGITAL PASS CHECK BOX -->
    <div style="border: 1px dashed #ef4444; background: rgba(220,38,38,0.04); border-radius: 14px; padding: 12px; text-align: center; margin-bottom: 16px;">
      <div style="font-size: 10px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">
        🎟️ Digital QR Pass Ready
      </div>
      <div style="font-size: 10px; color: #a1a1aa;">Show the QR pass on your phone to the hub executive upon arrival.</div>
    </div>

    <!-- CTA BUTTON -->
    <div style="text-align: center;">
      <a href="${passUrl}" class="btn-red" style="padding: 10px 28px; font-size: 12px;">
        View Booking Pass 🎟️
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.customerName || "Abhishek Singh",
    preheader: `Reminder: Booking #${input.bookingId} starts tomorrow at ${input.startDate}`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

/**
 * ⭐ 12. POST-RIDE FEEDBACK & REVIEW EMAIL
 */
export function generateTripFeedbackEmailHtml(input: {
  bookingId: string;
  customerName: string;
  vehicleTitle: string;
  referralCode?: string;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("trip_feedback");
  const categoryText = customCfg?.categoryText || "TRIP FEEDBACK";
  const title = customCfg?.headline || "How Was Your Trip?";
  const titleBadge = "⭐";
  const referralCode = input.referralCode ?? "FRIEND15";

  const headerIconText = `
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size: 16px; padding-right: 6px;">⭐</td>
        <td style="text-align: right;">
          <strong style="color: #fbbf24; font-size: 10px; display: block;">Rate Experience</strong>
          <span style="font-size: 8px; color: #71717a;">Next Gear Rewards</span>
        </td>
      </tr>
    </table>
  `;

  const heroIllustrationHtml = `
    <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b 0%, #b45309 100%); border: 2px solid #fbbf24; box-shadow: 0 0 16px rgba(245,158,11,0.5); text-align: center; line-height: 60px; font-size: 30px; color: #ffffff; margin: 0 auto;">
      ⭐
    </div>
  `;

  const reviewUrl = `${(input.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://next-gear.app").replace(/\/$/, "")}/dashboard/customer?tab=history`;

  const contentHtml = `
    <p style="margin: 0 0 14px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
      Thank you for riding with Next Gear! We hope you enjoyed your ride in the <strong>${input.vehicleTitle}</strong>.<br/>
      Please take a quick moment to rate your experience and help us serve you better.
    </p>

    <!-- STAR RATING BUTTONS -->
    <div style="background-color: #121216; border: 1px solid #27272a; border-radius: 14px; padding: 16px; text-align: center; margin-bottom: 16px;">
      <div style="font-size: 10px; font-weight: 800; color: #d4d4d8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
        CLICK TO RATE YOUR RIDE
      </div>
      <div style="font-size: 26px; line-height: 1; margin-bottom: 8px;">
        <a href="${reviewUrl}" style="text-decoration: none;">⭐</a>
        <a href="${reviewUrl}" style="text-decoration: none;">⭐</a>
        <a href="${reviewUrl}" style="text-decoration: none;">⭐</a>
        <a href="${reviewUrl}" style="text-decoration: none;">⭐</a>
        <a href="${reviewUrl}" style="text-decoration: none;">⭐</a>
      </div>
      <div style="font-size: 9px; color: #71717a;">5 Stars = Outstanding Experience</div>
    </div>

    <!-- REFERRAL BONUS BOX -->
    <div style="border: 2px dashed #fbbf24; background: rgba(245,158,11,0.05); border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 18px;">
      <div style="font-size: 8px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">
        🎁 BONUS REWARD FOR YOUR NEXT RIDE
      </div>
      <div style="font-size: 11px; color: #ffffff; margin-bottom: 6px;">Share code <strong>${referralCode}</strong> with friends for 15% OFF</div>
      <div style="font-size: 18px; font-weight: 900; font-family: monospace; color: #fbbf24; letter-spacing: 3px;">${referralCode}</div>
    </div>

    <!-- CTA BUTTON -->
    <div style="text-align: center;">
      <a href="${reviewUrl}" class="btn-red" style="padding: 10px 28px; font-size: 12px; background-color: #d97706 !important;">
        Rate Your Experience ⭐
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText,
    headerIconText,
    title,
    titleBadge,
    userName: input.customerName || "Abhishek Singh",
    preheader: `How was your ride in the ${input.vehicleTitle}? Rate your trip now ⭐`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
    facebookUrl: customCfg?.facebookUrl,
    instagramUrl: customCfg?.instagramUrl,
    twitterUrl: customCfg?.twitterUrl,
    linkedinUrl: customCfg?.linkedinUrl,
    googlePlayUrl: customCfg?.googlePlayUrl,
    appStoreUrl: customCfg?.appStoreUrl,
    supportEmail: customCfg?.supportEmail,
    websiteUrl: customCfg?.websiteUrl,
  });
}

export function generateKycStatusEmailHtml(input: {
  customerName?: string;
  status: "APPROVED" | "REJECTED" | "PENDING";
  notes?: string;
  baseUrl?: string;
}): string {
  const customCfg = getCustomTemplateById("welcome");
  const isApproved = input.status === "APPROVED";
  const title = isApproved ? "KYC Verification Approved 🎉" : "KYC Document Action Required ⚠️";
  const titleBadge = isApproved ? "VERIFIED RIDER" : "ACTION REQUIRED";
  const headerIconText = isApproved ? "✅ KYC Approved" : "⚠️ Document Pending";

  const heroIllustrationHtml = `
    <div style="text-align: center; padding: 10px 0;">
      <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background-color: ${isApproved ? "#064e3b" : "#7f1d1d"}; border: 2px solid ${isApproved ? "#10b981" : "#ef4444"}; text-align: center; line-height: 60px; font-size: 32px; box-shadow: 0 0 20px ${isApproved ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"};">
        ${isApproved ? "🛡️" : "📄"}
      </div>
    </div>
  `;

  const contentHtml = `
    <div style="font-size: 13px; color: #d4d4d8; line-height: 1.6; margin-bottom: 16px;">
      ${isApproved 
        ? "Great news! Your government identity document & driving license have been successfully verified. You are now 100% verified to book self-drive cars & bikes across all Next Gear hubs!" 
        : "We reviewed your submitted KYC documents. To ensure your safety & compliance, please re-upload a clear copy of your Driving License or Aadhaar."}
    </div>

    ${input.notes ? `
    <div style="background: #18181f; border-left: 3px solid ${isApproved ? "#10b981" : "#f59e0b"}; padding: 10px 14px; border-radius: 6px; font-size: 11px; color: #e4e4e7; margin-bottom: 16px;">
      <strong>Verification Note:</strong> ${input.notes}
    </div>
    ` : ""}

    <div style="text-align: center; margin-top: 20px;">
      <a href="${(input.baseUrl || "https://www.next-gear.app").replace(/\/$/, "")}/dashboard/customer" class="btn-red" style="padding: 10px 24px; font-size: 12px; ${isApproved ? "background-color: #059669 !important;" : ""}">
        ${isApproved ? "Browse Vehicles & Book Ride 🚗" : "Update KYC Documents 📄"}
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText: "ACCOUNT VERIFICATION",
    headerIconText,
    title,
    titleBadge,
    userName: input.customerName || "Valued Rider",
    preheader: isApproved ? "Your Next Gear KYC documents are approved! Ready to ride 🚀" : "Please re-upload your driving license / identity document",
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
  });
}

export function generateDeliveryAssignmentEmailHtml(input: {
  bookingId: string;
  customerName?: string;
  vehicleTitle?: string;
  driverName?: string;
  driverPhone?: string;
  deliveryOtp?: string;
  trackingUrl?: string;
  baseUrl?: string;
}): string {
  const title = "Your Vehicle Is Out For Delivery! 🚚";
  const titleBadge = "LIVE TRACKING";
  const headerIconText = "🚚 Doorstep Delivery";

  const heroIllustrationHtml = `
    <div style="text-align: center; padding: 10px 0;">
      <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background-color: #1e1b4b; border: 2px solid #6366f1; text-align: center; line-height: 60px; font-size: 32px; box-shadow: 0 0 20px rgba(99,102,241,0.4);">
        🚚
      </div>
    </div>
  `;

  const contentHtml = `
    <div style="font-size: 13px; color: #d4d4d8; line-height: 1.6; margin-bottom: 16px;">
      Your vehicle <strong>${input.vehicleTitle || "Rental Vehicle"}</strong> is assigned to an executive and is currently heading to your doorstep!
    </div>

    <!-- DRIVER DETAILS CARD -->
    <div style="background-color: #121216; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 16px;">
      <div style="font-size: 10px; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        👨‍✈️ DELIVERY EXECUTIVE DETAILS
      </div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; color: #ffffff;">
        <tr>
          <td style="padding: 4px 0; color: #a1a1aa;">Driver Name:</td>
          <td align="right" style="font-weight: 800; color: #ffffff;">${input.driverName || "Rahul Sharma"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #a1a1aa;">Phone Number:</td>
          <td align="right" style="font-weight: 800; color: #6366f1;">${input.driverPhone || "+91-9876543210"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #a1a1aa;">Handover Delivery OTP:</td>
          <td align="right" style="font-weight: 900; font-family: monospace; font-size: 16px; color: #ef4444; letter-spacing: 2px;">${input.deliveryOtp || "4829"}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 18px;">
      <a href="${input.trackingUrl || `${(input.baseUrl || "https://www.next-gear.app").replace(/\/$/, "")}/dashboard/customer/tracking`}" class="btn-red" style="padding: 10px 24px; font-size: 12px; background-color: #4f46e5 !important;">
        Track Live Location 🗺️
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText: "DOORSTEP DELIVERY",
    headerIconText,
    title,
    titleBadge,
    userName: input.customerName || "Valued Rider",
    preheader: `Driver ${input.driverName || "Executive"} is delivering your ${input.vehicleTitle || "vehicle"}! Track live location 🚚`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
  });
}

export function generateSupportTicketEmailHtml(input: {
  ticketId: string;
  subject: string;
  category?: string;
  message: string;
  customerName?: string;
  baseUrl?: string;
}): string {
  const title = `Support Update: Ticket #${input.ticketId}`;
  const titleBadge = "SUPPORT RESPONSE";
  const headerIconText = "💬 Customer Desk";

  const heroIllustrationHtml = `
    <div style="text-align: center; padding: 10px 0;">
      <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; background-color: #1e293b; border: 2px solid #38bdf8; text-align: center; line-height: 60px; font-size: 32px; box-shadow: 0 0 20px rgba(56,189,248,0.4);">
        💬
      </div>
    </div>
  `;

  const contentHtml = `
    <div style="font-size: 13px; color: #d4d4d8; line-height: 1.6; margin-bottom: 16px;">
      Hello <strong>${input.customerName || "Valued Customer"}</strong>, our customer support team has replied to your inquiry:
    </div>

    <!-- TICKET DETAILS CARD -->
    <div style="background-color: #121216; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 16px;">
      <div style="font-size: 10px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        📌 TICKET #${input.ticketId} - ${input.category || "General Inquiry"}
      </div>
      <div style="font-size: 13px; font-weight: 800; color: #ffffff; margin-bottom: 10px;">${input.subject}</div>
      <div style="font-size: 12px; color: #e4e4e7; background: #18181f; padding: 12px; border-radius: 8px; border-left: 3px solid #38bdf8; white-space: pre-wrap; line-height: 1.6;">${input.message}</div>
    </div>

    <div style="text-align: center; margin-top: 18px;">
      <a href="${(input.baseUrl || "https://www.next-gear.app").replace(/\/$/, "")}/dashboard/customer/support" class="btn-red" style="padding: 10px 24px; font-size: 12px; background-color: #0284c7 !important;">
        View Ticket & Reply 💬
      </a>
    </div>
  `;

  return wrapInMasterEmailTemplate({
    categoryText: "CUSTOMER HELP DESK",
    headerIconText,
    title,
    titleBadge,
    userName: input.customerName || "Valued Customer",
    preheader: `Next Gear Support update on ticket #${input.ticketId}: ${input.subject}`,
    heroIllustrationHtml,
    contentHtml,
    baseUrl: input.baseUrl,
  });
}

