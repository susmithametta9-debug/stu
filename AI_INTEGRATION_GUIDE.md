# AI Assistant Integration Guide

## Overview
Your AI Assistant is already set up with the infrastructure to work with real AI! The background has been made more opaque (50% in light mode, 70% in dark mode) for better visibility.

## Current Implementation Status

### ✅ What's Already Working:
1. **Frontend Component**: `/home/ubuntu/client/src/components/AIChatbotNew.tsx`
   - Collects all user data (courses, assignments, quizzes, notes, todos)
   - Sends messages with full context to the backend
   - Displays chat interface with message history
   - Supports image uploads for analysis

2. **Backend API Endpoint**: `/home/ubuntu/server/routes/chat.ts`
   - Receives messages and context
   - Builds system prompt with user's academic data
   - **READY TO INTEGRATE WITH AI API**

### 🔧 Where to Add Your AI Integration

The AI integration happens in **ONE PLACE**: `/home/ubuntu/server/routes/chat.ts` at **lines 42-72**

Currently, the code is set up to call OpenAI's API. Here's what you need to do:

#### Option 1: Use OpenAI (Recommended - Already Configured)
The code is already set up! You just need to add your OpenAI API key:

1. **Add your OpenAI API key** to the environment variables:
   ```bash
   # In /home/ubuntu/server/.env
   OPENAI_API_KEY=your_actual_openai_api_key_here
   ```

2. **That's it!** The AI will automatically:
   - Read all your courses, assignments, quizzes, notes, and todos
   - Answer questions about your schedule
   - Help prioritize tasks
   - Provide study advice
   - Analyze uploaded images

#### Option 2: Use a Different AI Service (Anthropic Claude, Google Gemini, etc.)

Replace lines 42-72 in `/home/ubuntu/server/routes/chat.ts` with your preferred AI service:

**Example for Anthropic Claude:**
```typescript
// Call Anthropic API
const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-3-sonnet-20240229",
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      ...(history || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ],
  }),
});

if (!anthropicResponse.ok) {
  const error = await anthropicResponse.json();
  console.error("Anthropic API error:", error);
  throw new Error("Failed to get AI response");
}

const data = await anthropicResponse.json();
const aiResponse = data.content[0].text;

res.json({ response: aiResponse });
```

**Example for Google Gemini:**
```typescript
// Call Google Gemini API
const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: systemPrompt },
            ...(history || []).map((msg: any) => ({
              text: msg.content,
            })),
            { text: message },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  }
);

if (!geminiResponse.ok) {
  const error = await geminiResponse.json();
  console.error("Gemini API error:", error);
  throw new Error("Failed to get AI response");
}

const data = await geminiResponse.json();
const aiResponse = data.candidates[0].content.parts[0].text;

res.json({ response: aiResponse });
```

#### Option 3: Use a Local AI Model (Ollama, LM Studio, etc.)

**Example for Ollama (running locally):**
```typescript
// Call Ollama API (local)
const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama2",
    prompt: `${systemPrompt}\n\nUser: ${message}\nAssistant:`,
    stream: false,
  }),
});

if (!ollamaResponse.ok) {
  throw new Error("Failed to get AI response from Ollama");
}

const data = await ollamaResponse.json();
const aiResponse = data.response;

res.json({ response: aiResponse });
```

## What Data is Available to the AI?

The AI receives **ALL** your academic data in the `context` object:

```typescript
{
  courses: [
    { id, title, code, description }
  ],
  assignments: [
    { id, title, course, dueDate, points }
  ],
  quizzes: [
    { id, title, course, dueDate, points }
  ],
  notes: [
    { id, title, content (first 200 chars) }
  ],
  todos: [
    { id, title, dueDate, priority, completed }
  ]
}
```

The AI can:
- Tell you what assignments are due soon
- Help you prioritize your workload
- Answer questions about specific courses
- Quiz you on your notes
- Suggest study schedules
- Analyze uploaded images (screenshots of problems, diagrams, etc.)

## Testing the AI

1. **Open the AI Assistant** by clicking the chat icon in the bottom-right corner
2. **Try these example questions:**
   - "What assignments do I have due this week?"
   - "What course has the most assignments?"
   - "Help me prioritize my tasks for today"
   - "Quiz me on my notes about [topic]"
   - "What's my schedule like?"
   - Upload an image and ask "Can you help me solve this problem?"

## Image Analysis

The AI can analyze images! When a user uploads an image:
- The image is sent as a base64 string in the `image` field
- For OpenAI, use the `gpt-4-vision-preview` model
- For Claude, use `claude-3-opus` or `claude-3-sonnet`
- The AI can read text, solve math problems, explain diagrams, etc.

## Troubleshooting

### AI not responding?
1. Check that your API key is set in `/home/ubuntu/server/.env`
2. Check the browser console for errors (F12)
3. Check the server logs for API errors
4. Verify your API key has credits/quota available

### AI gives generic responses?
- The system prompt includes all your data
- Make sure data is being loaded (check React Query in DevTools)
- The AI should reference your actual courses and assignments

### Want to improve AI responses?
Edit the system prompt in `/home/ubuntu/server/routes/chat.ts` (lines 22-39) to:
- Add more specific instructions
- Change the AI's personality
- Add domain-specific knowledge
- Adjust response format

## Summary

**To activate the AI assistant:**
1. Add your API key to `/home/ubuntu/server/.env`
2. Restart the server: `cd /home/ubuntu/server && npm run dev`
3. Open the chat and start asking questions!

The AI is **fully integrated** with your Student Hub data and ready to help with your studies!
