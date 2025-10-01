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

  console.log('====== API CALLED ======');

  try {
    const { businessName, placeDetails, dataSource } = req.body;
    
    if (!businessName || !placeDetails) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Extract all data
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

    console.log('=============================================');
    console.log('ANALYZING:', businessName);
    console.log('Rating:', rating, '/ 5');
    console.log('Review Count:', reviewCount);
    console.log('Photo Count:', photoCount);
    console.log('Has Website:', hasWebsite);
    console.log('Has Phone:', hasPhone);
    console.log('Has Hours:', hasHours);
    console.log('Primary Category:', primaryCategory);
    console.log('Total Categories:', categories.length);
    console.log('Reviews Available:', reviews.length);
    console.log('=============================================');

    // Calculate review metrics
    const now = Date.now() / 1000;
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60);
    const recentReviews30 = reviews.filter(r => r.time > thirtyDaysAgo).length;
    const recentReviews90 = reviews.filter(r => r.time > ninetyDaysAgo).length;
    const reviewsPerMonth = recentReviews90 > 0 ? (recentReviews90 / 3) : 0;
    const reviewsWithReplies = reviews.filter(r => r.reply).length;
    const ownerResponseRate = reviews.length > 0 ? (reviewsWithReplies / reviews.length) * 100 : 0;

    console.log('REVIEW METRICS:');
    console.log('- Reviews last 30 days:', recentReviews30);
    console.log('- Reviews last 90 days:', recentReviews90);
    console.log('- Reviews per month:', reviewsPerMonth.toFixed(2));
    console.log('- Owner responses:', reviewsWithReplies, '/', reviews.length, '=', ownerResponseRate.toFixed(1) + '%');

    // ==========================================
    // CATEGORY SCORE (0-100) - JAVASCRIPT ONLY
    // ==========================================
    const genericCategories = ['restaurant', 'store', 'shop', 'business', 'service', 'company'];
    const isGeneric = genericCategories.some(g => primaryCategory.toLowerCase().includes(g));
    let categoryScore = 50; // base
    
    if (!isGeneric && categories.length >= 3) {
      categoryScore = 90;
    } else if (!isGeneric && categories.length >= 2) {
      categoryScore = 75;
    } else if (!isGeneric) {
      categoryScore = 65;
    } else if (categories.length >= 2) {
      categoryScore = 55;
    } else {
      categoryScore = 40;
    }

    console.log('CATEGORY SCORE:', categoryScore, '(Generic?', isGeneric, ', Count:', categories.length + ')');

    // ==========================================
    // PROFILE SCORE (0-100) - JAVASCRIPT ONLY
    // ==========================================
    let profileScore = 15; // Base (has name + address)
    if (hasPhone) profileScore += 20;
    if (hasWebsite) profileScore += 25;
    if (hasHours) profileScore += 25;
    profileScore += 15; // Description/attributes estimate

    console.log('PROFILE SCORE:', profileScore, '= Base(15) + Phone(' + (hasPhone ? '20' : '0') + ') + Website(' + (hasWebsite ? '25' : '0') + ') + Hours(' + (hasHours ? '25' : '0') + ') + Misc(15)');

    // ==========================================
    // REVIEWS SCORE (0-100) - JAVASCRIPT ONLY
    // ==========================================
    
    // Rating component (max 25)
    let ratingScore = 0;
    if (rating >= 4.8) ratingScore = 25;
    else if (rating >= 4.5) ratingScore = 21;
    else if (rating >= 4.0) ratingScore = 17;
    else if (rating >= 3.5) ratingScore = 12;
    else if (rating >= 3.0) ratingScore = 8;
    else ratingScore = 5;

    // Volume component (max 35)
    let volumeScore = 0;
    if (reviewCount >= 200) volumeScore = 35;
    else if (reviewCount >= 100) volumeScore = 28;
    else if (reviewCount >= 50) volumeScore = 21;
    else if (reviewCount >= 25) volumeScore = 14;
    else if (reviewCount >= 10) volumeScore = 7;
    else volumeScore = Math.max(3, reviewCount * 0.5);

    // Velocity component (max 20)
    let velocityScore = 0;
    if (reviewsPerMonth >= 5) velocityScore = 20;
    else if (reviewsPerMonth >= 3) velocityScore = 15;
    else if (reviewsPerMonth >= 1) velocityScore = 10;
    else if (reviewsPerMonth >= 0.5) velocityScore = 6;
    else velocityScore = 2;

    // Owner response rate (max 15)
    let responseScore = 0;
    if (ownerResponseRate >= 80) responseScore = 15;
    else if (ownerResponseRate >= 60) responseScore = 12;
    else if (ownerResponseRate >= 40) responseScore = 8;
    else if (ownerResponseRate >= 20) responseScore = 4;
    else responseScore = 0;

    // Freshness bonus (max 5)
    let freshnessScore = 0;
    if (recentReviews30 >= 3) freshnessScore = 5;
    else if (recentReviews30 >= 1) freshnessScore = 3;
    else if (recentReviews90 >= 3) freshnessScore = 2;
    else freshnessScore = 0;

    const reviewsScore = Math.min(100, ratingScore + volumeScore + velocityScore + responseScore + freshnessScore);

    console.log('REVIEWS SCORE:', reviewsScore, '= Rating(' + ratingScore + ') + Volume(' + volumeScore + ') + Velocity(' + velocityScore + ') + Response(' + responseScore + ') + Fresh(' + freshnessScore + ')');

    // ==========================================
    // PHOTOS SCORE (0-100) - JAVASCRIPT ONLY
    // ==========================================
    let photoScore = 0;
    if (photoCount >= 50) photoScore = 100;
    else if (photoCount >= 30) photoScore = 85;
    else if (photoCount >= 20) photoScore = 70;
    else if (photoCount >= 10) photoScore = 50;
    else if (photoCount >= 5) photoScore = 30;
    else photoScore = photoCount * 5;

    console.log('PHOTO SCORE:', photoScore, '(Count:', photoCount + ')');

    // ==========================================
    // ENGAGEMENT SCORE (0-100) - JAVASCRIPT ONLY
    // ==========================================
    let engagementScore = 40; // Base
    
    if (ownerResponseRate >= 80) engagementScore += 25;
    else if (ownerResponseRate >= 50) engagementScore += 15;
    else if (ownerResponseRate >= 20) engagementScore += 8;
    
    if (recentReviews30 >= 3) engagementScore += 20;
    else if (recentReviews30 >= 1) engagementScore += 10;
    else if (recentReviews90 >= 3) engagementScore += 5;
    
    if (businessStatus === 'OPERATIONAL') engagementScore += 10;
    else if (businessStatus === 'CLOSED_TEMPORARILY') engagementScore -= 20;
    else if (businessStatus === 'CLOSED_PERMANENTLY') engagementScore = 0;
    
    engagementScore = Math.min(100, Math.max(0, engagementScore));

    console.log('ENGAGEMENT SCORE:', engagementScore);

    // ==========================================
    // OVERALL SCORE - WEIGHTED AVERAGE
    // ==========================================
    const overallScore = Math.round(
      (categoryScore * 0.20) +
      (profileScore * 0.20) +
      (reviewsScore * 0.35) +
      (photoScore * 0.15) +
      (engagementScore * 0.10)
    );

    console.log('=============================================');
    console.log('OVERALL SCORE:', overallScore, '/ 100');
    console.log('Breakdown: Cat(' + categoryScore + '×0.2) + Prof(' + profileScore + '×0.2) + Rev(' + reviewsScore + '×0.35) + Pho(' + photoScore + '×0.15) + Eng(' + engagementScore + '×0.1)');
    console.log('=============================================');

    // ==========================================
    // AI INSIGHTS (OPTIONAL - WON'T BREAK IF FAILS)
    // ==========================================
    let aiInsights = null;
    
    try {
      console.log('Attempting AI insights call...');
      
      const reviewText = reviews.slice(0, 5).map(r => `"${r.text}" (${r.rating}★)`).join('\n') || 'No reviews';
      
      const aiPrompt = `Analyze Google Business Profile for ${businessName}.

Category: ${primaryCategory}
Rating: ${rating}/5 (${reviewCount} reviews)
Response Rate: ${ownerResponseRate.toFixed(0)}%

Sample Reviews:
${reviewText}

Provide brief insights as JSON:
{
  "suggestedCategory": "<better category if needed, or 'Good as is'>",
  "topKeywords": ["keyword1", "keyword2", "keyword3"],
  "commonPraise": ["praise1", "praise2"],
  "commonComplaints": ["complaint1"],
  "quickWins": ["action1", "action2", "action3"]
}`;

      const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          temperature: 0.5,
          messages: [{ role: "user", content: aiPrompt }]
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        let aiText = aiData.content[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        aiInsights = JSON.parse(aiText);
        console.log('AI insights received successfully');
      } else {
        console.log('AI call failed with status:', aiResponse.status);
      }
    } catch (error) {
      console.log('AI insights failed (not critical):', error.message);
    }

    // ==========================================
    // BUILD FINAL RESPONSE
    // ==========================================
    const finalAnalysis = {
      overallScore: overallScore,
      categories: [
        {
          name: "Category Optimization",
          score: categoryScore,
          weight: 20,
          issues: isGeneric ? [`Using generic category "${primaryCategory}"`] : [],
          strengths: !isGeneric ? [`Specific category: ${primaryCategory}`] : [],
          recommendations: [
            aiInsights?.suggestedCategory || "Use most specific category possible",
            "Add 2-3 relevant secondary categories"
          ],
          categoryAnalysis: {
            primaryCategory: primaryCategory,
            primaryCategoryScore: categoryScore,
            suggestedPrimaryCategory: aiInsights?.suggestedCategory || "Optimize for specificity",
            additionalCategories: categories,
            categoryKeywordAlignment: isGeneric ? "Generic" : "Good"
          }
        },
        {
          name: "Profile Completion",
          score: profileScore,
          weight: 20,
          issues: [
            ...(!hasWebsite ? ['No website'] : []),
            ...(!hasPhone ? ['No phone'] : []),
            ...(!hasHours ? ['No hours'] : [])
          ],
          strengths: [
            ...(hasWebsite ? ['Has website'] : []),
            ...(hasPhone ? ['Has phone'] : []),
            ...(hasHours ? ['Has hours'] : [])
          ],
          recommendations: ["Complete all profile fields", "Add business description"]
        },
        {
          name: "Reviews & Ratings",
          score: reviewsScore,
          weight: 35,
          issues: [
            ...(rating < 4.5 ? [`Rating ${rating}/5 below 4.5`] : []),
            ...(reviewCount < 50 ? [`Only ${reviewCount} reviews`] : []),
            ...(reviewsPerMonth < 3 ? [`Velocity: ${reviewsPerMonth.toFixed(1)}/mo (need 3+)`] : []),
            ...(ownerResponseRate < 80 ? [`Response rate: ${ownerResponseRate.toFixed(0)}% (need 80%)`] : [])
          ],
          strengths: [
            ...(rating >= 4.5 ? [`Strong ${rating}/5 rating`] : []),
            ...(reviewCount >= 50 ? [`${reviewCount} reviews`] : []),
            ...(ownerResponseRate >= 80 ? [`${ownerResponseRate.toFixed(0)}% response rate`] : [])
          ],
          recommendations: aiInsights?.quickWins || [
            "Get 3+ reviews per month consistently",
            "Respond to ALL reviews within 24 hours",
            "Implement review request system"
          ],
          reviewVelocity: {
            reviewsPerMonth: reviewsPerMonth,
            reviewsLast30Days: recentReviews30,
            reviewsLast90Days: recentReviews90,
            velocityScore: velocityScore * 5,
            velocityRating: reviewsPerMonth >= 5 ? 'excellent' : reviewsPerMonth >= 3 ? 'good' : reviewsPerMonth >= 1 ? 'acceptable' : 'poor',
            trend: recentReviews30 > 0 ? 'active' : 'stagnant',
            ownerResponseRate: ownerResponseRate,
            responseRating: ownerResponseRate >= 80 ? 'excellent' : ownerResponseRate >= 60 ? 'good' : ownerResponseRate >= 40 ? 'needs improvement' : 'poor'
          },
          keywordAnalysis: {
            topKeywords: aiInsights?.topKeywords || ["service", "quality", "experience"],
            relevanceScore: 60,
            sentimentScore: rating * 20,
            sentimentBreakdown: { positive: rating >= 4 ? 70 : 50, neutral: 20, negative: rating >= 4 ? 10 : 30 },
            keyInsights: aiInsights?.commonPraise || ["Customer feedback analyzed"]
          }
        },
        {
          name: "Photos & Visual Content",
          score: photoScore,
          weight: 15,
          issues: photoCount < 20 ? [`Only ${photoCount} photos (need 20+)`] : [],
          strengths: photoCount >= 20 ? [`${photoCount} photos`] : [],
          recommendations: [
            `Upload ${Math.max(0, 50 - photoCount)} more photos to reach 50`,
            "Add interior, exterior, product, team photos"
          ]
        },
        {
          name: "Engagement & Reputation",
          score: engagementScore,
          weight: 10,
          issues: [
            ...(ownerResponseRate < 50 ? [`Low response rate: ${ownerResponseRate.toFixed(0)}%`] : []),
            ...(recentReviews30 === 0 ? ['No reviews last 30 days'] : [])
          ],
          strengths: [
            ...(ownerResponseRate >= 80 ? [`High response rate: ${ownerResponseRate.toFixed(0)}%`] : []),
            ...(recentReviews30 > 0 ? [`${recentReviews30} recent reviews`] : [])
          ],
          recommendations: ["Respond to ALL reviews", "Post weekly updates"],
          engagementMetrics: {
            ownerResponseRate: ownerResponseRate,
            responseRating: ownerResponseRate >= 80 ? 'excellent' : ownerResponseRate >= 60 ? 'good' : 'needs improvement',
            recentActivity: recentReviews30,
            businessStatus: businessStatus,
            serviceAttributesCount: 0,
            verificationStatus: businessStatus === 'OPERATIONAL' ? 'verified' : 'check status'
          }
        }
      ],
      quickWins: aiInsights?.quickWins || [
        `Upload ${Math.min(10, 50 - photoCount)} photos today`,
        "Respond to all unanswered reviews",
        reviewCount < 50 ? "Get 3 reviews this month" : "Maintain review momentum",
        !hasWebsite ? "Add website to profile" : "Update website regularly"
      ],
      criticalIssues: [
        ...(rating < 4.0 ? ['Low rating hurting visibility'] : []),
        ...(reviewCount < 25 ? ['Very low review count'] : []),
        ...(reviewsPerMonth < 1 ? ['Stagnant review growth'] : []),
        ...(ownerResponseRate < 40 ? ['Poor owner engagement'] : [])
      ].slice(0, 3),
      reviewInsights: {
        summary: `${businessName} has ${reviewCount} reviews with ${rating}/5 rating. ${reviewsPerMonth >= 3 ? 'Strong' : 'Needs'} review velocity.`,
        commonPraise: aiInsights?.commonPraise || ["Good service", "Quality products"],
        commonComplaints: aiInsights?.commonComplaints || [],
        keywordOpportunities: aiInsights?.topKeywords || ["service", "quality"],
        sentimentTrend: rating >= 4.5 ? 'Very positive' : rating >= 4.0 ? 'Positive' : 'Mixed',
        competitiveAdvantages: ["Analyzed from available data"]
      },
      competitivePosition: overallScore >= 75 ? "Above average - strong profile" : overallScore >= 60 ? "Average - room for improvement" : "Below average - needs optimization",
      potentialImpact: `${Math.round((85 - overallScore) / 0.5)}% visibility increase possible with optimization`,
      nextSteps: [
        ...(categoryScore < 70 ? ["Optimize primary category"] : []),
        ...(reviewCount < 50 ? ["Build to 50+ reviews"] : []),
        ...(reviewsPerMonth < 3 ? ["Increase to 3+ reviews/month"] : []),
        ...(photoCount < 20 ? ["Add 20+ photos"] : []),
        ...(ownerResponseRate < 80 ? ["Respond to ALL reviews"] : []),
        "Post weekly updates",
        "Complete all profile fields"
      ].slice(0, 7),
      estimatedTimeToImprove: overallScore < 50 ? "3-4 months" : overallScore < 70 ? "2-3 months" : "1-2 months"
    };

    console.log('Response prepared. Sending...');
    
    res.status(200).json({ success: true, aiAnalysis: finalAnalysis });

  } catch (error) {
    console.error('!!!!! CRITICAL ERROR:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
