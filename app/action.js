"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function submitRequest(formData) {
  // 1. GET LOGGED IN USER (Auto-Fetch)
  // We re-initialize supabase with cookies to get the session securely
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get: (name) => cookies().get(name)?.value } }
  );
  
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return { success: false, message: "UNAUTHORIZED_ACCESS" };

  // 2. EXTRACT DATA
  const rawData = {
    user_id: user.id,
    user_email: user.email,
    service_type: formData.get("service"),
    
    // User Info
    user_phone: formData.get("user_phone"),
    user_insta: formData.get("user_insta"),
    
    // Target Info
    target_name: formData.get("target_name"),
    target_phone: formData.get("target_phone"),
    target_insta: formData.get("target_insta"),
    target_email: formData.get("target_email"),
    
    // Specifics
    has_specific_target: formData.get("has_specific_target") === 'true',
    reason: formData.get("reason"),
    deadline: formData.get("deadline") || null,
    additional_details: formData.get("details"),
    
    // Files
    user_photo_url: formData.get("user_photo_url"),
    payment_screenshot_url: formData.get("payment_screenshot_url"),
  };

  // 3. SAVE TO SUPABASE
  const { error } = await supabase.from("requests").insert(rawData);

  if (error) {
    console.error("DB Error:", error);
    return { success: false, message: error.message };
  }

  // 4. SEND TELEGRAM ALERT
  // We format this to look like a confidential dossier
  const tgMessage = `
🚨 <b>NEW MISSION: ${rawData.service_type.toUpperCase()}</b>

🕵️ <b>CLIENT INTEL:</b>
📧 Email: ${rawData.user_email}
📱 Phone: ${rawData.user_phone}
📸 Insta: ${rawData.user_insta}

🎯 <b>TARGET INTEL:</b>
👤 Name: ${rawData.target_name || "N/A"}
📱 Phone: ${rawData.target_phone || "N/A"}
📸 Insta: ${rawData.target_insta || "N/A"}
📧 Email: ${rawData.target_email || "N/A"}

📝 <b>MISSION SPECS:</b>
📅 Deadline: ${rawData.deadline || "ASAP"}
❓ Specific Target? ${rawData.has_specific_target ? "YES" : "NO"}
💭 Reason/Details: ${rawData.reason || rawData.additional_details}

📂 <b>Evidence/Photos:</b> ${rawData.user_photo_url ? "ATTACHED" : "NONE"}
💰 <b>Payment:</b> ${rawData.payment_screenshot_url ? "VERIFY SCREENSHOT" : "PENDING/FREE"}
  `;

  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: tgMessage,
        parse_mode: "HTML",
      }),
    });
    
    // Send Photo if exists
    if (rawData.user_photo_url) {
       await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, photo: rawData.user_photo_url }),
       });
    }

    return { success: true };
  } catch (err) {
    console.error("Telegram Failed:", err);
    return { success: true, warning: "TELEGRAM_FAILED" }; 
  }
}
