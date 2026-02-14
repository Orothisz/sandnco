import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { bio, age, alias } = await req.json();

    // If the bio is completely empty, reject early to save API calls
    if (!bio || bio.trim().length === 0) {
      return NextResponse.json({ score: 85, reason: "Hiding Information" });
    }

    // Call Zhipu AI (GLM) API
    // Ensure you have GLM_API_KEY in your .env.local file
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
            content: `You are a psychological profiler for a dating app. Analyze the user profile and output a "Red Flag Score" from 1 to 99. 99 means highly toxic, arrogant, transactional, or problematic. 1 means extremely genuine and green flag. Provide a strict JSON response: {"score": number, "reason": "string of exactly 3 words max"}.`
          },
          {
            role: "user",
            content: `Alias: ${alias}, Age: ${age}, Bio: "${bio}"`
          }
        ],
        temperature: 0.3, // Low temperature for consistent logic
        max_tokens: 50
      })
    });

    if (!response.ok) {
      throw new Error(`GLM API returned status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON block from the LLM response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("LLM failed to return JSON");

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ 
      score: result.score, 
      reason: result.reason 
    });

  } catch (error) {
    console.error("GLM Pipeline Failure:", error.message);
    // Send a 500 error so the frontend knows to trigger the fallback algorithm
    return NextResponse.json({ error: "Trigger Fallback" }, { status: 500 });
  }
}
