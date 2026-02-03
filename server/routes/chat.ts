import { Router, Request, Response } from "express";

const router = Router();

/**
 * POST /api/chat - Chat with AI assistant
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { message, context, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Build system prompt with user context
    const systemPrompt = `You are an intelligent academic assistant for a student. You have access to all their academic data including:

Courses: ${JSON.stringify(context.courses || [], null, 2)}
Assignments: ${JSON.stringify(context.assignments || [], null, 2)}
Quizzes: ${JSON.stringify(context.quizzes || [], null, 2)}
Notes: ${JSON.stringify(context.notes || [], null, 2)}
Todos: ${JSON.stringify(context.todos || [], null, 2)}

Your role is to:
- Help students understand their schedule and deadlines
- Answer questions about their courses and assignments
- Provide study advice and organization tips
- Help prioritize tasks based on due dates
- Quiz them on their notes
- Summarize course content
- Suggest study plans

Be helpful, encouraging, and concise. Use the student's actual data to provide personalized responses.`;

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...(history || []).map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error("OpenAI API error:", error);
      throw new Error("Failed to get AI response");
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices[0].message.content;

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

export default router;
