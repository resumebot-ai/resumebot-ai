import { NextResponse } from 'next/server';

// Replace with actual DB functions
async function getUserById(userId: string) {
  return {
    id: userId,
    tier: "free",
    resumesGeneratedThisMonth: 0,
    subscriptionActive: true,
    stripeCustomerId: "cus_ABC123",
  };
}
async function incrementUserUsage(userId: string) {
  console.log(`Increment usage count for user ${userId}`);
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id") || "";
    if (!userId) return NextResponse.json({ error: "Unauthorized: missing user ID" }, { status: 401 });

    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ error: "Unauthorized: user not found" }, { status: 401 });

    const body = await req.json();
    const { input, type, email } = body;

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Missing or invalid input" }, { status: 400 });
    }

    if (type === "linkedin" && user.tier === "free") {
      return NextResponse.json(
        { error: "LinkedIn optimization available for Premium and Pro tiers only." },
        { status: 403 }
      );
    }

    if (user.tier === "free" && user.resumesGeneratedThisMonth >= 1) {
      return NextResponse.json({ error: "Free tier limit reached." }, { status: 403 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 });
    }

    let prompt = "";
    if (type === "linkedin") {
      prompt = `
You are a LinkedIn expert career coach.

Based on the following candidate information:
${input}

Generate:

1. A LinkedIn headline (max 120 characters)
2. A LinkedIn summary/About section (2-3 paragraphs)
3. Optimized bullet points for work experience

Return the response with these exact section headers:

---HEADLINE---
...  
---SUMMARY---
...  
---EXPERIENCE---
...`;
    } else {
      prompt = `
You are an expert career coach and professional resume writer.

Based on the following candidate information, generate:

1. A professional resume summary with bullet points.
2. A tailored cover letter addressed to the hiring manager.

Candidate information:
${input}

Return the response with these exact section headers:

---RESUME---
(resume content here)

---COVER LETTER---
(cover letter content here)`;
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const json = await openaiRes.json();
    if (!openaiRes.ok || json.error) {
      console.error("OpenAI API error:", json);
      return NextResponse.json({ error: json.error?.message || "OpenAI API error" }, { status: 500 });
    }

    const fullText = json.choices?.[0]?.message?.content || "";

    if (type === "linkedin") {
      const headlineMatch = fullText.match(/---HEADLINE---([\s\S]*?)---SUMMARY---/i);
      const summaryMatch = fullText.match(/---SUMMARY---([\s\S]*?)---EXPERIENCE---/i);
      const experienceMatch = fullText.match(/---EXPERIENCE---([\s\S]*)/i);

      return NextResponse.json({
        linkedinHeadline: headlineMatch?.[1]?.trim() || "",
        linkedinSummary: summaryMatch?.[1]?.trim() || "",
        linkedinExperience: experienceMatch?.[1]?.trim() || "",
        fullText,
      });
    } else {
      const resumeMatch = fullText.match(/---RESUME---([\s\S]*?)---COVER LETTER---/i);
      const coverLetterMatch = fullText.match(/---COVER LETTER---([\s\S]*)/i);

      // await incrementUserUsage(userId); // Uncomment if tracking usage

      return NextResponse.json({
        resume: resumeMatch?.[1]?.trim() || "",
        coverLetter: coverLetterMatch?.[1]?.trim() || "",
        fullText,
      });
    }
  } catch (err: any) {
    console.error("Handler error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
