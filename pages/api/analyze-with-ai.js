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

    // Enhanced prompt that forces AI to analyze the SPECIFIC data
    const prompt = `You are an expert local SEO consultant analyzing a Google Business Profile. You must provide a STRICT, DATA-DRIVEN analysis based ONLY on the specific metrics provided below.

BUSINESS TO ANALYZE:
Business Name: ${businessName}
Data Source: ${dataSource}
Location: ${placeDetails.location || placeDetails.formatted_address || 'Not specified'}

ACTUAL BUSINESS DATA (USE THESE EXACT NUMBERS):
- Current Rating: ${placeDetails.rating || 0}/5 stars
- Total Reviews: ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0}
- Total Photos: ${placeDetails.photos?.length || placeDetails.photoCount || 0}
- Has Website: ${placeDetails.website || placeDetails.hasWebsite ? 'YES' : 'NO'}
- Has Phone Number: ${placeDetails.formatted_phone_number || placeDetails.hasPhone ? 'YES' : 'NO'}
- Has Business Hours: ${placeDetails.opening_hours || placeDetails.hasHours ? 'YES' : 'NO'}
- Business Status: ${placeDetails.business_status || 'Unknown'}
${placeDetails.types ? `- Business Categories: ${placeDetails.types.join(', ')}` : ''}
${placeDetails.price_level ? `- Price Level: ${placeDetails.price_level}/4` : ''}
${placeDetails.editorial_summary ? `- Has Editorial Summary: YES` : '- Has Editorial Summary: NO'}
${placeDetails.wheelchair_accessible_entrance !== undefined ? `- Wheelchair Accessible: ${placeDetails.wheelchair_accessible_entrance ? 'YES' : 'NO'}` : ''}
${placeDetails.delivery !== undefined ? `- Offers Delivery: ${placeDetails.delivery ? 'YES' : 'NO'}` : ''}
${placeDetails.dine_in !== undefined ? `- Offers Dine-in: ${placeDetails.dine_in ? 'YES' : 'NO'}` : ''}
${placeDetails.takeout !== undefined ? `- Offers Takeout: ${placeDetails.takeout ? 'YES' : 'NO'}` : ''}
${placeDetails.reservable !== undefined ? `- Takes Reservations: ${placeDetails.reservable ? 'YES' : 'NO'}` : ''}
${placeDetails.serves_breakfast !== undefined ? `- Serves Breakfast: ${placeDetails.serves_breakfast ? 'YES' : 'NO'}` : ''}
${placeDetails.serves_lunch !== undefined ? `- Serves Lunch: ${placeDetails.serves_lunch ? 'YES' : 'NO'}` : ''}
${placeDetails.serves_dinner !== undefined ? `- Serves Dinner: ${placeDetails.serves_dinner ? 'YES' : 'NO'}` : ''}
${placeDetails.serves_beer !== undefined ? `- Serves Beer: ${placeDetails.serves_beer ? 'YES' : 'NO'}` : ''}
${placeDetails.serves_wine !== undefined ? `- Serves Wine: ${placeDetails.serves_wine ? 'YES' : 'NO'}` : ''}
${placeDetails.serves_vegetarian_food !== undefined ? `- Vegetarian Options: ${placeDetails.serves_vegetarian_food ? 'YES' : 'NO'}` : ''}

REVIEW ANALYSIS:
${placeDetails.reviews ? `- Total Reviews Provided: ${placeDetails.reviews.length}
- Recent Reviews Sample (Analyze these for keywords and sentiment):
${placeDetails.reviews.slice(0, 5).map((r, i) => `
  Review ${i + 1}:
  Rating: ${r.rating} stars
  Time: ${r.relative_time_description}
  Author: ${r.author_name}
  Text: "${r.text}"
  ${r.author_url ? 'Author Profile: Available' : ''}
`).join('\n')}
- Owner Response Analysis: ${placeDetails.reviews.filter(r => r.reply).length} out of ${placeDetails.reviews.length} reviews have owner responses` : '- No review details available for keyword analysis'}

CRITICAL: Analyze the review text above for:
1. KEYWORD RELEVANCE - What products/services/experiences do customers mention? Do they align with the business type?
2. SENTIMENT ANALYSIS - Overall positive/negative/mixed sentiment across reviews
3. KEYWORD PATTERNS - Repeated terms that indicate what the business is known for
4. LOCAL RELEVANCE - Do reviews mention location-specific terms, neighborhood, nearby landmarks?

ENGAGEMENT INDICATORS:
${placeDetails.user_ratings_total > 0 ? `- Review Engagement: ${placeDetails.user_ratings_total} total customer interactions` : ''}
${placeDetails.photos ? `- Photo Types Available: ${placeDetails.photos.length} photos uploaded` : ''}
${placeDetails.url ? `- Google Maps URL: Available` : '- Google Maps URL: Not available'}

CRITICAL INSTRUCTIONS:
1. Your scores MUST directly reflect the data above - different data = different scores
2. Be HARSH but FAIR - most businesses score 40-65/100 overall
3. Use these STRICT scoring guidelines:

PROFILE COMPLETION SCORING (Weight: 25%):
- Start at 0 points
- Name + Address (always present): +10 points
- Phone Number: +15 points (critical for calls)
- Website: +20 points (critical for conversions)
- Business Hours: +20 points (critical for foot traffic)
- Business Description/Editorial Summary: +10 points
- Business Attributes (delivery, dine-in, takeout, etc): +15 points (shows detailed profile)
- Service/Product Details (breakfast, lunch, dinner, etc): +10 points (helps customer decision)
Score this business based on what they ACTUALLY have.

REVIEWS & RATINGS SCORING (Weight: 35% - MOST IMPORTANT):
Rating Component (max 40 points):
- 4.8-5.0 stars: 40 points (excellent)
- 4.5-4.7 stars: 32 points (good)
- 4.0-4.4 stars: 24 points (average)
- 3.5-3.9 stars: 16 points (below average)
- 3.0-3.4 stars: 10 points (poor)
- Below 3.0: 5 points (critical issue)

Review Volume Component (max 60 points):
- 200+ reviews: 60 points (excellent)
- 100-199 reviews: 48 points (good)
- 50-99 reviews: 36 points (acceptable)
- 25-49 reviews: 24 points (needs work)
- 10-24 reviews: 12 points (poor)
- 0-9 reviews: 5 points (critical issue)

REVIEW QUALITY & RELEVANCE (NEW - CRITICAL FOR RANKING):
Analyze the actual review text provided above and adjust score based on:

Keyword Relevance (can add up to +15 bonus points):
- +15 points: Reviews contain highly relevant keywords (services, products, location-specific terms)
- +10 points: Reviews mention some relevant business aspects
- +5 points: Generic reviews with minimal business-specific keywords
- 0 points: Reviews lack specific keywords or details

Sentiment Quality (can add up to +10 bonus points):
- +10 points: Overwhelmingly positive sentiment (80%+ positive language)
- +7 points: Mostly positive sentiment (60-80% positive)
- +5 points: Mixed sentiment (40-60% positive)
- +2 points: Mostly negative sentiment (below 40% positive)
- Deduct 5 points: Many negative reviews with concerning patterns

Review Authenticity & Detail (can add up to +10 bonus points):
- +10 points: Reviews are detailed, specific, mention multiple aspects
- +5 points: Reviews have moderate detail
- +2 points: Very brief reviews (1-2 words)

Owner Response Rate (analyze from review data if available):
- Bonus: +5 points if owner responds to most reviews
- This shows active engagement and care for customers

IMPORTANT: Actually read and analyze the review text provided above. Look for:
- Product/service keywords (e.g., "pizza", "service", "atmosphere", "coffee")
- Location relevance (neighborhood names, nearby landmarks)
- Experience descriptors (fast, friendly, clean, delicious)
- Sentiment indicators (love, great, terrible, disappointing, amazing)

PHOTOS & VISUAL CONTENT (Weight: 20%):
- 50+ photos: 100 points (excellent)
- 30-49 photos: 80 points (good)
- 20-29 photos: 60 points (acceptable)
- 10-19 photos: 40 points (needs work)
- 5-9 photos: 20 points (poor)
- 0-4 photos: 10 points (critical)

ENGAGEMENT & ACTIVITY (Weight: 10%):
- Base score: 40 points
- Review Response Rate: +20 points if owner responds to reviews regularly
- Recent Reviews: +20 points if has reviews from last 30 days
- Photo Recency: +10 points if photos appear recent/updated
- Q&A Section: +10 points if has Q&A activity (we have limited visibility to this)
- Deduct 30 points if business status is not OPERATIONAL
Note: If review data shows owner engagement, adjust score accordingly

LOCAL SEO OPTIMIZATION (Weight: 10%):
- Base score: 40 points
- Multiple business categories: +15 points (helps with discovery)
- Complete business attributes: +15 points (delivery, dine-in, accessibility, etc)
- Price level set: +10 points (helps customer expectations)
- Rich business types/categories: +10 points
- NAP (Name, Address, Phone) completeness: +10 points
- Deduct 20 points if critical data missing

YOUR TASK:
Calculate exact scores for each category using the formulas above and the ACTUAL data provided. Then provide specific, actionable recommendations based on what THIS business is missing.

OUTPUT FORMAT (MUST BE VALID JSON):
{
  "overallScore": <weighted average of all categories, rounded to nearest integer>,
  "categories": [
    {
      "name": "Profile Completion",
      "score": <exact score based on what they have>,
      "weight": 25,
      "issues": ["<specific missing elements>"],
      "strengths": ["<what they have done well>"],
      "recommendations": ["<specific actions to improve>"]
    },
    {
      "name": "Reviews & Ratings",
      "score": <exact score including keyword relevance and sentiment bonuses>,
      "weight": 35,
      "issues": ["<specific issues with their numbers>"],
      "strengths": ["<what's good about their reviews>"],
      "recommendations": ["<how to get more/better reviews>"],
      "keywordAnalysis": {
        "topKeywords": ["<most mentioned products/services from reviews>"],
        "relevanceScore": <0-100 score for how relevant keywords are>,
        "sentimentScore": <0-100 overall sentiment score>,
        "sentimentBreakdown": {
          "positive": <percentage>,
          "neutral": <percentage>,
          "negative": <percentage>
        },
        "keyInsights": ["<insights about what customers actually say>"]
      }
    },
    {
      "name": "Photos & Visual Content",
      "score": <exact score based on photo count>,
      "weight": 20,
      "issues": ["<specific photo issues>"],
      "strengths": ["<what they've done well>"],
      "recommendations": ["<specific photo strategy>"]
    },
    {
      "name": "Engagement & Activity",
      "score": <estimated score>,
      "weight": 10,
      "issues": ["<engagement issues>"],
      "strengths": ["<engagement strengths>"],
      "recommendations": ["<how to improve engagement>"]
    },
    {
      "name": "Local SEO Optimization",
      "score": <estimated score>,
      "weight": 10,
      "issues": ["<SEO issues>"],
      "strengths": ["<SEO strengths>"],
      "recommendations": ["<SEO improvements>"]
    }
  ],
  "quickWins": [
    "<3-5 immediate actions specific to THIS business's gaps>"
  ],
  "criticalIssues": [
    "<most urgent problems based on their actual scores>"
  ],
  "competitivePosition": "<honest assessment comparing their numbers to industry standards>",
  "potentialImpact": "<realistic projection based on their current scores>",
  "nextSteps": [
    "<5-7 prioritized actions based on their biggest gaps>"
  ],
  "estimatedTimeToImprove": "<realistic timeframe based on current state>"
}

IMPORTANT REMINDERS:
- Use the EXACT numbers provided - Rating: ${placeDetails.rating || 0}, Reviews: ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0}, Photos: ${placeDetails.photos?.length || placeDetails.photoCount || 0}
- Different data MUST produce different scores
- ACTUALLY READ AND ANALYZE the review text provided above - this is critical for keyword and sentiment scoring
- Look for specific keywords like product names, service types, location terms, experience descriptors
- Assess sentiment by analyzing positive vs negative language in the reviews
- Identify what makes this business unique based on what customers actually say
- Be specific about what ${businessName} needs to do
- Include keyword strategy in recommendations (e.g., "encourage customers to mention [specific products/services]")
- Output ONLY valid JSON, no markdown formatting`;

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        temperature: 0.3, // Lower temperature for more consistent, data-driven responses
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
    
    // Clean up any markdown formatting
    aiResponse = aiResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const aiAnalysis = JSON.parse(aiResponse);
    
    // Log the analysis for debugging
    console.log('=== AI ANALYSIS ===');
    console.log('Business:', businessName);
    console.log('Overall Score:', aiAnalysis.overallScore);
    console.log('Rating:', placeDetails.rating || 0);
    console.log('Reviews:', placeDetails.user_ratings_total || placeDetails.reviewCount || 0);
    console.log('Photos:', placeDetails.photos?.length || placeDetails.photoCount || 0);
    console.log('==================');
    
    res.status(200).json({
      success: true,
      aiAnalysis: aiAnalysis
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    
    // Fallback analysis
    res.status(200).json({
      success: true,
      aiAnalysis: {
        overallScore: 45,
        categories: [
          { 
            name: "Profile Completion", 
            score: 55, 
            weight: 25, 
            issues: ["Missing key profile elements"], 
            strengths: ["Basic information present"], 
            recommendations: ["Complete all profile fields", "Add business description", "Verify all contact information"] 
          },
          { 
            name: "Reviews & Ratings", 
            score: 40, 
            weight: 35, 
            issues: ["Low review volume", "Need more recent reviews"], 
            strengths: [], 
            recommendations: ["Implement automated review request system", "Respond to all existing reviews", "Create review generation strategy"],
            keywordAnalysis: {
              topKeywords: ["service", "quality", "experience"],
              relevanceScore: 45,
              sentimentScore: 65,
              sentimentBreakdown: {
                positive: 65,
                neutral: 20,
                negative: 15
              },
              keyInsights: ["Limited review data available for detailed keyword analysis"]
            }
          },
          { 
            name: "Photos & Visual Content", 
            score: 35, 
            weight: 20, 
            issues: ["Insufficient photo quantity", "Missing key photo types"], 
            strengths: [], 
            recommendations: ["Upload 20+ high-quality photos", "Include interior, exterior, product, and team photos", "Add photos monthly"] 
          },
          { 
            name: "Engagement & Activity", 
            score: 30, 
            weight: 10, 
            issues: ["No recent posts", "No Q&A responses"], 
            strengths: [], 
            recommendations: ["Post weekly updates", "Enable and answer Q&A", "Share special offers and events"] 
          },
          { 
            name: "Local SEO Optimization", 
            score: 50, 
            weight: 10, 
            issues: ["Needs comprehensive SEO audit"], 
            strengths: ["Profile is active"], 
            recommendations: ["Verify NAP consistency across web", "Optimize business categories", "Build local citations"] 
          }
        ],
        quickWins: ["Upload 10 photos today", "Respond to all reviews", "Post weekly update", "Complete profile description"],
        criticalIssues: ["Low review count hurting visibility", "Insufficient photos reducing engagement", "Missing profile elements"],
        reviewInsights: {
          summary: "Limited review data available for comprehensive analysis",
          commonPraise: ["Friendly service", "Good quality"],
          commonComplaints: ["Need more customer feedback"],
          keywordOpportunities: ["business type", "location", "service"],
          sentimentTrend: "Mostly positive but needs more volume",
          competitiveAdvantages: ["Need more reviews to identify unique strengths"]
        },
        competitivePosition: "Below average - significant optimization needed to compete effectively",
        potentialImpact: "Proper optimization could increase visibility by 50-100% and drive 30-40% more customer actions",
        nextSteps: [
          "Set up automated review request system with keyword encouragement",
          "Create photo upload schedule (weekly)",
          "Complete all missing profile fields",
          "Implement weekly posting schedule",
          "Conduct NAP consistency audit",
          "Analyze top 3 competitors' review keywords",
          "Create 90-day optimization roadmap"
        ],
        estimatedTimeToImprove: "2-3 months with consistent weekly effort"
      }
    });
  }
}
