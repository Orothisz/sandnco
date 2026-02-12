import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Helper to send message back to Telegram
async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message || body.channel_post;

    // 1. Security Check (Ignore messages from strangers)
    if (!message || String(message.chat.id) !== ADMIN_CHAT_ID) {
      return NextResponse.json({ message: "Ignored" });
    }

    const text = message.text;
    if (!text || !text.startsWith("/")) {
      return NextResponse.json({ message: "Not a command" });
    }

    // 2. Parse Command: "/status 15 ACTIVE"
    const parts = text.split(" ");
    const command = parts[0];
    const requestId = parts[1];
    const content = parts.slice(2).join(" "); // The rest of the string

    if (!requestId) {
        await sendMessage(message.chat.id, "❌ Error: Missing ID. Usage: /status <ID> <VALUE>");
        return NextResponse.json({ message: "Missing ID" });
    }

    // ---------------- COMMAND: /status ----------------
    if (command === "/status") {
       const validStatuses = ["PENDING", "ACTIVE", "COMPLETED", "REJECTED"];
       const newStatus = content.toUpperCase();

       if (!validStatuses.includes(newStatus)) {
           await sendMessage(message.chat.id, `❌ Invalid Status. Use: ${validStatuses.join(", ")}`);
           return NextResponse.json({ error: "Invalid Status" });
       }

       const { error } = await supabase
         .from("requests")
         .update({ status: newStatus })
         .eq("id", requestId);

       if (error) {
           await sendMessage(message.chat.id, `❌ DB Error: ${error.message}`);
       } else {
           await sendMessage(message.chat.id, `✅ Request #${requestId} updated to: ${newStatus}`);
       }
    }

    // ---------------- COMMAND: /msg (Send Update) ----------------
    else if (command === "/msg") {
        if (!content) return NextResponse.json({ error: "No content" });

        const { error } = await supabase
          .from("requests")
          .update({ latest_update: content })
          .eq("id", requestId);

        if (error) {
            await sendMessage(message.chat.id, `❌ DB Error: ${error.message}`);
        } else {
            await sendMessage(message.chat.id, `✅ Update sent to User #${requestId}: "${content}"`);
        }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
