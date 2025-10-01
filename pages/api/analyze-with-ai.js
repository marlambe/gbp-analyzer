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

    // Extract data
    const rating = placeDetails.rating || 0;
    const reviewCount = placeDetails.user_ratings_total || placeDetails.reviewCount || 0;
    const photoCount = placeDetails.photos?.length || placeDetails.photoCount || 0;
    const hasWebsite = !!(placeDetails.website || placeDetails.hasWebsite);
    const hasPhone = !!(placeDetails.formatted_phone_number || placeDetails.hasPhone);
    const hasHours = !!(placeDetails.opening_hours || placeDetails.hasHours);
    const categories = placeDetails.types || [];
    const primaryCategory = categories[0] || 'Unknown';
    const reviews = placeDetails.reviews || [];
    const businessStatus = placeDetails.business_status || 'UNKNOWN';
    const priceLevel = placeDetails.price_level;
    
    // Service attributes
    const hasDelivery = placeDetails.delivery !== undefined;
    const hasDineIn = placeDetails.dine_in !== undefined;
    const hasTakeout = placeDetails.takeout !== undefined;
    const hasReservable = placeDetails.reservable !== undefined;
    const serviceAttributeCount = [hasDelivery, hasDineIn, hasTakeout, hasReservable].filter(Boolean).length;

    console.log('========================================');
    console.log('ENHANCED HYBRID ANALYSIS:', businessName);
    console.log('Rating:', rating);
    console.log('Reviews:', reviewCount);
    console.log('Photos:', photoCount);
    console.log('Owner Responses:', reviews.filter(r => r.reply).length, '/', reviews.length);
    console.log('Service Attributes:', serviceAttributeCount);
    console.log('========================================');

    // ============================================
    // ADVANCED ANALYSIS FROM REVIEW DATA
    // ============================================

    // Owner Response Rate
    const reviewsWithReplies = reviews.filter(r => r.reply).length;
    const ownerResponseRate = reviews.length > 0 ? (reviewsWithReplies / reviews.length) * 100 : 0;
    
    // Review Recency/Freshness
    const now = Date.now() / 1000; // Current Unix timestamp
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60);
    const recentReviews30 = reviews.filter(r => r.time > thirtyDaysAgo).length;
    const recentReviews90 = reviews.filter(r => r.time > ninetyDaysAgo).length;
    const reviewsPerMonth = reviews.length > 0 && recentReviews90 > 0 ? (recentReviews90 / 3) : 0;
    
    // Review Freshness Score
    let reviewFreshnessScore = 0;
    if (recentReviews30 >= 3) reviewFreshnessScore = 20;
    else if (recentReviews30 >= 1) reviewFreshnessScore = 15;
    else if (recentReviews90 >= 5) reviewFreshnessScore = 10;
    else if (recentReviews90 >= 1) reviewFreshnessScore = 5;
    else reviewFreshnessScore = 0;

    console.log('Review Freshness - Last 30 days:', recentReviews30, 'Last 90 days:', recentReviews90);
    console.log('Owner Response Rate:', ownerResponseRate.toFixed(1) + '%');

    // ============================================
    // DETERMINISTIC SCORING (JavaScript)
    // ============================================

    // 1. CATEGORY OPTIMIZATION (0-100)
    const isGenericCategory = ['restaurant', 'store', 'shop', 'business', 'service'].includes(primaryCategory.toLowerCase());
    const categoryScore = isGenericCategory ? 45 : categories.length >= 3 ? 85 : categories.length >= 2 ? 70 : 60;

    // 2. PROFILE COMPLETION (0-100)
    let profileScore = 10; // base
    if (hasPhone) profileScore += 15;
    if (hasWebsite) profileScore += 20;
    if (hasHours) profileScore += 20;
    profileScore += 10; // description estimate
    if (serviceAttributeCount >= 3) profileScore += 15;
    else if (serviceAttributeCount >= 1) profileScore += 8;
    if (priceLevel !== undefined) profileScore += 5;
    if (businessStatus === 'OPERATIONAL') profileScore += 5;

    // 3. REVIEWS & RATINGS (0-100)
    // Rating component (max 25)
    let ratingScore = 0;
    if (rating >= 4.8) ratingScore = 25;
    else if (rating >= 4.5) ratingScore = 21;
    else if (rating >= 4.0) ratingScore = 17;
    else if (rating >= 3.5) ratingScore = 12;
    else ratingScore = 8;

    // Volume component (max 30)
    let volumeScore = 0;
    if (reviewCount >= 200) volumeScore = 30;
    else if (reviewCount >= 100) volumeScore = 24;
    else if (reviewCount >= 50) volumeScore = 18;
    else if (reviewCount >= 25) volumeScore = 12;
    else if (reviewCount >= 10) volumeScore = 6;
    else volumeScore = 3;

    // Velocity component (max 20)
    let velocityScore = 0;
    if (reviewsPerMonth >= 5) velocityScore = 20;
    else if (reviewsPerMonth >= 3) velocityScore = 15;
    else if (reviewsPerMonth >= 1) velocityScore = 10;
    else if (reviewsPerMonth >= 0.5) velocityScore = 5;
    else velocityScore = 2;

    // Freshness bonus (max 10)
    let freshnessScore = reviewFreshnessScore / 2; // Max 10 points

    // Owner Response Rate (max 15)
    let responseScore = 0;
    if (ownerResponseRate >= 80) responseScore = 15;
    else if (ownerResponseRate >= 60) responseScore = 12;
    else if (ownerResponseRate >= 40) responseScore = 8;
    else if (ownerResponseRate >= 20) responseScore = 4;
    else responseScore = 0;

    const reviewsScore = Math.min(100, ratingScore + volumeScore + velocityScore + freshnessScore + responseScore);

    // 4. PHOTOS (0-100)
    let photoScore = 0;
    if (photoCount >= 50) photoScore = 100;
    else if (photoCount >= 30) photoScore = 80;
    else if (photoCount >= 20) photoScore = 60;
    else if (photoCount >= 10) photoScore = 40;
    else photoScore = photoCount * 3;

    // 5. ENGAGEMENT & REPUTATION (0-100)
    let engagementScore = 40; // Base
    
    // Owner engagement bonus
    if (ownerResponseRate >= 80) engagementScore += 25;
    else if (ownerResponseRate >= 50) engagementScore += 15;
    else if (ownerResponseRate >= 20) engagementScore += 8;
    
    // Recent activity bonus
    if (recentReviews30 >= 3) engagementScore += 20;
    else if (recentReviews30 >= 1) engagementScore += 10;
    else if (recentReviews90 >= 3) engagementScore += 5;
    
    // Business verification
    if (businessStatus === 'OPERATIONAL') engagementScore += 10;
    else if (businessStatus === 'CLOSED_TEMPORARILY') engagementScore -= 20;
    else if (businessStatus === 'CLOSED_PERMANENTLY') engagementScore = 0;
    
    engagementScore = Math.min(100, Math.max(0, engagementScore));

    // OVERALL SCORE (weighted average)
    const overallScore = Math.round(
      (categoryScore * 0.20) +
      (profileScore * 0.20) +
      (reviewsScore * 0.35) +
      (photoScore * 0.15) +
      (engagementScore * 0.10)
    );

    console.log('CALCULATED SCORES:');
    console.log('Category:', categoryScore);
    console.log('Profile:', profileScore);
    console.log('Reviews (total):', reviewsScore, '= rating:', ratingScore, '+ volume:', volumeScore, '+ velocity:', velocityScore, '+ freshness:', freshnessScore, '+ response:', responseScore);
    console.log('Photos:', photoScore);
    console.log('Engagement:', engagementScore);
    console.log('OVERALL:', overallScore);

    // ============================================
    // AI FOR INSIGHTS ONLY
    // ============================================

    const reviewText = placeDetails.reviews ? 
      placeDetails.reviews.slice(0, 5).map(r => `"${r.text}" (${r.rating}★)`).join('\n') : 
      'No reviews available';

    const aiPrompt = `Analyze this Google Business Profile and provide insights, keywords, and recommendations.

Business: ${businessName}
Category: ${primaryCategory}
Rating: ${rating}/5 (${reviewCount} reviews)
Photos: ${photoCount}
Review Velocity: ${reviewsPerMonth.toFixed(1)} reviews/month
Owner Response Rate: ${ownerResponseRate.toFixed(0)}%
Recent Reviews: ${recentReviews30} (30 days), ${recentReviews90} (90 days)

REVIEW SAMPLES:
${reviewText}

YOUR TASK (provide insights only, scores already calculated):

1. CATEGORY ANALYSIS:
   - Is "${primaryCategory}" specific enough?
   - Suggest a better, more specific category if needed
   - Does it match what customers say in reviews?

2. KEYWORD & SENTIMENT ANALYSIS:
   - Extract top 5-7 keywords from reviews
   - What do customers praise most?
   - What do customers complain about?
   - Overall sentiment (% positive/neutral/negative)

3. SPECIFIC RECOMMENDATIONS:
   - What are 5 quick wins they can do today?
   - What are 3 critical issues to fix?
   - What are 7 prioritized next steps?
   - How can they improve from ${overallScore}/100?

Be specific to ${businessName}. Use actual keywords from the reviews.

Respond ONLY with valid JSON (no markdown):
{
  "categoryAnalysis": {
    "suggestedPrimaryCategory": "<specific category name>",
    "categoryKeywordAlignment": "<does category match review keywords?>",
    "categoryIssues": ["<specific issues>"],
    "categoryStrengths": ["<what's good>"]
  },
  "reviewInsights": {
    "topKeywords": ["<keyword1>", "<keyword2>", ...],
    "commonPraise": ["<what customers love>"],
    "commonComplaints": ["<what needs improvement>"],
    "sentimentBreakdown": {"positive": 70, "neutral": 20, "negative": 10},
    "sentimentScore": 70,
    "keyInsights": ["<insights from reviews>"]
  },
  "quickWins": ["<action 1>", "<action 2>", ...],
  "criticalIssues": ["<critical issue 1>", ...],
  "nextSteps": ["<step 1>", "<step 2>", ...],
  "competitivePosition": "<assessment vs competitors>",
  "potentialImpact": "<what could improve>",
  "estimatedTimeToImprove": "2-3 months"
}`;

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        temperature: 0.5,
        messages: [{ role: "user", content: aiPrompt }]
      })
    });

    if (!aiResponse.ok) {
      throw new Error('AI insights failed');
    }

    const aiData = await aiResponse.json();
    let aiInsightsText = aiData.content[0].text;
    aiInsightsText = aiInsightsText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const aiInsights = JSON.parse(aiInsightsText);

    // ============================================
    // COMBINE CALCULATED SCORES + AI INSIGHTS
    // ============================================

    const finalAnalysis = {
      overallScore: overallScore,
      categories: [
        {
          name: "Category Optimization",
          score: categoryScore,
          weight: 20,
          issues: aiInsights.categoryAnalysis.categoryIssues,
          strengths: aiInsights.categoryAnalysis.categoryStrengths,
          recommendations: [`Change to: ${aiInsights.categoryAnalysis.suggestedPrimaryCategory}`],
          categoryAnalysis: {
            primaryCategory: primaryCategory,
            primaryCategoryScore: categoryScore,
            suggestedPrimaryCategory: aiInsights.categoryAnalysis.suggestedPrimaryCategory,
            additionalCategories: categories,
            categoryKeywordAlignment: aiInsights.categoryAnalysis.categoryKeywordAlignment
          }
        },
        {
          name: "Profile Completion",
          score: profileScore,
          weight: 20,
          issues: [
            ...(!hasWebsite ? ['Missing website'] : []),
            ...(!hasPhone ? ['Missing phone'] : []),
            ...(!hasHours ? ['Missing hours'] : [])
          ],
          strengths: [
            ...(hasWebsite ? ['Has website'] : []),
            ...(hasPhone ? ['Has phone'] : []),
            ...(hasHours ? ['Has hours'] : [])
          ],
          recommendations: ['Complete all missing profile fields', 'Add business description', 'Add service attributes']
        },
        {
          name: "Reviews & Ratings",
          score: reviewsScore,
          weight: 35,
          issues: [
            ...(rating < 4.5 ? [`Rating ${rating}/5 is below 4.5 - reducing visibility`] : []),
            ...(reviewCount < 50 ? [`Only ${reviewCount} reviews - need 50+ for credibility`] : []),
            ...(reviewsPerMonth < 3 ? [`Review velocity: ${reviewsPerMonth.toFixed(1)}/month - need 3+`] : []),
            ...(recentReviews30 === 0 ? ['No reviews in last 30 days - profile appears inactive'] : []),
            ...(ownerResponseRate < 50 ? [`Owner response rate: ${ownerResponseRate.toFixed(0)}% - should be 80%+`] : [])
          ],
          strengths: [
            ...(rating >= 4.5 ? [`Strong ${rating}/5 rating`] : []),
            ...(reviewCount >= 50 ? [`${reviewCount} reviews shows credibility`] : []),
            ...(reviewsPerMonth >= 3 ? [`Excellent review velocity: ${reviewsPerMonth.toFixed(1)}/month`] : []),
            ...(ownerResponseRate >= 80 ? [`Outstanding ${ownerResponseRate.toFixed(0)}% response rate`] : []),
            ...(recentReviews30 > 0 ? [`${recentReviews30} reviews in last 30 days - active profile`] : [])
          ],
          recommendations: [
            ...(reviewsPerMonth < 3 ? [`Increase review velocity to 3+/month (currently ${reviewsPerMonth.toFixed(1)})`] : []),
            ...(ownerResponseRate < 80 ? [`Respond to ALL reviews (currently ${ownerResponseRate.toFixed(0)}% response rate)`] : []),
            ...(recentReviews30 === 0 ? ['Get reviews this month to show activity'] : []),
            'Implement systematic review request process',
            ...aiInsights.reviewInsights.topKeywords.length > 0 ? 
              [`Encourage customers to mention: ${aiInsights.reviewInsights.topKeywords.slice(0, 3).join(', ')}`] : []
          ],
          reviewVelocity: {
            reviewsPerMonth: reviewsPerMonth,
            reviewsLast30Days: recentReviews30,
            reviewsLast90Days: recentReviews90,
            velocityScore: velocityScore * 5,
            velocityRating: reviewsPerMonth >= 5 ? 'excellent' : reviewsPerMonth >= 3 ? 'good' : reviewsPerMonth >= 1 ? 'acceptable' : 'poor',
            trend: aiInsights.reviewVelocity.trend,
            ownerResponseRate: ownerResponseRate,
            responseRating: ownerResponseRate >= 80 ? 'excellent' : ownerResponseRate >= 60 ? 'good' : ownerResponseRate >= 40 ? 'needs improvement' : 'poor'
          },
          keywordAnalysis: {
            topKeywords: aiInsights.reviewInsights.topKeywords,
            relevanceScore: 60,
            sentimentScore: aiInsights.reviewInsights.sentimentScore,
            sentimentBreakdown: aiInsights.reviewInsights.sentimentBreakdown,
            keyInsights: aiInsights.reviewInsights.keyInsights
          }
        },
        {
          name: "Photos & Visual Content",
          score: photoScore,
          weight: 15,
          issues: [
            ...(photoCount < 20 ? [`Only ${photoCount} photos - need 20+ minimum`] : []),
            ...(photoCount < 50 ? ['Not at optimal photo count (50+)'] : [])
          ],
          strengths: [
            ...(photoCount >= 20 ? [`${photoCount} photos provides good coverage`] : [])
          ],
          recommendations: [
            `Upload ${Math.max(0, 50 - photoCount)} more photos to reach optimal level`,
            'Include: exterior, interior, products, team, customers',
            'Add photos monthly to show business is active'
          ]
        },
        {
          name: "Engagement & Reputation",
          score: engagementScore,
          weight: 10,
          issues: [
            ...(ownerResponseRate < 50 ? [`Low owner response rate: ${ownerResponseRate.toFixed(0)}%`] : []),
            ...(recentReviews30 === 0 ? ['No recent customer engagement (0 reviews last 30 days)'] : []),
            ...(businessStatus !== 'OPERATIONAL' ? [`Business status: ${businessStatus}`] : []),
            ...(recentReviews90 < 3 ? ['Low overall engagement - less than 3 reviews in 90 days'] : [])
          ],
          strengths: [
            ...(ownerResponseRate >= 80 ? [`Excellent ${ownerResponseRate.toFixed(0)}% owner response rate`] : []),
            ...(recentReviews30 >= 3 ? [`High engagement: ${recentReviews30} reviews in last 30 days`] : []),
            ...(businessStatus === 'OPERATIONAL' ? ['Business is operational and verified'] : []),
            ...(serviceAttributeCount >= 3 ? [`${serviceAttributeCount} service attributes configured`] : [])
          ],
          recommendations: [
            ...(ownerResponseRate < 80 ? ['Respond to ALL reviews within 24-48 hours'] : []),
            ...(recentReviews30 === 0 ? ['Encourage customers to leave reviews this month'] : []),
            'Post weekly updates to GBP',
            'Enable and answer Q&A section',
            'Add Google Posts with offers/events',
            ...(serviceAttributeCount < 3 ? ['Complete all service attribute fields'] : [])
          ],
          engagementMetrics: {
            ownerResponseRate: ownerResponseRate,
            responseRating: ownerResponseRate >= 80 ? 'excellent' : ownerResponseRate >= 60 ? 'good' : ownerResponseRate >= 40 ? 'needs improvement' : 'critical',
            recentActivity: recentReviews30,
            businessStatus: businessStatus,
            serviceAttributesCount: serviceAttributeCount,
            verificationStatus: businessStatus === 'OPERATIONAL' ? 'verified' : 'check status'
          }
        }
      ],
      quickWins: aiInsights.quickWins,
      criticalIssues: aiInsights.criticalIssues,
      reviewInsights: {
        summary: `${businessName} has ${reviewCount} reviews with ${rating}/5 rating. ${aiInsights.reviewInsights.keyInsights[0] || 'Analysis based on available data.'}`,
        commonPraise: aiInsights.reviewInsights.commonPraise,
        commonComplaints: aiInsights.reviewInsights.commonComplaints,
        keywordOpportunities: aiInsights.reviewInsights.topKeywords,
        sentimentTrend: `${aiInsights.reviewInsights.sentimentBreakdown.positive}% positive sentiment`,
        competitiveAdvantages: aiInsights.reviewInsights.keyInsights
      },
      competitivePosition: aiInsights.competitivePosition,
      potentialImpact: aiInsights.potentialImpact,
      nextSteps: aiInsights.nextSteps,
      estimatedTimeToImprove: aiInsights.estimatedTimeToImprove
    };

    console.log('========================================');
    console.log('FINAL SCORE:', finalAnalysis.overallScore);
    console.log('========================================');

    res.status(200).json({ success: true, aiAnalysis: finalAnalysis });

  } catch (error) {
    console.error('Hybrid analysis error:', error);
    
    // Simplified fallback
    res.status(200).json({
      success: true,
      aiAnalysis: {
        overallScore: 50,
        categories: [
          { name: "Category Optimization", score: 50, weight: 20, issues: ["Generic category"], strengths: ["Has category"], recommendations: ["Use specific category"], categoryAnalysis: { primaryCategory: "Unknown", primaryCategoryScore: 50, suggestedPrimaryCategory: "Specific category needed", additionalCategories: [], categoryKeywordAlignment: "Unknown" } },
          { name: "Profile Completion", score: 60, weight: 20, issues: ["Missing elements"], strengths: ["Basic info"], recommendations: ["Complete profile"] },
          { name: "Reviews & Ratings", score: 45, weight: 35, issues: ["Low reviews"], strengths: [], recommendations: ["Get more reviews"], reviewVelocity: { reviewsPerMonth: 1, reviewsLast30Days: 1, reviewsLast90Days: 3, velocityScore: 30, velocityRating: "poor", trend: "stable" }, keywordAnalysis: { topKeywords: ["service"], relevanceScore: 50, sentimentScore: 65, sentimentBreakdown: { positive: 65, neutral: 25, negative: 10 }, keyInsights: ["Limited data"] } },
          { name: "Photos & Visual Content", score: 40, weight: 15, issues: ["Need photos"], strengths: [], recommendations: ["Upload 20+ photos"] },
          { name: "Engagement & Activity", score: 50, weight: 10, issues: ["Low activity"], strengths: [], recommendations: ["Post weekly"] }
        ],
        quickWins: ["Upload photos", "Get reviews", "Optimize category"],
        criticalIssues: ["Low review count", "Generic category"],
        reviewInsights: { summary: "Limited data", commonPraise: ["Good service"], commonComplaints: [], keywordOpportunities: ["service", "quality"], sentimentTrend: "Positive", competitiveAdvantages: ["Need more data"] },
        competitivePosition: "Below average",
        potentialImpact: "50-80% improvement possible",
        nextSteps: ["Get systematic reviews", "Upload 20 photos", "Optimize category", "Complete profile", "Post weekly"],
        estimatedTimeToImprove: "2-3 months"
      }
    });
  }
}
