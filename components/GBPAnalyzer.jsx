import React, { useState } from 'react';

const GBPAnalyzer = () => {
  const [analysisMode, setAnalysisMode] = useState('manual');
  const [apiKey, setApiKey] = useState('');
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [manualData, setManualData] = useState({
    rating: '',
    reviewCount: '',
    photoCount: '',
    hasWebsite: false,
    hasPhone: false,
    hasHours: false,
    hasDescription: false,
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
      const response = await fetch('/api/search-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, location, apiKey })
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
        if (data.results.length === 0) {
          setError('No businesses found. Try different search terms.');
        }
      } else {
        setError(data.error || 'Search failed. Please check your API key.');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    }

    setIsSearching(false);
  };

  const analyzeWithAPI = async (placeId, placeName) => {
    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/get-place-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, apiKey })
      });

      const data = await response.json();

      if (data.success) {
        const placeDetails = data.result;
        const apiAnalysis = generateAPIAnalysis(placeDetails, placeName);
        setAnalysis(apiAnalysis);
        setShowEmailCapture(true);
      } else {
        setError(data.error || 'Failed to get business details');
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    }

    setIsAnalyzing(false);
  };

  const generateAPIAnalysis = (placeDetails, businessName) => {
    const categories = [];

    // Profile Completion (25%)
    let completionScore = 0;
    const completionIssues = [];
    if (placeDetails.name) completionScore += 5;
    if (placeDetails.formatted_address) completionScore += 5;
    if (placeDetails.formatted_phone_number) completionScore += 5; else completionIssues.push('Missing phone number');
    if (placeDetails.website) completionScore += 5; else completionIssues.push('No website listed');
    if (placeDetails.opening_hours) completionScore += 5; else completionIssues.push('Business hours not set');

    categories.push({
      name: 'Profile Completion',
      score: completionScore * 4,
      issues: completionIssues
    });

    // Reviews & Ratings (30%)
    let reviewScore = 0;
    const reviewIssues = [];
    const rating = placeDetails.rating || 0;
    const reviewCount = placeDetails.user_ratings_total || 0;

    if (rating >= 4.5) reviewScore += 15;
    else if (rating >= 4.0) reviewScore += 12;
    else if (rating >= 3.5) reviewScore += 8;
    else { reviewScore += 4; reviewIssues.push('Rating below 3.5 stars'); }

    if (reviewCount >= 100) reviewScore += 15;
    else if (reviewCount >= 50) reviewScore += 10;
    else if (reviewCount >= 20) reviewScore += 6;
    else { reviewScore += 2; reviewIssues.push('Need more customer reviews'); }

    categories.push({
      name: 'Reviews & Ratings',
      score: Math.round((reviewScore / 30) * 100),
      issues: reviewIssues
    });

    // Photos (20%)
    const photoCount = placeDetails.photos?.length || 0;
    const photoScore = Math.min(photoCount * 10, 100);
    const photoIssues = photoScore < 50 ? ['Need more diverse photos'] : [];

    categories.push({
      name: 'Photos & Visual Content',
      score: photoScore,
      issues: photoIssues
    });

    // Local SEO (25%)
    let seoScore = 70;
    const seoIssues = [];
    if (placeDetails.business_status !== 'OPERATIONAL') seoIssues.push('Business status issue');

    categories.push({
      name: 'Local SEO Optimization',
      score: seoScore,
      issues: seoIssues
    });

    const totalScore = categories.reduce((sum, cat) => {
      const weight = cat.name === 'Profile Completion' ? 0.25 :
                     cat.name === 'Reviews & Ratings' ? 0.30 :
                     cat.name === 'Photos & Visual Content' ? 0.20 : 0.25;
      return sum + (cat.score * weight);
    }, 0);

    return {
      overallScore: Math.round(totalScore),
      businessName: businessName,
      categories,
      dataSource: 'Google Places API',
      placeDetails: {
        rating: rating,
        reviewCount: reviewCount,
        photoCount: photoCount,
        hasWebsite: !!placeDetails.website,
        hasPhone: !!placeDetails.formatted_phone_number,
        hasHours: !!placeDetails.opening_hours,
        address: placeDetails.formatted_address
      }
    };
  };

  const analyzeManually = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const rating = parseFloat(manualData.rating) || 0;
    const reviewCount = parseInt(manualData.reviewCount) || 0;
    const photoCount = parseInt(manualData.photoCount) || 0;

    let profileScore = 20;
    if (manualData.hasWebsite) profileScore += 20;
    if (manualData.hasPhone) profileScore += 20;
    if (manualData.hasHours) profileScore += 20;
    if (manualData.hasDescription) profileScore += 20;

    let reviewScore = 0;
    if (rating >= 4.5) reviewScore += 50;
    else if (rating >= 4.0) reviewScore += 40;
    else if (rating >= 3.5) reviewScore += 25;
    if (reviewCount >= 100) reviewScore += 50;
    else if (reviewCount >= 50) reviewScore += 35;
    else if (reviewCount >= 20) reviewScore += 20;

    const photoScore = Math.min(photoCount * 5, 100);
    const overallScore = Math.round((profileScore * 0.25) + (reviewScore * 0.30) + (photoScore * 0.20) + (70 * 0.25));

    setAnalysis({
      overallScore,
      businessName,
      categories: [
        { name: 'Profile Completion', score: profileScore, issues: profileScore < 80 ? ['Missing key profile elements'] : [] },
        { name: 'Reviews & Ratings', score: reviewScore, issues: reviewScore < 70 ? ['Low review volume or rating'] : [] },
        { name: 'Photos & Visual Content', score: photoScore, issues: photoScore < 60 ? ['Insufficient visual content'] : [] },
        { name: 'Local SEO Optimization', score: 70, issues: [] }
      ],
      dataSource: 'Manual Input'
    });

    setShowEmailCapture(true);
    setIsAnalyzing(false);
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
      console.error('Send error:', err);
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

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)', padding: '20px' }}>
        <div style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#D1FAE5', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>✓</div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Analysis Sent!</h2>
            <p style={{ color: '#6B7280', marginBottom: '24px' }}>Your GBP analysis has been sent to {email}.</p>
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
        <div style={{ maxWidth: '900px', margin: '40px auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px', marginBottom: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>{analysis.businessName} - GBP Analysis</h2>
              <div style={{ fontSize: '64px', fontWeight: 'bold', color: getScoreColor(analysis.overallScore), backgroundColor: `${getScoreColor(analysis.overallScore)}20`, padding: '24px 32px', borderRadius: '16px', display: 'inline-block', marginTop: '16px' }}>
                {analysis.overallScore}/100
              </div>
              <p style={{ color: '#6B7280', marginTop: '16px', fontSize: '18px' }}>Overall Google Business Profile Score</p>
              <p style={{ color: '#2563EB', fontSize: '14px', marginTop: '8px' }}>📊 Data Source: {analysis.dataSource}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {analysis.categories.map((category, index) => (
                <div key={index} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '16px' }}>{category.name}</h3>
                    <div style={{ backgroundColor: `${getScoreColor(category.score)}20`, color: getScoreColor(category.score), padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                      {category.score}/100
                    </div>
                  </div>
                  {category.issues.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#EF4444', marginBottom: '8px' }}>Issues:</p>
                      {category.issues.map((issue, idx) => (
                        <p key={idx} style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>• {issue}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {analysis.placeDetails && (
              <div style={{ backgroundColor: '#F3F4F6', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '12px' }}>📍 Business Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px', color: '#374151' }}>
                  <div>⭐ Rating: {analysis.placeDetails.rating}/5</div>
                  <div>💬 Reviews: {analysis.placeDetails.reviewCount}</div>
                  <div>📸 Photos: {analysis.placeDetails.photoCount}</div>
                  <div>🌐 Website: {analysis.placeDetails.hasWebsite ? 'Yes' : 'No'}</div>
                  <div>📞 Phone: {analysis.placeDetails.hasPhone ? 'Yes' : 'No'}</div>
                  <div>🕐 Hours: {analysis.placeDetails.hasHours ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Get Your Detailed Report</h3>
              <p style={{ color: '#6B7280' }}>Enter your email to receive the complete analysis</p>
            </div>
            <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', gap: '16px' }}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" style={{ flex: 1, padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
              <button onClick={sendAnalysis} disabled={!email} style={{ backgroundColor: '#2563EB', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: email ? 'pointer' : 'not-allowed', fontWeight: '500', opacity: email ? 1 : 0.5 }}>
                Send Report
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#2563EB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>📍</div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>GBP Strength Analyzer</h1>
                <p style={{ color: '#6B7280', margin: 0 }}>Optimize your Google Business Profile</p>
              </div>
            </div>
            <button onClick={() => setShowApiSetup(!showApiSetup)} style={{ padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              ⚙️ API Setup
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
        {showApiSetup && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '32px', borderLeft: '4px solid #10B981' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>🔑 Google Places API Setup</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>Add your Google Places API key for real-time business data analysis.</p>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your Google Places API key" style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', marginBottom: '12px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#2563EB', textDecoration: 'underline' }}>Get API Key →</a>
              <button onClick={() => setShowApiSetup(false)} style={{ padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Close</button>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: '32px' }}>Choose Your Analysis Method</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div onClick={() => setAnalysisMode('manual')} style={{ border: analysisMode === 'manual' ? '2px solid #2563EB' : '2px solid #E5E7EB', backgroundColor: analysisMode === 'manual' ? '#EFF6FF' : 'white', borderRadius: '12px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✍️</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Manual Input</h3>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>Quick analysis based on your input</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span style={{ color: '#6B7280' }}>Speed:</span><span style={{ fontWeight: '600', color: '#10B981' }}>Fast ⚡</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span style={{ color: '#6B7280' }}>Accuracy:</span><span style={{ fontWeight: '600', color: '#F59E0B' }}>Medium 📊</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#6B7280' }}>Cost:</span><span style={{ fontWeight: '600', color: '#10B981' }}>Free 💚</span>
              </div>
            </div>

            <div onClick={() => apiKey && setAnalysisMode('api')} style={{ border: analysisMode === 'api' ? '2px solid #10B981' : '2px solid #E5E7EB', backgroundColor: analysisMode === 'api' ? '#ECFDF5' : apiKey ? 'white' : '#F9FAFB', borderRadius: '12px', padding: '24px', cursor: apiKey ? 'pointer' : 'not-allowed', opacity: apiKey ? 1 : 0.6, transition: 'all 0.2s' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Google Places API</h3>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>Real-time official Google data</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span style={{ color: '#6B7280' }}>Speed:</span><span style={{ fontWeight: '600', color: '#2563EB' }}>Medium ⏱️</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span style={{ color: '#6B7280' }}>Accuracy:</span><span style={{ fontWeight: '600', color: '#10B981' }}>High 🎯</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#6B7280' }}>Cost:</span><span style={{ fontWeight: '600', color: '#2563EB' }}>$200 Free/Mo 💎</span>
              </div>
              {!apiKey && <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px', textAlign: 'center', fontSize: '12px', color: '#92400E' }}>Add API key above to enable</div>}
            </div>
          </div>
        </div>

        {analysisMode === 'manual' ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✍️</div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Manual Business Analysis</h2>
            </div>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Business Name *</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Enter your business name" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Average Rating (1-5)</label>
                  <input type="number" min="1" max="5" step="0.1" value={manualData.rating} onChange={(e) => setManualData({...manualData, rating: e.target.value})} placeholder="4.2" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Number of Reviews</label>
                  <input type="number" min="0" value={manualData.reviewCount} onChange={(e) => setManualData({...manualData, reviewCount: e.target.value})} placeholder="127" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Number of Photos</label>
                <input type="number" min="0" value={manualData.photoCount} onChange={(e) => setManualData({...manualData, photoCount: e.target.value})} placeholder="15" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
              </div>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Profile Completeness</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    {key: 'hasWebsite', label: 'Has website URL'},
                    {key: 'hasPhone', label: 'Has phone number'},
                    {key: 'hasHours', label: 'Has business hours'},
                    {key: 'hasDescription', label: 'Has business description'}
                  ].map(item => (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={manualData[item.key]} onChange={(e) => setManualData({...manualData, [item.key]: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={analyzeManually} disabled={!businessName || isAnalyzing} style={{ width: '100%', backgroundColor: '#2563EB', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', cursor: (!businessName || isAnalyzing) ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '18px', opacity: (!businessName || isAnalyzing) ? 0.5 : 1 }}>
                {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze My Business Profile'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Google Places API Analysis</h2>
              <p style={{ color: '#6B7280' }}>Get precise analysis using official Google data</p>
            </div>

            {error && (
              <div style={{ maxWidth: '600px', margin: '0 auto 24px', padding: '16px', backgroundColor: '#FEE2E2', borderRadius: '12px', color: '#991B1B', fontSize: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Business Name *</label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Joe's Pizza" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Location *</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New York, NY" style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }} />
                </div>
              </div>

              {searchResults.length === 0 ? (
                <button onClick={searchWithAPI} disabled={!businessName || !location || !apiKey || isSearching} style={{ width: '100%', backgroundColor: '#10B981', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', cursor: (!businessName || !location || !apiKey || isSearching) ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '18px', opacity: (!businessName || !location || !apiKey || isSearching) ? 0.5 : 1 }}>
                  {isSearching ? '🔄 Searching Google...' : '🔍 Search with Google Places API'}
                </button>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>Select Your Business:</h3>
                    <button onClick={() => setSearchResults([])} style={{ padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                      New Search
                    </button>
                  </div>

                  <div style={{ space: '16px' }}>
                    {searchResults.map((place, index) => (
                      <div key={place.place_id} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '16px', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>{place.name}</h4>
                            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>{place.formatted_address || place.vicinity}</p>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6B7280' }}>
                              {place.rating && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>⭐</span>
                                  <span>{place.rating} ({place.user_ratings_total || 0} reviews)</span>
                                </div>
                              )}
                              {place.business_status && (
                                <span style={{ padding: '2px 8px', backgroundColor: place.business_status === 'OPERATIONAL' ? '#D1FAE5' : '#FEE2E2', color: place.business_status === 'OPERATIONAL' ? '#065F46' : '#991B1B', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                                  {place.business_status}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => analyzeWithAPI(place.place_id, place.name)} disabled={isAnalyzing} style={{ backgroundColor: '#10B981', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: isAnalyzing ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '15px', opacity: isAnalyzing ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                            {isAnalyzing ? '⏳ Analyzing...' : '✨ Analyze'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px', marginTop: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Complete Analysis</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Get scored on key areas of GBP optimization</p>
            </div>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Actionable Insights</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Specific recommendations to improve ranking</p>
            </div>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Quick Results</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>Get your analysis in under 30 seconds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GBPAnalyzer;
