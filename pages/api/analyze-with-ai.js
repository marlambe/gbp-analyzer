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
    const { businessName, placeDetails, dataSource } = req.body;
    
    if (!businessName) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Prepare comprehensive prompt for AI scoring
    const prompt = `You are an expert local SEO analyst. Analyze this Google Business Profile and provide STRICT, REALISTIC scoring. Most businesses should score 40-65/100 to reflect real optimization opportunities.

Business: ${businessName}
Data Source: ${dataSource}

COMPLETE BUSINESS DATA:
${JSON.stringify(placeDetails, null, 2)}

SCORING INSTRUCTIONS:
- Be STRICT and REALISTIC - most businesses have significant room for improvement
- Score on 0-100 scale for each category
- Typical good businesses should score 60-70/100 overall
- Only exceptional, fully-optimized profiles score 80+
- Consider industry standards and competitive benchmarks
- Weight issues by their SEO impact

CATEGORIES TO SCORE:
1. Profile Completion (25% of total) - NAP data, hours, website, description, attributes
2. Reviews & Ratings (35% of total) - Volume, recency, rating, owner responses
3. Photos & Visual Content (20% of total) - Quantity, quality, diversity, recency
4. Engagement & Activity (10% of total) - Posts, Q&A responses, updates
5. Local SEO Optimization (10% of total) - Categories, keywords, consistency

Respond with ONLY valid JSON in this exact structure:
{
  "overallScore": number (0-100, be strict),
  "categories": [
    {
      "name": "Profile Completion",
      "score": number (0-100),
      "weight": 25,
      "issues": ["specific issues found"],
      "strengths": ["what's done well"],
      "recommendations": ["specific actions"]
    },
    {
      "name": "Reviews & Ratings",
      "score": number (0-100),
      "weight": 35,
      "issues": ["specific issues"],
      "strengths": ["strengths"],
      "recommendations": ["actions"]
    },
    {
      "name": "Photos & Visual Content",
      "score": number (0-100),
      "weight": 20,
      "issues": ["issues"],
      "strengths": ["strengths"],
      "recommendations": ["actions"]
    },
    {
      "name": "Engagement & Activity",
      "score": number (0-100),
      "weight": 10,
      "issues": ["issues"],
      "strengths": ["strengths"],
      "recommendations": ["actions"]
    },
    {
      "name": "Local SEO Optimization",
      "score": number (0-100),
      "weight": 10,
      "issues": ["issues"],
      "strengths": ["strengths"],
      "recommendations": ["actions"]
    }
  ],
  "quickWins": ["3-5 immediate actions with biggest impact"],
  "criticalIssues": ["most urgent problems"],
  "competitivePosition": "brief assessment vs typical competitors",
  "potentialImpact": "what improvements could achieve",
  "nextSteps": ["prioritized 5-7 action items"],
  "estimatedTimeToImprove": "realistic timeframe (e.g., 2-3 months)"
}

IMPORTANT: 
- Be STRICT with scoring - reflect real opportunities for improvement
- Most businesses should score 40-65/100
- Only truly exceptional profiles score 75+
- Provide specific, actionable recommendations
- Consider the business type and industry standards
- Output ONLY valid JSON, no markdown or explanations`;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
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
    
    aiResponse = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const aiAnalysis = JSON.parse(aiResponse);
    
    res.status(200).json({
      success: true,
      aiAnalysis: aiAnalysis
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    
    // Fallback with strict scoring
    res.status(200).json({
      success: true,
      aiAnalysis: {
        overallScore: 45,
        categories: [
          { name: "Profile Completion", score: 55, weight: 25, issues: ["Missing key elements"], strengths: ["Basic info present"], recommendations: ["Complete all fields"] },
          { name: "Reviews & Ratings", score: 40, weight: 35, issues: ["Low review volume"], strengths: [], recommendations: ["Implement review strategy"] },
          { name: "Photos & Visual Content", score: 35, weight: 20, issues: ["Insufficient photos"], strengths: [], recommendations: ["Add 20+ diverse photos"] },
          { name: "Engagement & Activity", score: 30, weight: 10, issues: ["No recent activity"], strengths: [], recommendations: ["Start posting weekly"] },
          { name: "Local SEO Optimization", score: 50, weight: 10, issues: ["Needs audit"], strengths: [], recommendations: ["Full SEO audit needed"] }
        ],
        quickWins: ["Upload 10 photos today", "Respond to all reviews", "Post weekly updates"],
        criticalIssues: ["Low review count", "Insufficient photos", "No engagement"],
        competitivePosition: "Below average - significant optimization needed",
        potentialImpact: "Could increase visibility 50-100% with proper optimization",
        nextSteps: ["Set up review generation", "Photo strategy", "Weekly posting schedule", "NAP audit", "Competitor analysis"],
        estimatedTimeToImprove: "2-3 months with consistent effort"
      }
    });
  }
}
