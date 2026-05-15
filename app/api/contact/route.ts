import { NextResponse } from "next/server";

const EMAILJS_API = "https://api.emailjs.com/api/v1.0/email/send";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      mobile,
      subject,
      type,
      service,
      provinceCity,
      municipalityCity,
      barangay,
      postalCode,
      addressDetails,
      message,
    } = body || {};

    const service_id = process.env.EMAILJS_SERVICE_ID || "service_xqnzxtk";
    const template_id = process.env.EMAILJS_TEMPLATE_ID;
    const user_id = process.env.EMAILJS_PUBLIC_KEY;
    const private_key = process.env.EMAILJS_PRIVATE_KEY;

    // Log configuration for debugging
    console.log("📧 EmailJS Configuration Check:", {
      service_id_present: !!service_id,
      template_id_present: !!template_id,
      user_id_present: !!user_id,
      private_key_present: !!private_key,
      service_id: service_id?.substring(0, 8) + "...",
      template_id: template_id?.substring(0, 8) + "...",
      user_id: user_id?.substring(0, 8) + "...",
    });

    if (!template_id || !user_id || !private_key) {
      console.error("❌ EmailJS Configuration Missing:", {
        template_id: !template_id ? "MISSING" : "OK",
        user_id: !user_id ? "MISSING" : "OK",
        private_key: !private_key ? "MISSING" : "OK",
      });
      return NextResponse.json(
        { error: "EmailJS not configured (missing template, public key, or private key)" },
        { status: 500 }
      );
    }

    const template_params = {
      name,
      email,
      mobile,
      subject,
      type,
      service,
      provinceCity,
      municipalityCity,
      barangay,
      postalCode,
      addressDetails,
      message,
    };

    console.log("📤 Sending to EmailJS with params:", {
      keys: Object.keys(template_params),
      name,
      email,
    });

    const resp = await fetch(EMAILJS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_id, template_id, user_id, accessToken: private_key, template_params }),
    });

    const responseText = await resp.text();

    if (!resp.ok) {
      console.error("❌ EmailJS API Error:", {
        status: resp.status,
        statusText: resp.statusText,
        response: responseText,
      });
      return NextResponse.json(
        {
          error: "EmailJS request failed",
          status: resp.status,
          details: responseText,
        },
        { status: 502 }
      );
    }

    console.log("✅ Email sent successfully via EmailJS");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Contact API Error:", {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
