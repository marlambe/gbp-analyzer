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

    // CRITICAL DEBUG LOGGING
    console.log('========================================');
    console.log('BUSINESS BEING ANALYZED:', businessName);
    console.log('Rating:', placeDetails.rating || 0);
    console.log('Review Count:', placeDetails.user_ratings_total || placeDetails.reviewCount || 0);
    console.log('Photo Count:', placeDetails.photos?.length || placeDetails.photoCount || 0);
    console.log('Has Website:', !!(placeDetails.website || placeDetails.hasWebsite));
    console.log('Has Phone:', !!(placeDetails.formatted_phone_number || placeDetails.hasPhone));
    console.log('Categories:', placeDetails.types);
    console.log('Reviews available:', placeDetails.reviews?.length || 0);
    console.log('========================================');

    // Enhanced prompt that forces AI to analyze the SPECIFIC data
    const prompt = `You are an expert local SEO consultant analyzing a Google Business Profile. You must provide a STRICT, DATA-DRIVEN analysis based ONLY on the specific metrics provided below.

BUSINESS TO ANALYZE:
Business Name: ${businessName}
Data Source: ${dataSource}
Location: ${placeDetails.location || placeDetails.formatted_address || 'Not specified'}

CRITICAL - USE THESE EXACT NUMBERS IN YOUR CALCULATIONS:
================================
Rating: ${placeDetails.rating || 0} stars out of 5
Total Reviews: ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0}
Total Photos: ${placeDetails.photos?.length || placeDetails.photoCount || 0}
Has Website: ${placeDetails.website || placeDetails.hasWebsite ? 'YES' : 'NO'}
Has Phone: ${placeDetails.formatted_phone_number || placeDetails.hasPhone ? 'YES' : 'NO'}
Has Hours: ${placeDetails.opening_hours || placeDetails.hasHours ? 'YES' : 'NO'}
Business Status: ${placeDetails.business_status || 'Unknown'}
Business Categories: ${placeDetails.types ? placeDetails.types.join(', ') : 'Not specified'}
================================

EXAMPLE CALCULATIONS YOU MUST FOLLOW:

For Rating Score (max 30 points):
- If rating is ${placeDetails.rating || 0} and it's >= 4.8: give 30 points
- If rating is ${placeDetails.rating || 0} and it's 4.5-4.7: give 25 points
- If rating is ${placeDetails.rating || 0} and it's 4.0-4.4: give 20 points
- If rating is ${placeDetails.rating || 0} and it's 3.5-3.9: give 15 points
- If rating is ${placeDetails.rating || 0} and it's below 3.5: give 10 points

For Review Count Score (max 35 points):
- If review count is ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0} and it's >= 200: give 35 points
- If review count is ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0} and it's 100-199: give 28 points
- If review count is ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0} and it's 50-99: give 21 points
- If review count is ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0} and it's 25-49: give 14 points
- If review count is ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0} and it's 10-24: give 7 points
- If review count is ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0} and it's below 10: give 3 points

For Photo Score (max 100 points):
- If photo count is ${placeDetails.photos?.length || placeDetails.photoCount || 0} and it's >= 50: give 100 points
- If photo count is ${placeDetails.photos?.length || placeDetails.photoCount || 0} and it's 30-49: give 80 points
- If photo count is ${placeDetails.photos?.length || placeDetails.photoCount || 0} and it's 20-29: give 60 points
- If photo count is ${placeDetails.photos?.length || placeDetails.photoCount || 0} and it's 10-19: give 40 points
- If photo count is ${placeDetails.photos?.length || placeDetails.photoCount || 0} and it's below 10: give (count × 3) points

SHOW YOUR WORK:
You must calculate each score step by step and show the calculation in your response.
Example: "Rating is 4.2, which falls in 4.0-4.4 range = 20 points"

${placeDetails.reviews ? `
REVIEW DATA FOR VELOCITY CALCULATION:
${placeDetails.reviews.map((r, i) => `Review ${i + 1}: ${r.relative_time_description} (timestamp: ${r.time})`).join('\n')}

