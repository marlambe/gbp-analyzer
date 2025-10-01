// Replace the AI insights section in your analyze-with-ai.js

// ==========================================
// AI INSIGHTS WITH GROQ (FREE)
// ==========================================
let aiInsights = null;

try {
  console.log('Attempting Groq AI insights call (FREE)...');
  
  const reviewText = reviews.slice(0, 5).map(r => `"${r.text}" (${r.rating}★)`).join('\n') || 'No reviews';
  
  const aiPrompt = `Analyze this Google Business Profile briefly.

Business: ${businessName}
Category: ${primaryCategory}
Rating: ${rating}/5 (${reviewCount} reviews)
Response Rate: ${ownerResponseRate.toFixed(0)}%

Sample Reviews:
${reviewText}

Provide brief insights as JSON (no markdown):
{
  "suggestedCategory": "<better category or 'Good as is'>",
  "topKeywords": ["keyword1", "keyword2", "keyword3"],
  "commonPraise": ["praise1", "praise2"],
  "commonComplaints": ["complaint1"],
  "quickWins": ["action1", "action2", "action3"]
}`;

  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mixtral-8x7b-32768", // Free, fast, good quality
      messages: [
        {
          role: "system",
          content: "You are a local SEO expert. Respond only with valid JSON, no markdown."
        },
        {
          role: "user",
          content: aiPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 800
    })
  });

  if (groqResponse.ok) {
    const groqData = await groqResponse.json();
    let aiText = groqData.choices[0].message.content;
    
    // Clean markdown if present
    aiText = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    aiInsights = JSON.parse(aiText);
    console.log('Groq AI insights received successfully (FREE)');
  } else {
    console.log('Groq call failed with status:', groqResponse.status);
  }
} catch (error) {
  console.log('Groq insights failed (not critical):', error.message);
}

// Rest of your code stays the same...
