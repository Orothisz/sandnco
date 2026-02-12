import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message || body.channel_post;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = String(message.chat.id);
    const text = message.text || "";

    // --- DEBUG: FIND YOUR CHAT ID ---
    // Type "/id" in your Telegram group to find the correct ADMIN_CHAT_ID
    if (text === "/id") {
      await sendMessage(chatId, `🆔 <b>Your Chat ID is:</b> <code>${chatId}</code>\nCopy this to your Vercel Environment Variables.`);
      return NextResponse.json({ ok: true });
    }

    // 1. Security Check
    if (chatId !== ADMIN_CHAT_ID) {
      console.log(`Unauthorized ID: ${chatId} vs Expected: ${ADMIN_CHAT_ID}`);
      return NextResponse.json({ message: "Unauthorized ID" });
    }

    if (!text.startsWith("/")) return NextResponse.json({ ok: true });

    const parts = text.split(" ");
    const command = parts[0].toLowerCase();
    const requestId = parts[1];
    const content = parts.slice(2).join(" "); 

    if (!requestId) {
        await sendMessage(chatId, "❌ <b>ERROR:</b> Missing ID. Usage: <code>/status 1 ACTIVE</code>");
        return NextResponse.json({ ok: true });
    }

    // --- /status COMMAND ---
    if (command === "/status") {
       const validStatuses = ["PENDING", "ACTIVE", "COMPLETED", "REJECTED"];
       const newStatus = content.toUpperCase();

       if (!validStatuses.includes(newStatus)) {
           await sendMessage(chatId, `❌ <b>INVALID STATUS.</b> Use: ${validStatuses.join(", ")}`);
           return NextResponse.json({ ok: true });
       }

       const { error } = await supabase
         .from("requests")
         .update({ status: newStatus })
         .eq("id", requestId);

       if (error) {
           await sendMessage(chatId, `❌ <b>DB ERROR:</b> ${error.message}`);
       } else {
           await sendMessage(chatId, `✅ <b>SYSTEM UPDATE: SUCCESS</b>\nMission #${requestId} status changed to: <code>${newStatus}</code>`);
       }
    }

    // --- /msg COMMAND ---
    else if (command === "/msg") {
        if (!content) return NextResponse.json({ ok: true });
        const { error } = await supabase.from("requests").update({ latest_update: content }).eq("id", requestId);

        if (error) await sendMessage(chatId, `❌ <b>DB ERROR:</b> ${error.message}`);
        else await sendMessage(chatId, `📂 <b>INTEL ADDED</b>\nLogged for Mission #${requestId}: <i>"${content}"</i>`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
