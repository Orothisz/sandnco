import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    // 1. Authenticate the Operative (Next.js 14+ specific formatting)
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
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

    // 3. Securely Convert Image to pure Buffer for BOTH Gemini and Supabase
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: imageFile.type,
      },
    };

    // 4. BULLETPROOF BIOMETRIC SCANNER (Forced JSON Mode)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            classification: {
              type: SchemaType.STRING,
              description: "Must be exactly 'human', 'animal', or 'object'"
            },
            reason: {
              type: SchemaType.STRING,
              description: "A brief 1-sentence reason for the classification"
            }
          },
          required: ["classification", "reason"]
        }
      }
    });

    const prompt = `
      Analyze this image. You are a strict gatekeeper for a dating app.
      Does the image primarily focus on a clear HUMAN face/body, or an ANIMAL (like a dog, cat)?
      If it is an inanimate object, landscape, text, heavily obscured, or pure background, classify it as 'object'.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    // Because we forced JSON schema, we don't need regex. We can parse it directly.
    const analysis = JSON.parse(result.response.text());

    // 5. ENFORCE PROTOCOL
    if (analysis.classification === 'object') {
      return NextResponse.json(
        { error: `BIOMETRIC REJECTION: ${analysis.reason.toUpperCase()} INSERT HUMAN/ANIMAL.` }, 
        { status: 406 }
      );
    }

    // 6. IF PASSED: UPLOAD TO SUPABASE STORAGE (Using pure Buffer)
    const fileExt = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from('minder_assets')
      .upload(fileName, buffer, {
        contentType: imageFile.type,
        upsert: false
      });

    // If Supabase Storage fails, throw the exact error to the frontend
    if (storageError) throw new Error(`STORAGE LOCKOUT: ${storageError.message}`);

    // Get the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('minder_assets')
      .getPublicUrl(fileName);

    // 7. SAVE TO DATABASE
    const { data: targetData, error: dbError } = await supabase
      .from('minder_targets')
      .insert([{
        user_id: session.user.id,
        alias,
        age: parseInt(age),
        bio,
        instagram_id: instagram_id ? instagram_id.replace('@', '') : '',
        image_url: publicUrlData.publicUrl,
        entity_type: analysis.classification // 'human' or 'animal'
      }]);

    // If Database insert fails, throw the exact error to the frontend
    if (dbError) throw new Error(`DATABASE REJECTION: ${dbError.message}`);

    return NextResponse.json({ 
      success: true, 
      message: `PROFILE LIVE. CLASSIFICATION: ${analysis.classification.toUpperCase()}` 
    });

  } catch (error) {
    console.error("Minder Upload Error:", error);
    // Pipe the exact error message back to the UI so we can see what broke
    return NextResponse.json({ error: `SYSTEM FAILURE: ${error.message}` }, { status: 500 });
  }
}
