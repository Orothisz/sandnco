import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    // 1. Authenticate the Operative
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "CLEARANCE DENIED. LOG IN FIRST." }, { status: 401 });
    }

    // 2. Parse the incoming form data
    const formData = await req.formData();
    const alias = formData.get('alias');
    const age = formData.get('age');
    const bio = formData.get('bio');
    const instagram_id = formData.get('instagram_id');
    const imageFile = formData.get('image');

    if (!imageFile || !alias || !age) {
      return NextResponse.json({ error: "MISSING INTEL. FILL ALL FIELDS." }, { status: 400 });
    }

    // 3. Convert Image for Gemini processing
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: imageFile.type,
      },
    };

    // 4. THE BIOMETRIC SCANNER (Gemini API)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      Analyze this image. You are a strict gatekeeper for a dating app.
      Does the image primarily focus on a clear HUMAN face/body, or an ANIMAL (like a dog, cat, etc)?
      If it is an inanimate object, landscape, text, or heavily obscured, classify it as 'object'.
      Respond ONLY with a valid JSON object in this exact format, nothing else:
      {
        "classification": "human" | "animal" | "object",
        "reason": "Brief 1-sentence reason"
      }
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(responseText);

    // 5. ENFORCE PROTOCOL
    if (analysis.classification === 'object') {
      return NextResponse.json(
        { error: `BIOMETRIC REJECTION: Image flagged as non-biological. Reason: ${analysis.reason}. Insert picture of human or animal.` }, 
        { status: 406 }
      );
    }

    // 6. IF PASSED: UPLOAD TO SUPABASE STORAGE
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('minder_assets')
      .upload(fileName, imageFile);

    if (storageError) throw storageError;

    // Get the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('minder_assets')
      .getPublicUrl(fileName);

    // 7. SAVE TO DATABASE
    const { data: targetData, error: dbError } = await supabase
      .from('minder_targets')
      .insert([
        {
          user_id: session.user.id,
          alias,
          age: parseInt(age),
          bio,
          instagram_id,
          image_url: publicUrlData.publicUrl,
          entity_type: analysis.classification // 'human' or 'animal'
        }
      ]);

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true, 
      message: `PROFILE LIVE. CLASSIFICATION: ${analysis.classification.toUpperCase()}` 
    });

  } catch (error) {
    console.error("Minder Upload Error:", error);
    return NextResponse.json({ error: "INTERNAL SERVER ERROR. UPLINK FAILED." }, { status: 500 });
  }
}
