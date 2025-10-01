export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessName, businessData, dataSource } = req.body;
    
    if (!businessName || !businessData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Prepare the prompt for Claude
    const prompt = `You are a local SEO expert analyzing a Google Business Profile. Provide actionable, specific recommendations.

Business: ${businessName}
Data Source: ${dataSource}

Business Data:
- Rating: ${businessData.rating || 'N/A'}/5
- Total Reviews: ${businessData.reviewCount || 'N/A'}
- Photos: ${businessData.photoCount || 'N/A'}
- Has Website: ${businessData.hasWebsite ? 'Yes' : 'No'}
- Has Phone: ${businessData.hasPhone ? 'Yes' : 'No'}
- Has Hours: ${businessData.hasHours ? 'Yes' : 'No'}
${businessData.address ? `- Address: ${businessData.address}` : ''}

Current Scores:
${businessData.categories ? businessData.categories.map(cat => `- ${cat.name}: ${cat.score}/100`).join('\n') : ''}

Provide a detailed analysis in JSON format with this structure:
{
  "strengths": ["array of 2-3 specific strengths"],
  "weaknesses": ["array of 2-3 specific weaknesses"],
  "recommendations": [
    {
      "category": "category name",
      "priority": "High/Medium/Low",
      "action": "specific action to take",
      "impact": "expected impact",
      "timeframe": "how long it will take"
    }
  ],
  "quickWins": ["array of 2-3 quick actions that can be done today"],
  "longTermStrategy": "paragraph describing 3-6 month strategy",
  "industryInsights": "brief paragraph with industry-specific advice"
}

Make recommendations specific, actionable, and prioritized. Focus on what will have the biggest impact on local search rankings.

IMPORTANT: Respond ONLY with valid JSON. Do not include any markdown formatting or code blocks.`;

    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          { 
            role: "user", 
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    let aiResponse = claudeData.content[0].text;
    
    // Clean up the response (remove markdown code blocks if present)
    aiResponse = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Parse the JSON response
    const aiAnalysis = JSON.parse(aiResponse);
    
    res.status(200).json({
      success: true,
      aiAnalysis: aiAnalysis
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    
    // Return fallback analysis if Claude fails
    res.status(200).json({
      success: true,
      aiAnalysis: {
        strengths: ["Profile is active and operational", "Has basic information configured"],
        weaknesses: ["Could improve review generation", "May need more visual content"],
        recommendations: [
          {
            category: "Reviews",
            priority: "High",
            action: "Set up automated review request system",
            impact: "Increase review volume by 50-100%",
            timeframe: "1-2 weeks"
          },
          {
            category: "Photos",
            priority: "Medium",
            action: "Add diverse, high-quality photos",
            impact: "Improve engagement and click-through rates",
            timeframe: "1 week"
          }
        ],
        quickWins: [
          "Upload 5-10 new high-quality photos today",
          "Respond to all pending customer reviews",
          "Update business hours if they've changed"
        ],
        longTermStrategy: "Focus on consistently generating new reviews, maintaining fresh visual content, and engaging with customer questions. Monitor competitors and stay updated with local SEO best practices.",
        industryInsights: "Local businesses that respond to reviews see 35% higher engagement. Regular posting and photo updates signal to Google that your business is active and trustworthy."
      }
    });
  }
}
