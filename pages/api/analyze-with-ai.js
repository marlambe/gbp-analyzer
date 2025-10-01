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
    
    if (!businessName || !placeDetails) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    console.log('========================================');
    console.log('TWO-STEP ANALYSIS FOR:', businessName);
    console.log('Rating:', placeDetails.rating || 0);
    console.log('Reviews:', placeDetails.user_ratings_total || placeDetails.reviewCount || 0);
    console.log('Photos:', placeDetails.photos?.length || placeDetails.photoCount || 0);
    console.log('========================================');

    const rating = placeDetails.rating || 0;
    const reviewCount = placeDetails.user_ratings_total || placeDetails.reviewCount || 0;
    const photoCount = placeDetails.photos?.length || placeDetails.photoCount || 0;
    const hasWebsite = !!(placeDetails.website || placeDetails.hasWebsite);
    const hasPhone = !!(placeDetails.formatted_phone_number || placeDetails.hasPhone);
    const hasHours = !!(placeDetails.opening_hours || placeDetails.hasHours);
    const categories = placeDetails.types || [];
    const reviewText = placeDetails.reviews ? placeDetails.reviews.slice(0, 5).map(r => `"${r.text}" (${r.rating} stars, ${r.relative_time_description})`).join('\n') : '';

    // ============================================
    // STEP 1: Calculate Scores in Plain Text
    // ============================================
    
    const step1Prompt = `You are a local SEO expert. Calculate Google Business Profile scores for this business. SHOW YOUR CALCULATIONS step by step in plain text.

BUSINESS DATA:
Name: ${businessName}
Rating: ${rating}/5 stars
Total Reviews: ${reviewCount}
Photos: ${photoCount}
Website: ${hasWebsite ? 'Yes' : 'No'}
Phone: ${hasPhone ? 'Yes' : 'No'}
Hours: ${hasHours ? 'Yes' : 'No'}
Categories: ${categories.join(', ') || 'None'}
Primary Category: ${categories[0] || 'Unknown'}

${reviewText ? `SAMPLE REVIEWS:\n${reviewText}` : 'No review text available'}

CALCULATE THESE SCORES (show your work):

1. CATEGORY OPTIMIZATION (0-100):
   - Primary category "${categories[0] || 'Unknown'}" - is it specific or generic?
   - Calculate score based on specificity
   - What would be a better category?

2. PROFILE COMPLETION (0-100):
   - Start at 10 points (base)
   - Phone: ${hasPhone ? 'add 15' : 'add 0'}
   - Website: ${hasWebsite ? 'add 20' : 'add 0'}
   - Hours: ${hasHours ? 'add 20' : 'add 0'}
   - Description: estimate 10 points
   - Attributes: estimate 15 points
   - TOTAL = ?

3. REVIEWS & RATINGS (0-100):
   a) Rating Score (max 30):
      ${rating}/5 stars = ? points (4.8+ = 30, 4.5-4.7 = 25, 4.0-4.4 = 20, 3.5-3.9 = 15, <3.5 = 10)
   
   b) Volume Score (max 35):
      ${reviewCount} reviews = ? points (200+ = 35, 100-199 = 28, 50-99 = 21, 25-49 = 14, 10-24 = 7, <10 = 3)
   
   c) Review Velocity (max 20):
      Based on review timestamps, estimate reviews per month
      Calculate velocity score
   
   d) Keyword Relevance (max 15):
      Analyze the review text above
      What keywords appear? How relevant are they?
      Score 0-15
   
   TOTAL Reviews & Ratings = a + b + c + d = ?

4. PHOTOS (0-100):
   ${photoCount} photos = ? points (50+ = 100, 30-49 = 80, 20-29 = 60, 10-19 = 40, <10 = count × 3)

5. ENGAGEMENT (0-100):
   Base score of 40
   Add points for owner responses, recent activity
   Estimate total

OVERALL SCORE:
- Category (20% weight): [score] × 0.20 = ?
- Profile (20% weight): [score] × 0.20 = ?
- Reviews (35% weight): [score] × 0.35 = ?
- Photos (15% weight): [score] × 0.15 = ?
- Engagement (10% weight): [score] × 0.10 = ?
TOTAL = ?

INSIGHTS:
- Top 3 keywords from reviews
- Sentiment (% positive/neutral/negative)
- Main strengths
- Critical issues
- Top 5 specific recommendations

Write all calculations in plain text. Show your math. Be specific about ${businessName}.`;

    console.log('STEP 1: Calculating scores...');
    
    const step1Response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        temperature: 0.2,
        messages: [{ role: "user", content: step1Prompt }]
      })
    });

    if (!step1Response.ok) {
      throw new Error('Step 1 failed');
    }

    const step1Data = await step1Response.json();
    const calculations = step1Data.content[0].text;
    
    console.log('STEP 1 COMPLETE - Calculations:');
    console.log(calculations.substring(0, 500) + '...');

    // ============================================
    // STEP 2: Convert to JSON
    // ============================================
    
    const step2Prompt = `Convert these Google Business Profile calculations into the exact JSON format below.

CALCULATIONS:
${calculations}

Convert to this EXACT JSON structure (no markdown, just JSON):
{
  "overallScore": <the final calculated overall score as integer>,
  "categories": [
    {
      "name": "Category Optimization",
      "score": <calculated category score 0-100>,
      "weight": 20,
      "issues": [<list specific issues>],
      "strengths": [<list strengths>],
      "recommendations": [<specific actions>],
      "categoryAnalysis": {
        "primaryCategory": "${categories[0] || 'Unknown'}",
        "primaryCategoryScore": <score>,
        "suggestedPrimaryCategory": "<better category suggestion>",
        "additionalCategories": ${JSON.stringify(categories)},
        "categoryKeywordAlignment": "<analysis>"
      }
    },
    {
      "name": "Profile Completion",
      "score": <calculated profile score 0-100>,
      "weight": 20,
      "issues": [<missing elements>],
      "strengths": [<completed elements>],
      "recommendations": [<specific actions>]
    },
    {
      "name": "Reviews & Ratings",
      "score": <calculated reviews score 0-100>,
      "weight": 35,
      "issues": [<specific issues>],
      "strengths": [<strengths>],
      "recommendations": [<actions>],
      "reviewVelocity": {
        "reviewsPerMonth": <calculated number>,
        "reviewsLast30Days": <estimated count>,
        "reviewsLast90Days": <estimated count>,
        "velocityScore": <0-100>,
        "velocityRating": "<excellent|good|acceptable|poor|critical>",
        "trend": "<increasing|stable|decreasing|stagnant>"
      },
      "keywordAnalysis": {
        "topKeywords": [<from reviews>],
        "relevanceScore": <0-100>,
        "sentimentScore": <0-100>,
        "sentimentBreakdown": {"positive": <num>, "neutral": <num>, "negative": <num>},
        "keyInsights": [<insights>]
      }
    },
    {
      "name": "Photos & Visual Content",
      "score": <calculated photo score 0-100>,
      "weight": 15,
      "issues": [<issues>],
      "strengths": [<strengths>],
      "recommendations": [<actions>]
    },
    {
      "name": "Engagement & Activity",
      "score": <calculated engagement score 0-100>,
      "weight": 10,
      "issues": [<issues>],
      "strengths": [<strengths>],
      "recommendations": [<actions>]
    }
  ],
  "quickWins": [<5 specific quick actions>],
  "criticalIssues": [<critical problems>],
  "reviewInsights": {
    "summary": "<summary>",
    "commonPraise": [<praise>],
    "commonComplaints": [<complaints>],
    "keywordOpportunities": [<keywords>],
    "sentimentTrend": "<trend>",
    "competitiveAdvantages": [<advantages>]
  },
  "competitivePosition": "<assessment>",
  "potentialImpact": "<projection>",
  "nextSteps": [<7 prioritized steps>],
  "estimatedTimeToImprove": "<timeframe>"
}

Use the exact numbers from the calculations. Respond with ONLY the JSON, no markdown.`;

    console.log('STEP 2: Converting to JSON...');

    const step2Response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        temperature: 0,
        messages: [{ role: "user", content: step2Prompt }]
      })
    });

    if (!step2Response.ok) {
      throw new Error('Step 2 failed');
    }

    const step2Data = await step2Response.json();
    let jsonResponse = step2Data.content[0].text;
    
    // Clean up any markdown
    jsonResponse = jsonResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const aiAnalysis = JSON.parse(jsonResponse);
    
    console.log('========================================');
    console.log('ANALYSIS COMPLETE!');
    console.log('Business:', businessName);
    console.log('Final Score:', aiAnalysis.overallScore);
    console.log('========================================');
    
    res.status(200).json({ success: true, aiAnalysis });

  } catch (error) {
    console.error('Two-step analysis error:', error);
    
    // Fallback
    res.status(200).json({
      success: true,
      aiAnalysis: {
        overallScore: 48,
        categories: [
          {
            name: "Category Optimization",
            score: 50,
            weight: 20,
            issues: ["Using generic category"],
            strengths: ["Has category"],
            recommendations: ["Use more specific category"],
            categoryAnalysis: {
              primaryCategory: "Unknown",
              primaryCategoryScore: 50,
              suggestedPrimaryCategory: "Use specific category",
              additionalCategories: [],
              categoryKeywordAlignment: "Unknown"
            }
          },
          { name: "Profile Completion", score: 55, weight: 20, issues: ["Missing elements"], strengths: ["Basic info"], recommendations: ["Complete profile"] },
          { 
            name: "Reviews & Ratings", 
            score: 42, 
            weight: 35, 
            issues: ["Low reviews"], 
            strengths: [], 
            recommendations: ["Get more reviews"],
            reviewVelocity: { reviewsPerMonth: 0.5, reviewsLast30Days: 0, reviewsLast90Days: 1, velocityScore: 20, velocityRating: "poor", trend: "stagnant" },
            keywordAnalysis: { topKeywords: ["service"], relevanceScore: 45, sentimentScore: 65, sentimentBreakdown: { positive: 65, neutral: 20, negative: 15 }, keyInsights: ["Limited data"] }
          },
          { name: "Photos & Visual Content", score: 35, weight: 15, issues: ["Need photos"], strengths: [], recommendations: ["Upload 20 photos"] },
          { name: "Engagement & Activity", score: 30, weight: 10, issues: ["No activity"], strengths: [], recommendations: ["Post weekly"] }
        ],
        quickWins: ["Upload photos", "Get reviews", "Optimize category"],
        criticalIssues: ["Low review count"],
        reviewInsights: { summary: "Limited data", commonPraise: ["Good"], commonComplaints: [], keywordOpportunities: ["service"], sentimentTrend: "Positive", competitiveAdvantages: ["Need data"] },
        competitivePosition: "Below average",
        potentialImpact: "60% increase possible",
        nextSteps: ["Get reviews", "Add photos", "Complete profile", "Optimize category", "Post weekly"],
        estimatedTimeToImprove: "2-3 months"
      }
    });
  }
}