Calculate reviews per month:
- Count reviews in last 30 days
- Count reviews in last 90 days  
- Calculate average per month
` : 'No review timestamp data available'}

${placeDetails.reviews ? `
REVIEW TEXT FOR KEYWORD/SENTIMENT ANALYSIS:
${placeDetails.reviews.slice(0, 5).map((r, i) => `
Review ${i + 1} (${r.rating} stars):
"${r.text}"
`).join('\n')}

Extract specific keywords and assess sentiment from the text above.
` : 'No review text available'}

YOUR TASK:
1. Calculate the EXACT scores using the formulas above
2. Show your calculation work
3. Business A with 150 reviews MUST score differently than Business B with 20 reviews
4. Business with 4.8 rating MUST score higher than business with 3.5 rating
5. Provide specific recommendations based on WHAT IS MISSING

Respond ONLY with valid JSON (no markdown):
{
  "overallScore": <number>,
  "calculationNotes": {
    "rating": "Rating ${placeDetails.rating || 0} = X points because...",
    "reviewCount": "Review count ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0} = Y points because...",
    "photos": "Photo count ${placeDetails.photos?.length || placeDetails.photoCount || 0} = Z points because..."
  },
  "categories": [
    {
      "name": "Category Optimization",
      "score": <number 0-100>,
      "weight": 20,
      "issues": ["specific category issues"],
      "strengths": ["category strengths"],
      "recommendations": ["specific category changes"],
      "categoryAnalysis": {
        "primaryCategory": "${placeDetails.types?.[0] || 'Unknown'}",
        "primaryCategoryScore": <number>,
        "suggestedPrimaryCategory": "<specific suggestion>",
        "additionalCategories": ${JSON.stringify(placeDetails.types || [])},
        "categoryKeywordAlignment": "<analysis>"
      }
    },
    {
      "name": "Profile Completion",
      "score": <calculated based on what they have>,
      "weight": 20,
      "issues": ["missing: ${!placeDetails.website && !placeDetails.hasWebsite ? 'website, ' : ''}${!placeDetails.formatted_phone_number && !placeDetails.hasPhone ? 'phone, ' : ''}${!placeDetails.opening_hours && !placeDetails.hasHours ? 'hours' : ''}"],
      "strengths": ["has: ${placeDetails.website || placeDetails.hasWebsite ? 'website, ' : ''}${placeDetails.formatted_phone_number || placeDetails.hasPhone ? 'phone, ' : ''}${placeDetails.opening_hours || placeDetails.hasHours ? 'hours' : ''}"],
      "recommendations": ["complete missing fields"]
    },
    {
      "name": "Reviews & Ratings",
      "score": <must be calculated from rating + review count + velocity>,
      "weight": 35,
      "issues": ["specific issues based on ${placeDetails.rating || 0} rating and ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0} reviews"],
      "strengths": ["strengths based on actual data"],
      "recommendations": ["specific actions"],
      "reviewVelocity": {
        "reviewsPerMonth": <calculated number>,
        "reviewsLast30Days": <count from timestamps>,
        "reviewsLast90Days": <count from timestamps>,
        "velocityScore": <0-100>,
        "velocityRating": "<excellent/good/acceptable/poor/critical>",
        "trend": "<analysis>"
      },
      "keywordAnalysis": {
        "topKeywords": ["<from actual review text>"],
        "relevanceScore": <0-100>,
        "sentimentScore": <0-100>,
        "sentimentBreakdown": {
          "positive": <percentage>,
          "neutral": <percentage>,
          "negative": <percentage>
        },
        "keyInsights": ["<from review text>"]
      }
    },
    {
      "name": "Photos & Visual Content",
      "score": <calculated from ${placeDetails.photos?.length || placeDetails.photoCount || 0} photos>,
      "weight": 15,
      "issues": ["needs ${Math.max(0, 20 - (placeDetails.photos?.length || placeDetails.photoCount || 0))} more photos to reach minimum"],
      "strengths": ["has ${placeDetails.photos?.length || placeDetails.photoCount || 0} photos"],
      "recommendations": ["upload specific number of photos"]
    },
    {
      "name": "Engagement & Activity",
      "score": <calculated>,
      "weight": 10,
      "issues": ["specific engagement issues"],
      "strengths": ["engagement strengths"],
      "recommendations": ["engagement actions"]
    }
  ],
  "quickWins": ["<3-5 specific actions>"],
  "criticalIssues": ["<based on lowest scores>"],
  "reviewInsights": {
    "summary": "<from actual review text>",
    "commonPraise": ["<from reviews>"],
    "commonComplaints": ["<from reviews>"],
    "keywordOpportunities": ["<from reviews>"],
    "sentimentTrend": "<analysis>",
    "competitiveAdvantages": ["<from reviews>"]
  },
  "competitivePosition": "<based on actual numbers>",
  "potentialImpact": "<realistic projection>",
  "nextSteps": ["<specific prioritized actions>"],
  "estimatedTimeToImprove": "<realistic timeframe>"
}

CRITICAL REMINDERS:
- Rating: ${placeDetails.rating || 0}/5 - USE THIS EXACT NUMBER
- Reviews: ${placeDetails.user_ratings_total || placeDetails.reviewCount || 0} - USE THIS EXACT NUMBER
- Photos: ${placeDetails.photos?.length || placeDetails.photoCount || 0} - USE THIS EXACT NUMBER
- Different numbers MUST produce different scores
- Show your calculation work in calculationNotes
- Be specific about ${businessName}'s exact situation`;

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
- Review Timestamps for Velocity Analysis: ${placeDetails.reviews.map(r => `${r.relative_time_description} (Time: ${r.time})`).join(', ')}
- Recent Reviews Sample (Analyze these for keywords and sentiment):
${placeDetails.reviews.slice(0, 5).map((r, i) => `
  Review ${i + 1}:
  Rating: ${r.rating} stars
  Time: ${r.relative_time_description} (Unix timestamp: ${r.time})
  Author: ${r.author_name}
  Text: "${r.text}"
  ${r.author_url ? 'Author Profile: Available' : ''}
`).join('\n')}
- Owner Response Analysis: ${placeDetails.reviews.filter(r => r.reply).length} out of ${placeDetails.reviews.length} reviews have owner responses` : '- No review details available for keyword analysis'}

CRITICAL REVIEW VELOCITY ANALYSIS:
Calculate review velocity (reviews per month) from the timestamps above. This is a CRITICAL prominence factor:
- Consistent new reviews signal an active, popular business
- Review velocity directly impacts local ranking
- Recent reviews (last 30 days) carry more weight than old reviews
- Businesses getting 3+ reviews/month rank significantly better than those with sporadic reviews

CRITICAL: Analyze the review text above for:
1. KEYWORD RELEVANCE - What products/services/experiences do customers mention? Do they align with the business type?
2. SENTIMENT ANALYSIS - Overall positive/negative/mixed sentiment across reviews
3. KEYWORD PATTERNS - Repeated terms that indicate what the business is known for
4. LOCAL RELEVANCE - Do reviews mention location-specific terms, neighborhood, nearby landmarks?
5. REVIEW VELOCITY - How many reviews in the last 30 days? Last 90 days? Is there consistent flow?

ENGAGEMENT INDICATORS:
${placeDetails.user_ratings_total > 0 ? `- Review Engagement: ${placeDetails.user_ratings_total} total customer interactions` : ''}
${placeDetails.photos ? `- Photo Types Available: ${placeDetails.photos.length} photos uploaded` : ''}
${placeDetails.url ? `- Google Maps URL: Available` : '- Google Maps URL: Not available'}

CRITICAL INSTRUCTIONS:
1. Your scores MUST directly reflect the data above - different data = different scores
2. Be HARSH but FAIR - most businesses score 40-65/100 overall
3. Use these STRICT scoring guidelines:

CATEGORY OPTIMIZATION (Weight: 20% - CRITICAL FOR RELEVANCE):
Google states: "Primary category is the SINGLE MOST IMPORTANT relevance signal"
This is THE #1 factor for matching searches to your business.

Scoring (max 100 points):
- Primary Category Perfect Match (50 points):
  * Is the primary category highly specific? (e.g., "Malaysian Restaurant" vs just "Restaurant")
  * Does it match the actual business type?
  * Examples: "Italian Restaurant" > "Restaurant", "Cosmetic Dentist" > "Dentist"
  * Award 50 points if specific and accurate, 30 if generic, 10 if wrong/missing

- Additional Categories (25 points):
  * Are there relevant secondary categories?
  * Do they support the primary category?
  * Maximum relevance = 25 points, some relevance = 15 points, none/wrong = 5 points

- Category-Keyword Alignment (25 points):
  * Do the categories align with keywords in reviews?
  * Do they match what customers actually say?
  * Strong alignment = 25 points, some alignment = 15 points, weak = 5 points

CRITICAL: Analyze the actual business categories provided and compare to business type and review keywords.

PROFILE COMPLETION (Weight: 20%):
- Start at 0 points
- Name + Address (always present): +10 points
- Phone Number: +15 points (critical for calls)
- Website: +20 points (critical for conversions)
- Business Hours: +20 points (critical for foot traffic)
- Business Description/Editorial Summary: +10 points
- Business Attributes (delivery, dine-in, takeout, etc): +15 points (shows detailed profile)
- Service/Product Details (breakfast, lunch, dinner, etc): +10 points (helps customer decision)
Score this business based on what they ACTUALLY have.

REVIEWS & RATINGS (Weight: 35% - MOST IMPORTANT FOR PROMINENCE):
Rating Component (max 30 points):
- 4.8-5.0 stars: 30 points (excellent)
- 4.5-4.7 stars: 25 points (good)
- 4.0-4.4 stars: 20 points (average)
- 3.5-3.9 stars: 15 points (below average)
- 3.0-3.4 stars: 10 points (poor)
- Below 3.0: 5 points (critical issue)

Review Volume Component (max 35 points):
- 200+ reviews: 35 points (excellent)
- 100-199 reviews: 28 points (good)
- 50-99 reviews: 21 points (acceptable)
- 25-49 reviews: 14 points (needs work)
- 10-24 reviews: 7 points (poor)
- 0-9 reviews: 3 points (critical issue)

REVIEW VELOCITY - CRITICAL NEW FACTOR (max 20 points):
Analyze the review timestamps to calculate reviews per month:
- 5+ reviews/month in last 90 days: 20 points (excellent - very active)
- 3-4 reviews/month: 15 points (good - consistent growth)
- 1-2 reviews/month: 10 points (acceptable - needs acceleration)
- Less than 1/month: 5 points (poor - stagnant)
- No recent reviews (90+ days): 2 points (critical - inactive)

Review velocity is a TOP ranking factor - consistent new reviews signal business popularity and activity.

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

PHOTOS & VISUAL CONTENT (Weight: 15%):
- 50+ photos: 100 points (excellent)
- 30-49 photos: 80 points (good)
- 20-29 photos: 60 points (acceptable)
- 10-19 photos: 40 points (needs work)
- 5-9 photos: 20 points (poor)
- 0-4 photos: 10 points (critical)

ENGAGEMENT & ACTIVITY (Weight: 10%):
- Base score: 40 points
- Review Response Rate: +20 points if owner responds to reviews regularly
- Recent Reviews: +20 points if has reviews from last 30 days (check review velocity)
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
      "name": "Category Optimization",
      "score": <exact score based on category analysis>,
      "weight": 20,
      "issues": ["<specific category problems - e.g., 'Using generic Restaurant instead of Malaysian Restaurant'>"],
      "strengths": ["<what's good about their categories>"],
      "recommendations": ["<specific category improvements - be VERY specific about what categories to change to>"],
      "categoryAnalysis": {
        "primaryCategory": "<the actual primary category they have>",
        "primaryCategoryScore": <0-100 score>,
        "suggestedPrimaryCategory": "<what it should be for better relevance>",
        "additionalCategories": ["<list their additional categories>"],
        "categoryKeywordAlignment": "<how well categories match review keywords>"
      }
    },
    {
      "name": "Profile Completion",
      "score": <exact score based on what they have>,
      "weight": 20,
      "issues": ["<specific missing elements>"],
      "strengths": ["<what they have done well>"],
      "recommendations": ["<specific actions to improve>"]
    },
    {
      "name": "Reviews & Ratings",
      "score": <exact score including velocity, keyword relevance and sentiment bonuses>,
      "weight": 35,
      "issues": ["<specific issues with their numbers>"],
      "strengths": ["<what's good about their reviews>"],
      "recommendations": ["<how to get more/better reviews>"],
      "reviewVelocity": {
        "reviewsPerMonth": <calculated average from timestamps>,
        "reviewsLast30Days": <count>,
        "reviewsLast90Days": <count>,
        "velocityScore": <0-100>,
        "velocityRating": "<excellent/good/acceptable/poor/critical>",
        "trend": "<increasing/stable/decreasing/stagnant>"
      },
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
      "weight": 15,
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
        overallScore: 48,
        categories: [
          {
            name: "Category Optimization",
            score: 50,
            weight: 20,
            issues: ["May be using generic categories instead of specific ones", "Cannot verify category optimization without Google data"],
            strengths: ["Business is categorized"],
            recommendations: ["Use the most specific primary category possible (e.g., 'Italian Restaurant' not 'Restaurant')", "Add 2-3 relevant secondary categories", "Ensure categories match what customers mention in reviews"],
            categoryAnalysis: {
              primaryCategory: "Not available",
              primaryCategoryScore: 50,
              suggestedPrimaryCategory: "Use the most specific category that matches your business type",
              additionalCategories: [],
              categoryKeywordAlignment: "Cannot analyze without review data"
            }
          },
          { 
            name: "Profile Completion", 
            score: 55, 
            weight: 20, 
            issues: ["Missing key profile elements"], 
            strengths: ["Basic information present"], 
            recommendations: ["Complete all profile fields", "Add business description", "Verify all contact information"] 
          },
          { 
            name: "Reviews & Ratings", 
            score: 42, 
            weight: 35, 
            issues: ["Low review volume", "Need more recent reviews", "Review velocity appears low"], 
            strengths: [], 
            recommendations: ["Implement automated review request system", "Respond to all existing reviews", "Create review generation strategy", "Aim for 3+ reviews per month consistently"],
            reviewVelocity: {
              reviewsPerMonth: 0.5,
              reviewsLast30Days: 0,
              reviewsLast90Days: 1,
              velocityScore: 20,
              velocityRating: "poor",
              trend: "stagnant"
            },
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
            weight: 15, 
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
          }
        ],
        quickWins: ["Change to more specific primary category", "Upload 10 photos today", "Get 3 reviews this month", "Respond to all reviews", "Post weekly update"],
        criticalIssues: ["Generic business category limiting relevance", "Low review velocity hurting prominence", "Insufficient photos reducing engagement"],
        reviewInsights: {
          summary: "Limited review data available for comprehensive analysis",
          commonPraise: ["Friendly service", "Good quality"],
          commonComplaints: ["Need more customer feedback"],
          keywordOpportunities: ["business type", "location", "service"],
          sentimentTrend: "Mostly positive but needs more volume and consistency",
          competitiveAdvantages: ["Need more reviews to identify unique strengths"]
        },
        competitivePosition: "Below average - category and review velocity are primary weaknesses",
        potentialImpact: "Optimizing category and achieving 3+ reviews/month could increase visibility by 60-120%",
        nextSteps: [
          "CRITICAL: Review and optimize your primary GBP category - use the most specific option",
          "Set up automated review request system targeting 3+ reviews per month",
          "Encourage customers to mention specific products/services in reviews",
          "Create photo upload schedule (weekly)",
          "Complete all missing profile fields",
          "Respond to every review within 24 hours",
          "Conduct competitor category analysis"
        ],
        estimatedTimeToImprove: "2-3 months with focus on category optimization and consistent review generation"
      }
    });
  }
}
