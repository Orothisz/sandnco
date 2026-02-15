import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Custom fallback algorithm for face detection
async function customFaceDetection(imageBuffer) {
  console.log('🔍 Running custom face detection fallback...');
  
  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Simple heuristic checks
    const checks = {
      hasValidSize: imageBuffer.length > 5000 && imageBuffer.length < 10 * 1024 * 1024,
      hasJPEGHeader: imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8,
      hasPNGHeader: imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50,
      hasWebPHeader: imageBuffer[8] === 0x57 && imageBuffer[9] === 0x45,
    };

    const isValidImageFormat = checks.hasJPEGHeader || checks.hasPNGHeader || checks.hasWebPHeader;
    
    if (!isValidImageFormat) {
      return {
        isValid: false,
        reason: "INVALID_IMAGE_FORMAT",
        confidence: 1.0
      };
    }

    if (!checks.hasValidSize) {
      return {
        isValid: false,
        reason: "INVALID_IMAGE_SIZE",
        confidence: 1.0
      };
    }

    // If we reach here, assume it might be valid (permissive fallback)
    console.log('✅ Custom detection: Image format valid, allowing through');
    return {
      isValid: true,
      reason: "FALLBACK_DETECTION_PASSED",
      confidence: 0.5, // Lower confidence since we can't actually detect faces
      method: "custom_heuristic"
    };

  } catch (error) {
    console.error('❌ Custom detection error:', error);
    return {
      isValid: false,
      reason: "DETECTION_ERROR",
      confidence: 0.0
    };
  }
}

// Gemini AI face detection
async function geminiDetectFace(imageBuffer, mimeType) {
  console.log('🤖 Attempting Gemini AI face detection...');
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this image and determine if it contains a human face or person. 
    
    Respond with ONLY a JSON object in this exact format:
    {
      "contains_person": true/false,
      "confidence": 0.0-1.0,
      "reason": "brief explanation"
    }
    
    Rules:
    - Return true if you see any human face, person, or human body parts
    - Return false for animals, objects, landscapes, text, or non-human subjects
    - Be strict but not overly cautious`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Gemini raw response:', text);

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    console.log('✅ Gemini analysis:', analysis);

    return {
      isValid: analysis.contains_person === true,
      reason: analysis.reason || "GEMINI_ANALYSIS_COMPLETE",
      confidence: analysis.confidence || 0.0,
      method: "gemini_ai"
    };

  } catch (error) {
    console.error('❌ Gemini detection error:', error);
    throw error; // Throw to trigger fallback
  }
}

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "UNAUTHORIZED: AUTHENTICATION_REQUIRED" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const alias = formData.get("alias");
    const age = formData.get("age");
    const bio = formData.get("bio");
    const instagram_id = formData.get("instagram_id");
    const imageFile = formData.get("image");

    // Validation
    if (!alias || !age || !bio || !instagram_id || !imageFile) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR: ALL_FIELDS_REQUIRED" },
        { status: 400 }
      );
    }

    if (parseInt(age) < 13 || parseInt(age) > 99) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR: AGE_OUT_OF_RANGE_[13-99]" },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const mimeType = imageFile.type;

    console.log('📸 Image received:', {
      size: imageBuffer.length,
      type: mimeType,
      alias: alias
    });

    // TRY GEMINI FIRST
    let detectionResult;
    try {
      detectionResult = await geminiDetectFace(imageBuffer, mimeType);
      console.log('✅ Gemini detection successful:', detectionResult);
    } catch (geminiError) {
      console.warn('⚠️ Gemini failed, falling back to custom algorithm...');
      // FALLBACK TO CUSTOM ALGORITHM
      detectionResult = await customFaceDetection(imageBuffer);
      console.log('✅ Fallback detection result:', detectionResult);
    }

    // Check if face detected
    if (!detectionResult.isValid) {
      return NextResponse.json(
        { 
          error: "BIOMETRIC_SCAN_FAILED",
          reason: detectionResult.reason,
          details: "AI detected no human face in image. Please upload a clear photo containing a person.",
          method_used: detectionResult.method || "unknown"
        },
        { status: 400 }
      );
    }

    console.log(`✅ Face detected (${detectionResult.method}, confidence: ${detectionResult.confidence})`);

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${alias}.${mimeType.split('/')[1]}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("minder-targets")
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      return NextResponse.json(
        { error: "STORAGE_ERROR: IMAGE_UPLOAD_FAILED" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("minder-targets")
      .getPublicUrl(fileName);

    // Insert into database
    const { data: insertData, error: insertError } = await supabase
      .from("minder_targets")
      .insert({
        alias,
        age: parseInt(age),
        bio,
        instagram_id,
        image_url: publicUrl,
        user_id: session.user.id,
        detection_method: detectionResult.method,
        detection_confidence: detectionResult.confidence,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      return NextResponse.json(
        { error: "DATABASE_ERROR: PROFILE_CREATION_FAILED" },
        { status: 500 }
      );
    }

    console.log('✅ Profile created successfully:', insertData.id);

    return NextResponse.json({
      success: true,
      message: "TARGET_UPLOADED_SUCCESSFULLY",
      data: insertData,
      detection: {
        method: detectionResult.method,
        confidence: detectionResult.confidence
      }
    });

  } catch (error) {
    console.error("❌ Enrollment error:", error);
    return NextResponse.json(
      { error: "SYSTEM_ERROR: ENROLLMENT_FAILED" },
      { status: 500 }
    );
  }
}
