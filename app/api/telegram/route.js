import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// CRITICAL: Use Service Role Key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Helper to send message back to Telegram
async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text: text,
      parse_mode: "HTML" // Allows for bold/code formatting
    }),
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message || body.channel_post;

    // 1. Security Check
    if (!message || String(message.chat.id) !== ADMIN_CHAT_ID) {
      return NextResponse.json({ message: "Unauthorized Source Ignored" });
    }

    const text = message.text;
    if (!text || !text.startsWith("/")) {
      return NextResponse.json({ message: "Not a command" });
    }

    // 2. Parse Command: "/status 15 ACTIVE" or "/msg 15 target spotted"
    const parts = text.split(" ");
    const command = parts[0].toLowerCase();
    const requestId = parts[1];
    const content = parts.slice(2).join(" "); 

    if (!requestId) {
        await sendMessage(message.chat.id, "❌ <b>ERROR:</b> Missing Mission ID.");
        return NextResponse.json({ message: "Missing ID" });
    }

    // ---------------- COMMAND: /status (Change Mission State) ----------------
    if (command === "/status") {
       const validStatuses = ["PENDING", "ACTIVE", "COMPLETED", "REJECTED"];
       const newStatus = content.toUpperCase();

       if (!validStatuses.includes(newStatus)) {
           await sendMessage(message.chat.id, `❌ <b>INVALID STATUS.</b> Use: ${validStatuses.join(", ")}`);
           return NextResponse.json({ error: "Invalid Status" });
       }

       const { error } = await supabase
         .from("requests")
         .update({ status: newStatus })
         .eq("id", requestId);

       if (error) {
           await sendMessage(message.chat.id, `❌ <b>DB ERROR:</b> ${error.message}`);
       } else {
           // Your requested success reply
           await sendMessage(message.chat.id, `✅ <b>SYSTEM UPDATE: SUCCESS</b>\nMission #${requestId} status changed to: <code>${newStatus}</code>`);
       }
    }

    // ---------------- COMMAND: /msg (Send Intel Update) ----------------
    else if (command === "/msg") {
        if (!content) {
            await sendMessage(message.chat.id, "❌ <b>ERROR:</b> Update content is empty.");
            return NextResponse.json({ error: "No content" });
        }

        const { error } = await supabase
          .from("requests")
          .update({ latest_update: content })
          .eq("id", requestId);

        if (error) {
            await sendMessage(message.chat.id, `❌ <b>DB ERROR:</b> ${error.message}`);
        } else {
            // Your requested success reply
            await sendMessage(message.chat.id, `📂 <b>INTEL ADDED</b>\nUpdate successfully logged for Mission #${requestId}:\n<i>"${content}"</i>`);
        }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
