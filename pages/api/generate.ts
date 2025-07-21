import type { NextApiRequest, NextApiResponse } from "next";

// Uncomment to enable email sending
// import nodemailer from "nodemailer";

// Uncomment to enable Stripe subscription verification
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2022-11-15" });

// Rate limiting store (demo only, in-memory)
// const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();

type ResponseData =
  | {
      resume?: string;
      coverLetter?: string;
      linkedinHeadline?: string;
      linkedinSummary?: string;
      linkedinExperience?: string;
      fullText?: string;
      error?: string;
    }
  | { error: string };

// Dummy DB function - replace with real DB access
async function getUserById(userId: string) {
  // Fetch user info from your DB here
  return {
    id: userId,
    tier: "free", // 'free' | 'premium' | 'pro'
    resumesGeneratedThisMonth: 0,
    subscriptionActive: true,
    stripeCustomerId: "cus_ABC123",
  };
}

// Dummy usage increment - replace with your DB logic
async function incrementUserUsage(userId: string) {
  console.log(`Increment usage count for user ${userId}`);
}

// Uncomment and implement Stripe subscription check
/*
async function hasActiveSubscription(stripeCustomerId: string): Promise<boolean> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });
    return subscriptions.data.length > 0;
  } catch (error) {
    console.error("Stripe subscription check failed:", error);
    return false;
  }
}
*/

const FREE_TIER_LIMIT = 1;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Uncomment to enable rate limiting
  /*
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "") as string;
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxRequests = 10;

  let entry = rateLimitMap.get(ip);
  if (!entry || now - entry.lastRequest > limitWindow) {
    entry = { count: 1, lastRequest: now };
  } else {
    entry.count++;
    entry.lastRequest = now;
  }
  rateLimitMap.set(ip, entry);

  if (entry.count > maxRequests) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  */

  // User ID header - set this from frontend auth system
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: missing user ID" });
  }

  // Fetch user info from DB
  const user = await getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: user not found" });
  }

  // Uncomment to check Stripe subscription status
  /*
  const stripePaid = await hasActiveSubscription(user.stripeCustomerId);
  if (!stripePaid) {
    return res.status(402).json({ error: "Payment required. Please subscribe to access this service." });
  }
  */

  // Enforce freemium limits for free tier
  if (user.tier === "free" && user.resumesGeneratedThisMonth >= FREE_TIER_LIMIT) {
    return res.status(403).json({ error: "Free tier limit reached. Upgrade to premium for more." });
  }

  const { input, type } = req.body;
  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "Missing or invalid input" });
  }

  // Restrict LinkedIn feature to paid tiers
  if (type === "linkedin" && user.tier === "free") {
    return res.status(403).json({ error: "LinkedIn optimization available for Premium and Pro tiers only." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key is not configured" });
  }

  // Build prompt based on requested type
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
...
`;
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
(cover letter content here)
`;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const json = await response.json();

    if (!response.ok || json.error) {
      console.error("OpenAI API error:", json);
      return res.status(500).json({ error: json.error?.message || "OpenAI API error" });
    }

    const fullText = json.choices?.[0]?.message?.content || "";

    // Parse output based on type
    if (type === "linkedin") {
      const headlineMatch = fullText.match(/---HEADLINE---([\s\S]*?)---SUMMARY---/i);
      const summaryMatch = fullText.match(/---SUMMARY---([\s\S]*?)---EXPERIENCE---/i);
      const experienceMatch = fullText.match(/---EXPERIENCE---([\s\S]*)/i);

      // Uncomment to send email with nodemailer
      /*
      if (req.body.email) {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USERNAME,
          to: req.body.email,
          subject: "Your AI Generated LinkedIn Profile Content",
          text: `Headline:\n${headlineMatch ? headlineMatch[1].trim() : ""}\n\nSummary:\n${summaryMatch ? summaryMatch[1].trim() : ""}\n\nExperience:\n${experienceMatch ? experienceMatch[1].trim() : ""}`,
        };

        await transporter.sendMail(mailOptions);
      }
      */

      return res.status(200).json({
        linkedinHeadline: headlineMatch ? headlineMatch[1].trim() : "",
        linkedinSummary: summaryMatch ? summaryMatch[1].trim() : "",
        linkedinExperience: experienceMatch ? experienceMatch[1].trim() : "",
        fullText,
      });
    } else {
      const resumeMatch = fullText.match(/---RESUME---([\s\S]*?)---COVER LETTER---/i);
      const coverLetterMatch = fullText.match(/---COVER LETTER---([\s\S]*)/i);

      // Uncomment to send email with nodemailer
      /*
      if (req.body.email) {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USERNAME,
          to: req.body.email,
          subject: "Your AI Generated Resume & Cover Letter",
          text: `Resume:\n\n${resumeMatch ? resumeMatch[1].trim() : ""}\n\nCover Letter:\n\n${coverLetterMatch ? coverLetterMatch[1].trim() : ""}`,
        };

        await transporter.sendMail(mailOptions);
      }
      */

      // Increment usage for free tier users (uncomment in production)
      /*
      if (user.tier === "free") {
        await incrementUserUsage(userId);
      }
      */

      return res.status(200).json({
        resume: resumeMatch ? resumeMatch[1].trim() : "",
        coverLetter: coverLetterMatch ? coverLetterMatch[1].trim() : "",
        fullText,
      });
    }
  } catch (error: any) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message || "Something went wrong" });
  }
}
