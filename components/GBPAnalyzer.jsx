import React, { useState } from 'react';

const GBPAnalyzer = () => {
  const [analysisMode, setAnalysisMode] = useState('manual');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [manualData, setManualData] = useState({
    rating: '', reviewCount: '', photoCount: '', hasWebsite: false, hasPhone: false, hasHours: false, hasDescription: false,
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const searchWithAPI = async () => {
    if (!businessName || !location) {
      setError('Please enter both business name and location');
      return;
    }
    setIsSearching(true);
    setError('');
    setSearchResults([]);
    try {
      const res = await fetch('/api/search-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, location })
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
        if (data.results.length === 0) setError('No businesses found. Try different search terms.');
      } else {
        setError(data.error || 'Search failed.');
      }
    } catch (err) {
      setError('Search failed.');
    }
    setIsSearching(false);
  };

  const analyzeWithAPI = async (placeId, placeName) => {
    setIsAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/get-place-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId })
      });
      const data = await res.json();
      if (data.success) {
        await getAIAnalysis(placeName, data.result, 'Google Places API');
      } else {
        setError(data.error || 'Failed to get details');
      }
    } catch (err) {
      setError('Analysis failed.');
    }
    setIsAnalyzing(false);
  };

  const analyzeManually = async () => {
    if (!businessName) {
      setError('Please enter business name');
      return;
    }
    setIsAnalyzing(true);
    setError('');
    
    const placeDetails = {
      rating: parseFloat(manualData.rating) || 0,
      reviewCount: parseInt(manualData.reviewCount) || 0,
      photoCount: parseInt(manualData.photoCount) || 0,
      hasWebsite: manualData.hasWebsite,
      hasPhone: manualData.hasPhone,
      hasHours: manualData.hasHours,
      hasDescription: manualData.hasDescription,
      location: location
    };
    
    await getAIAnalysis(businessName, placeDetails, 'Manual Input');
    setIsAnalyzing(false);
  };

  const getAIAnalysis = async (bn, placeDetails, dataSource) => {
    try {
      const res = await fetch('/api/analyze-with-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessName: bn, 
          placeDetails: placeDetails, 
          dataSource: dataSource 
        })
      });
      const data = await res.json();
      
      if (data.success && data.aiAnalysis) {
        const aiAnalysis = data.aiAnalysis;
        
        const transformedAnalysis = {
          overallScore: aiAnalysis.overallScore,
          businessName: bn,
          dataSource: dataSource,
          categories: aiAnalysis.categories.map(cat => ({
            name: cat.name,
            score: cat.score,
            issues: cat.issues || [],
            strengths: cat.strengths || [],
            recommendations: cat.recommendations || []
          })),
          placeDetails: {
            rating: placeDetails.rating || placeDetails.user_ratings_total || 0,
            reviewCount: placeDetails.reviewCount || placeDetails.user_ratings_total || 0,
            photoCount: placeDetails.photoCount || (placeDetails.photos ? placeDetails.photos.length : 0) || 0,
            hasWebsite: placeDetails.hasWebsite || !!placeDetails.website,
            hasPhone: placeDetails.hasPhone || !!placeDetails.formatted_phone_number,
            hasHours: placeDetails.hasHours || !!placeDetails.opening_hours,
            address: placeDetails.formatted_address || placeDetails.location || ''
          },
          quickWins: aiAnalysis.quickWins || [],
          criticalIssues: aiAnalysis.criticalIssues || [],
          competitivePosition: aiAnalysis.competitivePosition || '',
          potentialImpact: aiAnalysis.potentialImpact || '',
          nextSteps: aiAnalysis.nextSteps || [],
          estimatedTimeToImprove: aiAnalysis.estimatedTimeToImprove || ''
        };
        
        setAnalysis(transformedAnalysis);
        setShowEmailCapture(true);
      } else {
        setError('AI analysis failed. Please try again.');
      }
    } catch (err) {
      console.error('AI error:', err);
      setError('Failed to get AI analysis.');
    }
  };

  const sendAnalysis = async () => {
    try {
      await fetch('/api/send-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email, businessName: analysis.businessName, analysis })
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitted(true);
    }
  };

  const resetApp = () => {
    setAnalysis(null);
    setShowEmailCapture(false);
    setSubmitted(false);
    setBusinessName('');
    setLocation('');
    setEmail('');
    setSearchResults([]);
    setError('');
    setManualData({ rating: '', reviewCount: '', photoCount: '', hasWebsite: false, hasPhone: false, hasHours: false, hasDescription: false });
  };

  const getScoreColor = (s) => {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#F59E0B';
    return '#EF4444';
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)', padding: '20px' }}>
        <div style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#D1FAE5', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>✓</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Analysis Sent!</h2>
            <p style={{ color: '#6B7280', marginBottom: '24px' }}>Your AI-powered GBP analysis has been sent to {email}.</p>
            <button onClick={resetApp} style={{ backgroundColor: '#2563EB', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}>
              Analyze Another Business
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showEmailCapture && analysis) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '40px auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px', marginBottom: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>{analysis.businessName}</h2>
              <div style={{ fontSize: '64px', fontWeight: 'bold', color: getScoreColor(analysis.overallScore), backgroundColor: getScoreColor(analysis.overallScore) + '20', padding: '24px 32px', borderRadius: '16px', display: 'inline-block', marginTop: '16px' }}>
                {analysis.overallScore}/100
              </div>
              <p style={{ color: '#6B7280', marginTop: '16px', fontSize: '18px' }}>Overall Score</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '8px 16px', backgroundColor: '#EFF6FF', borderRadius: '20px' }}>
                <span>🤖</span><span style={{ color: '#2563EB', fontSize: '14px', fontWeight: '500' }}>AI-Powered Analysis</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {analysis.categories.map((c, i) => (
                <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '16px' }}>{c.name}</h3>
                    <div style={{ backgroundColor: getScoreColor(c.score) + '20', color: getScoreColor(c.score), padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                      {c.score}/100
                    </div>
                  </div>
                  {c.strengths && c.strengths.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#10B981', marginBottom: '4px' }}>Strengths:</p>
                      {c.strengths.map((str, idx) => (
                        <p key={idx} style={{ fontSize: '13px', color: '#059669', marginBottom: '4px' }}>✓ {str}</p>
                      ))}
                    </div>
                  )}
                  {c.issues && c.issues.length > 0 && (
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#EF4444', marginBottom: '4px' }}>Issues:</p>
                      {c.issues.map((iss, idx) => (
                        <p key={idx} style={{ fontSize: '13px', color: '#DC2626', marginBottom: '4px' }}>• {iss}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {analysis.placeDetails && (
              <div style={{ backgroundColor: '#F3F4F6', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
                <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '12px' }}>📍 Business Info</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px', color: '#374151' }}>
                  <div>⭐ {analysis.placeDetails.rating}/5</div>
                  <div>💬 {analysis.placeDetails.reviewCount} reviews</div>
                  <div>📸 {analysis.placeDetails.photoCount} photos</div>
                  <div>🌐 Website: {analysis.placeDetails.hasWebsite ? 'Yes' : 'No'}</div>
                  <div>📞 Phone: {analysis.placeDetails.hasPhone ? 'Yes' : 'No'}</div>
                  <div>🕐 Hours: {analysis.placeDetails.hasHours ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}

            {analysis.quickWins && analysis.quickWins.length > 0 && (
              <div style={{ backgroundColor: '#DBEAFE', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid #BFDBFE' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1E40AF', marginBottom: '16px' }}>⚡ Quick Wins</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                  {analysis.quickWins.map((w, i) => (
                    <div key={i} style={{ backgroundColor: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', color: '#1E40AF' }}>
                      ✨ {w}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.reviewInsights && (
              <div style={{ backgroundColor: '#F0FDF4', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid #BBF7D0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>💬</span>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#166534' }}>Review Insights & Keyword Analysis</h4>
                </div>
                
                {analysis.reviewInsights.summary && (
                  <p style={{ fontSize: '15px', color: '#166534', marginBottom: '20px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', fontStyle: 'italic' }}>
                    "{analysis.reviewInsights.summary}"
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  {analysis.reviewInsights.commonPraise && analysis.reviewInsights.commonPraise.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '15px', fontWeight: '600', color: '#15803D', marginBottom: '12px' }}>👍 What Customers Love</h5>
                      {analysis.reviewInsights.commonPraise.map((praise, i) => (
                        <p key={i} style={{ fontSize: '13px', color: '#166534', marginBottom: '6px' }}>✓ {praise}</p>
                      ))}
                    </div>
                  )}
                  
                  {analysis.reviewInsights.commonComplaints && analysis.reviewInsights.commonComplaints.length > 0 && (
                    <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
                      <h5 style={{ fontSize: '15px', fontWeight: '600', color: '#B91C1C', marginBottom: '12px' }}>👎 Areas to Address</h5>
                      {analysis.reviewInsights.commonComplaints.map((complaint, i) => (
                        <p key={i} style={{ fontSize: '13px', color: '#991B1B', marginBottom: '6px' }}>• {complaint}</p>
                      ))}
                    </div>
                  )}
                </div>

                {analysis.reviewInsights.keywordOpportunities && analysis.reviewInsights.keywordOpportunities.length > 0 && (
                  <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '15px', fontWeight: '600', color: '#166534', marginBottom: '12px' }}>🔑 Keyword Opportunities</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {analysis.reviewInsights.keywordOpportunities.map((keyword, i) => (
                        <span key={i} style={{ backgroundColor: '#BBF7D0', color: '#166534', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: '500' }}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.reviewInsights.competitiveAdvantages && analysis.reviewInsights.competitiveAdvantages.length > 0 && (
                  <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
                    <h5 style={{ fontSize: '15px', fontWeight: '600', color: '#166534', marginBottom: '12px' }}>🌟 Competitive Advantages</h5>
                    {analysis.reviewInsights.competitiveAdvantages.map((adv, i) => (
                      <p key={i} style={{ fontSize: '13px', color: '#166534', marginBottom: '6px' }}>⭐ {adv}</p>
                    ))}
                  </div>
                )}

                {analysis.reviewInsights.sentimentTrend && (
                  <p style={{ fontSize: '13px', color: '#166534', marginTop: '16px', textAlign: 'center', fontStyle: 'italic' }}>
                    Sentiment Trend: {analysis.reviewInsights.sentimentTrend}
                  </p>
                )}
              </div>
            )}

            {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
              <div style={{ backgroundColor: '#FEE2E2', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid #FECACA' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#991B1B', marginBottom: '16px' }}>🚨 Critical Issues</h4>
                {analysis.criticalIssues.map((issue, i) => (
                  <p key={i} style={{ fontSize: '14px', color: '#991B1B', marginBottom: '8px' }}>• {issue}</p>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {analysis.competitivePosition && (
                <div style={{ backgroundColor: '#F3F4F6', borderRadius: '12px', padding: '24px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>🎯 Competitive Position</h4>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>{analysis.competitivePosition}</p>
                </div>
              )}
              {analysis.potentialImpact && (
                <div style={{ backgroundColor: '#FEF3C7', borderRadius: '12px', padding: '24px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>💡 Potential Impact</h4>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>{analysis.potentialImpact}</p>
                </div>
              )}
            </div>

            {analysis.nextSteps && analysis.nextSteps.length > 0 && (
              <div style={{ backgroundColor: 'white', border: '2px solid #E5E7EB', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>📋 Next Steps</h4>
                {analysis.nextSteps.map((step, i) => (
                  <div key={i} style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid #2563EB' }}>
                    <p style={{ fontSize: '14px', color: '#374151' }}>{i + 1}. {step}</p>
                  </div>
                ))}
                {analysis.estimatedTimeToImprove && (
                  <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '16px', fontStyle: 'italic' }}>
                    ⏱️ Estimated time to improve: {analysis.estimatedTimeToImprove}
                  </p>
                )}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Get Complete Report</h3>
              <p style={{ color: '#6B7280' }}>Receive full AI analysis with action plan</p>
            </div>
            <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', gap: '16px' }}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" style={{ flex: 1, padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
              <button onClick={sendAnalysis} disabled={!email} style={{ backgroundColor: '#2563EB', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: email ? 'pointer' : 'not-allowed', fontWeight: '500', opacity: email ? 1 : 0.5 }}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#2563EB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📍</div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>GBP Strength Analyzer</h1>
              <p style={{ color: '#6B7280', margin: 0 }}>AI-Powered Optimization</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: '32px' }}>Choose Analysis Method</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div onClick={() => setAnalysisMode('manual')} style={{ border: analysisMode === 'manual' ? '2px solid #2563EB' : '2px solid #E5E7EB', backgroundColor: analysisMode === 'manual' ? '#EFF6FF' : 'white', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✍️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Manual Input</h3>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>Quick AI analysis</p>
              </div>
            </div>
            <div onClick={() => setAnalysisMode('api')} style={{ border: analysisMode === 'api' ? '2px solid #10B981' : '2px solid #E5E7EB', backgroundColor: analysisMode === 'api' ? '#ECFDF5' : 'white', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Google Places API</h3>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>Real data + AI</p>
              </div>
            </div>
          </div>
        </div>

        {analysisMode === 'manual' ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✍️</div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Manual Analysis</h2>
              <p style={{ color: '#6B7280' }}>🤖 Powered by Claude AI</p>
            </div>
            
            {error && (
              <div style={{ maxWidth: '600px', margin: '0 auto 24px', padding: '16px', backgroundColor: '#FEE2E2', borderRadius: '12px', color: '#991B1B', fontSize: '14px' }}>
                ⚠️ {error}
              </div>
            )}
            
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Business Name *</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Enter business name" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Rating (1-5)</label>
                  <input type="number" min="1" max="5" step="0.1" value={manualData.rating} onChange={(e) => setManualData({...manualData, rating: e.target.value})} placeholder="4.2" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Reviews</label>
                  <input type="number" min="0" value={manualData.reviewCount} onChange={(e) => setManualData({...manualData, reviewCount: e.target.value})} placeholder="127" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Photos</label>
                <input type="number" min="0" value={manualData.photoCount} onChange={(e) => setManualData({...manualData, photoCount: e.target.value})} placeholder="15" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
              </div>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Profile</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[{key: 'hasWebsite', label: 'Website'}, {key: 'hasPhone', label: 'Phone'}, {key: 'hasHours', label: 'Hours'}, {key: 'hasDescription', label: 'Description'}].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={manualData[item.key]} onChange={(e) => setManualData({...manualData, [item.key]: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={analyzeManually} disabled={!businessName || isAnalyzing} style={{ width: '100%', backgroundColor: '#2563EB', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', cursor: (!businessName || isAnalyzing) ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '18px', opacity: (!businessName || isAnalyzing) ? 0.5 : 1 }}>
                {isAnalyzing ? '🤖 AI Analyzing...' : '🔍 Get AI Analysis'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Google Places API</h2>
              <p style={{ color: '#6B7280' }}>Real data + 🤖 AI</p>
            </div>

            {error && (
              <div style={{ maxWidth: '600px', margin: '0 auto 24px', padding: '16px', backgroundColor: '#FEE2E2', borderRadius: '12px', color: '#991B1B', fontSize: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Business *</label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Joe's Pizza" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Location *</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New York, NY" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
                </div>
              </div>

              {searchResults.length === 0 ? (
                <button onClick={searchWithAPI} disabled={!businessName || !location || isSearching} style={{ width: '100%', backgroundColor: '#10B981', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', cursor: (!businessName || !location || isSearching) ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '18px', opacity: (!businessName || !location || isSearching) ? 0.5 : 1 }}>
                  {isSearching ? '🔄 Searching...' : '🔍 Search Google'}
                </button>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Select Business:</h3>
                    <button onClick={() => setSearchResults([])} style={{ padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      New Search
                    </button>
                  </div>
                  {searchResults.map((p) => (
                    <div key={p.place_id} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '16px', backgroundColor: 'white' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>{p.name}</h4>
                          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>{p.formatted_address || p.vicinity}</p>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6B7280' }}>
                            {p.rating && <span>⭐ {p.rating} ({p.user_ratings_total || 0})</span>}
                            {p.business_status && (
                              <span style={{ padding: '2px 8px', backgroundColor: p.business_status === 'OPERATIONAL' ? '#D1FAE5' : '#FEE2E2', color: p.business_status === 'OPERATIONAL' ? '#065F46' : '#991B1B', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                                {p.business_status}
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => analyzeWithAPI(p.place_id, p.name)} disabled={isAnalyzing} style={{ backgroundColor: '#10B981', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: isAnalyzing ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '15px', opacity: isAnalyzing ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                          {isAnalyzing ? '🤖...' : '✨ Analyze'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px', marginTop: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>AI Insights</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Personalized recommendations</p>
            </div>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Quick Wins</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Actions you can do today</p>
            </div>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Strategy</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>3-6 month improvement plan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GBPAnalyzer;
