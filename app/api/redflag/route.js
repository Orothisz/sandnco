import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { bio, age, alias } = await req.json();

    // If there is practically no bio, punish them immediately to save API credits.
    if (!bio || bio.trim().length < 10) {
      return NextResponse.json({ score: 75, reason: "Hiding Information" });
    }

    // Ping the GLM-4-Flash Neural Engine
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY}`
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          {
            role: "system",
            content: `You are a ruthless, highly perceptive psychological profiler for an elite dating app. Analyze the target's Alias, Age, and Bio. Output a "Red Flag Score" from 1 to 99. 99 means highly toxic, arrogant, transactional, demanding, or problematic. 1 means completely genuine, humble, and safe. ONLY output valid JSON in this exact format: {"score": number, "reason": "3 words max"}. Do not include markdown formatting or backticks.`
          },
          {
            role: "user",
            content: `Alias: ${alias}, Age: ${age}, Bio: "${bio}"`
          }
        ],
        temperature: 0.3, // Low temp for cold, hard logic
        max_tokens: 50
      })
    });

    if (!response.ok) throw new Error("GLM API Rejected Request");

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON safely in case the LLM hallucinates markdown
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("LLM failed to return strict JSON");

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ score: result.score, reason: result.reason });

  } catch (error) {
    console.error("Neural Link Failed:", error.message);
    // Returning 500 tells the frontend to instantly trigger the V-Smart Fallback
    return NextResponse.json({ error: "Trigger Fallback Algorithm" }, { status: 500 });
  }
}
