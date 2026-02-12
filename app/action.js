"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Initialize Supabase Client (Standard)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function submitRequest(formData) {
  const cookieStore = cookies();

  // 1. CREATE AUTHENTICATED SUPABASE CLIENT
  // We need this to pass Row Level Security (RLS) policies
  const supabase = createClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  // 2. VERIFY USER SESSION
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "UNAUTHORIZED_ACCESS: PLEASE LOGIN" };
  }

  // 3. EXTRACT FORM DATA
  const rawData = {
    user_id: user.id,
    user_email: user.email,
    service_type: formData.get("service"),
    
    // User Info
    user_phone: formData.get("user_phone"),
    user_insta: formData.get("user_insta"),
    user_photo_url: formData.get("user_photo_url") || null,
    
    // Target Info
    target_name: formData.get("target_name"),
    target_phone: formData.get("target_phone"),
    target_insta: formData.get("target_insta"),
    target_email: formData.get("target_email"),
    
    // Mission Logistics
    has_specific_target: formData.get("has_specific_target") === 'true',
    reason: formData.get("reason"),
    deadline: formData.get("deadline") || null,
    additional_details: formData.get("details"),
    
    // Payments
    payment_screenshot_url: formData.get("payment_screenshot_url") || null,
    
    // Default Status
    status: "PENDING"
  };

  // 4. INSERT INTO DATABASE
  // We select() the inserted row to get the new 'id' for the Telegram message
  const { data: insertedData, error } = await supabase
    .from("requests")
    .insert(rawData)
    .select()
    .single();

  if (error) {
    console.error("Database Error:", error);
    return { success: false, message: error.message };
  }

  const requestID = insertedData.id;

  // 5. PREPARE TELEGRAM MESSAGE
  // HTML formatting for the "Dossier" look
  const tgMessage = `
🚨 <b>NEW MISSION #${requestID}</b>
➖➖➖➖➖➖➖➖➖➖
<b>TYPE:</b> <code>${rawData.service_type.toUpperCase()}</code>
<b>STATUS:</b> ⏳ PENDING REVIEW

🕵️ <b>OPERATIVE (CLIENT):</b>
📧 ${rawData.user_email}
📱 ${rawData.user_phone}
📸 ${rawData.user_insta}

🎯 <b>TARGET INTEL:</b>
👤 <b>Name:</b> ${rawData.target_name || "N/A (Algorithm)"}
📱 <b>Phone:</b> ${rawData.target_phone || "N/A"}
📸 <b>Insta:</b> ${rawData.target_insta || "N/A"}

📝 <b>MISSION SPECS:</b>
📅 <b>Deadline:</b> ${rawData.deadline || "ASAP"}
❓ <b>Specific Target?</b> ${rawData.has_specific_target ? "YES" : "NO"}
💭 <b>Notes:</b> 
<i>${rawData.reason || rawData.additional_details || "No details provided."}</i>

📂 <b>ASSETS:</b>
📸 <b>User Photo:</b> ${rawData.user_photo_url ? "✅ Attached" : "❌ None"}
💰 <b>Payment:</b> ${rawData.payment_screenshot_url ? "✅ Attached" : "❌ Pending/Free"}
➖➖➖➖➖➖➖➖➖➖
<i>To update status, reply:</i>
<code>/status ${requestID} ACTIVE</code>
`;

  // 6. SEND TO TELEGRAM
  try {
    const tgBaseUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
    
    // Send Text Message
    await fetch(`${tgBaseUrl}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: tgMessage,
        parse_mode: "HTML",
      }),
    });

    // Send User Photo (Matchmaking Evidence)
    if (rawData.user_photo_url) {
       await fetch(`${tgBaseUrl}/sendPhoto`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           chat_id: process.env.TELEGRAM_CHAT_ID,
           photo: rawData.user_photo_url,
           caption: `📸 Visual Asset for Mission #${requestID} (User)`
         }),
       });
    }

    // Send Payment Screenshot (if exists)
    if (rawData.payment_screenshot_url) {
        await fetch(`${tgBaseUrl}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            photo: rawData.payment_screenshot_url,
            caption: `💰 Payment Proof for Mission #${requestID}`
          }),
        });
     }

    return { success: true };

  } catch (err) {
    console.error("Telegram Error:", err);
    // Return true anyway because the Database save was successful
    return { success: true, warning: "TELEGRAM_FAILED" }; 
  }
}
