"use client";

import { useState, useEffect, useMemo } from "react";
import { CustomTemplateConfig, DEFAULT_TEMPLATE_CONFIGS } from "@/lib/custom-templates-store";

function buildLivePreviewHtml(config: CustomTemplateConfig): string {
  const categoryText = config.categoryText || "NOTIFICATION";
  const headerIconText = config.headerIconText || "🔒 Secure Login";
  const title = config.headline || config.subject || "Template Title";
  const userName = "Abhishek Singh";
  
  const bodyText = (config.bodyContent || "")
    .replace(/\{\{userName\}\}/g, userName)
    .replace(/\{\{otp\}\}/g, "582914")
    .replace(/\{\{bookingId\}\}/g, "NG12345678")
    .replace(/\{\{vehicleTitle\}\}/g, "Hyundai Creta")
    .replace(/\{\{cityName\}\}/g, "Delhi / Noida")
    .replace(/\{\{startDate\}\}/g, "22 May 2026, 10:00 AM")
    .replace(/\{\{endDate\}\}/g, "24 May 2026, 10:00 AM")
    .replace(/\{\{totalAmount\}\}/g, "4,499")
    .replace(/\{\{passUrl\}\}/g, "https://next-gear.app/api/bookings/NG12345678/pass")
    .replace(/\n/g, "<br/>");

  const buttonText = config.buttonText || "Click Here";
  const supportEmail = config.supportEmail || "support@next-gear.app";
  const websiteUrl = config.websiteUrl || "https://www.next-gear.app";
  const isWhatsApp = config.type === "whatsapp";

  if (isWhatsApp) {
    const formattedWaHtml = bodyText
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 20px; background: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 90vh; }
    .phone-mockup { width: 360px; background: #0b141a; border-radius: 36px; border: 8px solid #1f2c34; box-shadow: 0 25px 60px rgba(0,0,0,0.8); overflow: hidden; }
    .wa-header { background: #1f2c34; padding: 16px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #111b21; }
    .wa-avatar { width: 38px; height: 38px; border-radius: 50%; background: #00a884; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; }
    .wa-title { color: #e9edef; font-weight: 700; font-size: 14px; }
    .wa-sub { color: #00a884; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .wa-body { padding: 20px; background: #0b141a; min-height: 380px; display: flex; flex-direction: column; justify-content: flex-end; }
    .wa-bubble { background: #005c4b; color: #e9edef; border-radius: 12px 12px 0 12px; padding: 14px 16px; font-size: 12px; line-height: 1.6; max-width: 90%; align-self: flex-end; box-shadow: 0 2px 5px rgba(0,0,0,0.3); word-break: break-word; }
    .wa-bubble code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #25d366; }
    .wa-time { font-size: 9px; color: #8696a0; text-align: right; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="phone-mockup">
    <div class="wa-header">
      <div class="wa-avatar">🚗</div>
      <div>
        <div class="wa-title">Next Gear Official ✔</div>
        <div class="wa-sub">🟢 Verified Business Account</div>
      </div>
    </div>
    <div class="wa-body">
      <div class="wa-bubble">
        ${formattedWaHtml}
        <div class="wa-time">10:42 AM ✔✔</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // HTML Email Live Rendering
  const maxWidth = (config.id === "otp" || config.id === "password_reset") ? "440px" : "540px";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 10px; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #ffffff; }
    .btn-red { background-color: #dc2626 !important; color: #ffffff !important; text-decoration: none !important; font-weight: 700 !important; border-radius: 10px !important; display: inline-block !important; padding: 12px 32px; font-size: 13px; box-shadow: 0 4px 18px rgba(220,38,38,0.4); }
  </style>
</head>
<body style="margin:0; padding:10px 0; background-color:#050505; color:#ffffff;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: ${maxWidth}; background-color: #09090c; border: 1px solid #1c1c22; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.95);">
          <tr>
            <td style="padding: 12px 20px; background-color: #060608; border-bottom: 1px solid #16161b;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                <tr>
                  <td align="left" style="color: #a1a1aa;">${categoryText}</td>
                  <td align="right" style="color: #71717a;">View in Browser</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 20px; background-color: #09090c; border-bottom: 1px solid #16161b;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="middle" style="padding-right: 10px;">
                          <img src="/next-gear-transparent-hero.png" alt="Next Gear Logo" style="height: 44px; width: auto; display: block; border: 0; filter: drop-shadow(0 0 10px rgba(225,6,0,0.5));" />
                        </td>
                        <td valign="middle">
                          <div style="font-size: 18px; font-weight: 900; color: #ffffff;">NEXT <span style="color: #dc2626;">GEAR</span></div>
                          <div style="font-size: 8px; font-weight: 800; color: #71717a; letter-spacing: 2px;">RENT. RIDE. REPEAT.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="font-size: 11px; color: #a1a1aa;">${headerIconText}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 20px 14px 20px;">
              <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 900; color: #ffffff;">${title}</h1>
              <p style="margin: 0 0 14px 0; font-size: 13px; font-weight: 700; color: #ffffff;">Hi <span style="color: #dc2626;">${userName}</span>,</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <div style="font-size: 12px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
                ${bodyText}
              </div>

              ${config.id === "otp" ? `
              <div style="border: 1px dashed #dc2626; background: rgba(220,38,38,0.03); border-radius: 14px; padding: 16px 12px; text-align: center; margin-bottom: 16px;">
                <div style="font-size: 9px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">YOUR 6-DIGIT OTP CODE</div>
                <div style="font-size: 28px; font-weight: 900; font-family: monospace; color: #ffffff; margin-bottom: 10px;">5&nbsp;&nbsp;8&nbsp;&nbsp;2&nbsp;&nbsp;9&nbsp;&nbsp;1&nbsp;&nbsp;4</div>
                <div style="display: inline-block; background: rgba(0,0,0,0.6); border: 1px solid rgba(248,113,113,0.3); padding: 4px 12px; border-radius: 9999px; font-size: 10px; color: #f87171; font-weight: 700;">⏱️ Valid for 10 minutes only</div>
              </div>` : ""}

              <div style="text-align: center; margin-top: 16px;">
                <a href="#" class="btn-red">${buttonText}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px; background-color: #050507; border-top: 1px solid #16161b;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 10px; color: #71717a;">
                <tr>
                  <td align="left">© 2026 Next Gear</td>
                  <td align="center"><a href="mailto:${supportEmail}" style="color: #a1a1aa; text-decoration: none;">${supportEmail}</a></td>
                  <td align="right"><a href="${websiteUrl}" style="color: #a1a1aa; text-decoration: none;">${websiteUrl.replace(/^https?:\/\//, "")}</a></td>
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

export function AdminEmailTemplatesPanel() {
  const [templates, setTemplates] = useState<Record<string, CustomTemplateConfig>>(DEFAULT_TEMPLATE_CONFIGS);
  const [selectedId, setSelectedId] = useState<string>("otp");
  const [activeConfig, setActiveConfig] = useState<CustomTemplateConfig>(DEFAULT_TEMPLATE_CONFIGS.otp);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/email-templates");
      const data = await res.json();
      if (data.ok && data.templates) {
        setTemplates(data.templates);
        if (data.templates[selectedId]) {
          setActiveConfig(data.templates[selectedId]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch templates:", e);
    }
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedId(id);
    if (templates[id]) {
      setActiveConfig(templates[id]);
    } else if (DEFAULT_TEMPLATE_CONFIGS[id]) {
      setActiveConfig(DEFAULT_TEMPLATE_CONFIGS[id]);
    }
    setMessage(null);
  };

  const handleChange = (field: keyof CustomTemplateConfig, value: string) => {
    setActiveConfig((prev) => ({ ...prev, [field]: value }));
  };

  const insertVariable = (variableTag: string) => {
    setActiveConfig((prev) => ({
      ...prev,
      bodyContent: prev.bodyContent + ` ${variableTag} `,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeConfig),
      });
      const data = await res.json();
      if (data.ok) {
        setTemplates((prev) => ({ ...prev, [activeConfig.id]: data.template }));
        setMessage({ type: "success", text: "Template saved & updated successfully! 💾" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save template" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to save template" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset this template to factory defaults?")) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeConfig.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setActiveConfig(data.template);
        setTemplates((prev) => ({ ...prev, [activeConfig.id]: data.template }));
        setMessage({ type: "success", text: "Template reset to default settings! 🔄" });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to reset template" });
    } finally {
      setIsSaving(false);
    }
  };

  const availableVariables = [
    "{{userName}}",
    "{{otp}}",
    "{{bookingId}}",
    "{{vehicleTitle}}",
    "{{cityName}}",
    "{{startDate}}",
    "{{endDate}}",
    "{{totalAmount}}",
    "{{passUrl}}",
  ];

  // Instant 0ms Live HTML Preview Generator
  const livePreviewHtml = useMemo(() => {
    return buildLivePreviewHtml(activeConfig);
  }, [activeConfig]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTemplateId, setBroadcastTemplateId] = useState("festive");
  const [broadcastCouponCode, setBroadcastCouponCode] = useState("FESTIVE25");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleBroadcastCampaign = async () => {
    setIsBroadcasting(true);
    setBroadcastMessage(null);
    try {
      const res = await fetch("/api/admin/email-templates/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: broadcastTemplateId,
          couponCode: broadcastCouponCode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to launch campaign broadcast");
      }
      setBroadcastMessage({ type: "success", text: data.message || "Campaign dispatched successfully!" });
    } catch (err: any) {
      setBroadcastMessage({ type: "error", text: err.message || "Failed to broadcast email campaign" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0b0b0e] border border-white/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">✉️</span>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Email & WhatsApp Template Editor</h2>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Customize outgoing HTML email & WhatsApp message templates like a Word document with instant live preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* BROADCAST CAMPAIGN BUTTON */}
          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-500/50 rounded-xl px-4 py-2.5 text-xs font-black text-white transition shadow-lg hover:shadow-red-900/30 cursor-pointer"
          >
            <span>🚀 Broadcast Campaign</span>
          </button>

          {/* CUSTOM EXECUTIVE TEMPLATE SELECTOR DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-[#121216] border border-white/20 hover:border-[var(--brand-red)] rounded-xl px-4 py-2.5 text-xs font-bold text-white transition shadow-lg cursor-pointer"
            >
              <span>{activeConfig.name}</span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                activeConfig.type === "whatsapp" 
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" 
                  : "bg-red-950 text-red-400 border border-red-500/30"
              }`}>
                {activeConfig.type.toUpperCase()}
              </span>
              <span className={`text-[10px] text-white/50 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}>▼</span>
            </button>

          {/* Dropdown Menu Panel */}
          {isDropdownOpen && (
            <>
              {/* Clickaway Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#0f0f13] border border-white/15 rounded-2xl p-2 shadow-2xl z-50 space-y-1 divide-y divide-white/5">
                <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white/40">
                  Select Template To Edit:
                </div>
                <div className="pt-1 space-y-1 max-h-80 overflow-y-auto no-scrollbar">
                  {Object.values(templates).map((t) => {
                    const isSelected = t.id === activeConfig.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          handleSelectTemplate(t.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? "bg-[var(--brand-red)] text-white shadow-lg shadow-red-600/30"
                            : "text-white/80 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className="truncate pr-2">{t.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : t.type === "whatsapp"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-950 text-red-400 border border-red-500/30"
                        }`}>
                          {t.type.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

      {/* Notification Toast */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-bold border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/40 border-red-500/40 text-red-300"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-white/60 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Split-Screen Editor + INSTANT LIVE STUDIO PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Editor (6 cols) */}
        <div className="lg:col-span-6 bg-[#09090c] border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              📝 Template Controls
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-950/60 border border-red-500/30 text-red-400">
                {activeConfig.type.toUpperCase()}
              </span>
            </h3>
            <span className="text-[10px] text-white/40 font-mono">ID: {activeConfig.id}</span>
          </div>

          {/* Subject / Title */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
              Template Subject / Title:
            </label>
            <input
              type="text"
              value={activeConfig.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              className="w-full bg-[#121216] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-[var(--brand-red)]"
              placeholder="Enter subject line..."
            />
          </div>

          {/* Sub-header / Category Tag */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
                Top Category Tag:
              </label>
              <input
                type="text"
                value={activeConfig.categoryText}
                onChange={(e) => handleChange("categoryText", e.target.value)}
                className="w-full bg-[#121216] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-[var(--brand-red)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
                Header Badge Text:
              </label>
              <input
                type="text"
                value={activeConfig.headerIconText}
                onChange={(e) => handleChange("headerIconText", e.target.value)}
                className="w-full bg-[#121216] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-[var(--brand-red)]"
              />
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
              Main Headline:
            </label>
            <input
              type="text"
              value={activeConfig.headline}
              onChange={(e) => handleChange("headline", e.target.value)}
              className="w-full bg-[#121216] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-[var(--brand-red)]"
            />
          </div>

          {/* Variable Toolbar Bar */}
          <div>
            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
              Insert Variable Tag (Click to Add):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableVariables.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertVariable(tag)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-red-400 hover:bg-red-950/40 hover:border-red-500/40 transition cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content Textarea */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
              Body Message / Content (WYSIWYG Text):
            </label>
            <textarea
              rows={7}
              value={activeConfig.bodyContent}
              onChange={(e) => handleChange("bodyContent", e.target.value)}
              className="w-full bg-[#121216] border border-white/15 rounded-xl p-4 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-[var(--brand-red)] resize-none"
              placeholder="Enter body content..."
            />
          </div>

          {/* Button Text */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
              CTA Action Button Label:
            </label>
            <input
              type="text"
              value={activeConfig.buttonText}
              onChange={(e) => handleChange("buttonText", e.target.value)}
              className="w-full bg-[#121216] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-[var(--brand-red)]"
            />
          </div>

          {/* Social Media & App Store URLs Section */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
              🌐 Social Media & App Download Links
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-white/60 uppercase mb-1">
                  Facebook URL:
                </label>
                <input
                  type="text"
                  value={activeConfig.facebookUrl || "https://facebook.com"}
                  onChange={(e) => handleChange("facebookUrl", e.target.value)}
                  className="w-full bg-[#121216] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--brand-red)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/60 uppercase mb-1">
                  Instagram URL:
                </label>
                <input
                  type="text"
                  value={activeConfig.instagramUrl || "https://instagram.com"}
                  onChange={(e) => handleChange("instagramUrl", e.target.value)}
                  className="w-full bg-[#121216] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--brand-red)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/60 uppercase mb-1">
                  Twitter/X URL:
                </label>
                <input
                  type="text"
                  value={activeConfig.twitterUrl || "https://twitter.com"}
                  onChange={(e) => handleChange("twitterUrl", e.target.value)}
                  className="w-full bg-[#121216] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--brand-red)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/60 uppercase mb-1">
                  LinkedIn URL:
                </label>
                <input
                  type="text"
                  value={activeConfig.linkedinUrl || "https://linkedin.com"}
                  onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                  className="w-full bg-[#121216] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--brand-red)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/60 uppercase mb-1">
                  Google Play URL:
                </label>
                <input
                  type="text"
                  value={activeConfig.googlePlayUrl || "https://play.google.com"}
                  onChange={(e) => handleChange("googlePlayUrl", e.target.value)}
                  className="w-full bg-[#121216] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--brand-red)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/60 uppercase mb-1">
                  App Store URL:
                </label>
                <input
                  type="text"
                  value={activeConfig.appStoreUrl || "https://apps.apple.com"}
                  onChange={(e) => handleChange("appStoreUrl", e.target.value)}
                  className="w-full bg-[#121216] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--brand-red)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-white/60 uppercase mb-1">
                  Support Email:
                </label>
                <input
                  type="text"
                  value={activeConfig.supportEmail || "support@next-gear.app"}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  className="w-full bg-[#121216] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--brand-red)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/60 uppercase mb-1">
                  Official Website URL:
                </label>
                <input
                  type="text"
                  value={activeConfig.websiteUrl || "https://www.next-gear.app"}
                  onChange={(e) => handleChange("websiteUrl", e.target.value)}
                  className="w-full bg-[#121216] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[var(--brand-red)]"
                />
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              🔄 Reset Default
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[var(--brand-red)] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-600/30 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Template Changes 💾"}
            </button>
          </div>
        </div>

        {/* Right Column: INSTANT 0ms LIVE PREVIEW FRAME (6 cols) */}
        <div className="lg:col-span-6 bg-[#09090c] border border-white/10 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              ⚡ Instant Real-Time Preview
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold animate-pulse">
                LIVE 0ms
              </span>
            </h3>
            <a
              href={`/api/email-preview?template=${activeConfig.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-bold text-red-400 hover:underline"
            >
              Full Studio ↗
            </a>
          </div>

          <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-[#050505] min-h-[560px]">
            <iframe
              srcDoc={livePreviewHtml}
              className="w-full h-full min-h-[560px] border-none"
              title="Instant Live Template Preview"
            />
          </div>
        </div>
      </div>

      {/* BROADCAST CAMPAIGN MODAL */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f0f13] border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                🚀 Launch Email Campaign
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsBroadcastModalOpen(false);
                  setBroadcastMessage(null);
                }}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/70">
              Dispatch high-converting HTML promo emails to all registered customers and waitlist subscribers in 1 click.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">Select Email Campaign:</label>
                <select
                  value={broadcastTemplateId}
                  onChange={(e) => {
                    setBroadcastTemplateId(e.target.value);
                    if (e.target.value === "festive") setBroadcastCouponCode("FESTIVE25");
                    else if (e.target.value === "welcome") setBroadcastCouponCode("WELCOME10");
                    else if (e.target.value === "discount_coupon") setBroadcastCouponCode("RIDEGEAR20");
                  }}
                  className="w-full bg-[#18181f] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="festive">🎆 Festive Sale Promo (FESTIVE25)</option>
                  <option value="discount_coupon">🎟️ Special Coupon Deal (RIDEGEAR20)</option>
                  <option value="welcome">👋 Welcome Offer (WELCOME10)</option>
                  <option value="blog">📰 New Blog Article Release</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 mb-1">Coupon Code (Optional):</label>
                <input
                  type="text"
                  value={broadcastCouponCode}
                  onChange={(e) => setBroadcastCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE25"
                  className="w-full bg-[#18181f] border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {broadcastMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  broadcastMessage.type === "success" 
                    ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300" 
                    : "bg-red-950/80 border border-red-500/40 text-red-300"
                }`}>
                  {broadcastMessage.text}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsBroadcastModalOpen(false);
                  setBroadcastMessage(null);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBroadcastCampaign}
                disabled={isBroadcasting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-900/40 cursor-pointer disabled:opacity-50"
              >
                {isBroadcasting ? "Sending Emails..." : "Dispatch Campaign Now ⚡"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
