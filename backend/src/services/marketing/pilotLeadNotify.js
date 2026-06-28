import { devError } from "../../utils/devLog.js";

function getNotifyConfig() {
  const apiKey = String(process.env.RESEND_API_KEY ?? "").trim();
  const to = String(process.env.PILOT_NOTIFY_TO ?? "").trim();
  const from = String(process.env.PILOT_NOTIFY_FROM ?? "NaoLab <onboarding@resend.dev>").trim();
  return { apiKey, to, from };
}

/**
 * Sends an internal notification when a pilot lead is captured.
 * Never throws — email failure must not block the API response.
 */
export async function notifyPilotLead({ email, companyName, contactName, locale, updated }) {
  const { apiKey, to, from } = getNotifyConfig();
  const subject = updated
    ? `[NaoLab] Pilot lead updated — ${companyName}`
    : `[NaoLab] New pilot lead — ${companyName}`;
  const text = [
    updated ? "Pilot lead updated:" : "New pilot lead:",
    "",
    `Company: ${companyName}`,
    `Email: ${email}`,
    contactName ? `Contact: ${contactName}` : null,
    `Locale: ${locale || "en"}`,
    "",
    `Time: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!apiKey || !to) {
    if (process.env.NODE_ENV !== "test") {
      console.info(`[pilot-lead] ${subject}\n${text}`);
    }
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      devError(new Error(`Resend ${res.status}: ${body.slice(0, 200)}`));
    }
  } catch (err) {
    devError(err);
  }
}
