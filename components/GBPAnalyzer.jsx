import React, { useState } from 'react';

const GBPAnalyzer = () => {
  const [analysisMode, setAnalysisMode] = useState('manual');
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
      categories: [
        { name: "Profile Completion", score: profileScore },
        { name: "Reviews & Ratings", score: reviewScore },
        { name: "Photos & Visual Content", score: photoScore },
        { name: "Local SEO Optimization", score: 70 },
      ]
    });
    
    setShowEmailCapture(true);
    setIsAnalyzing(false);
  };

  const sendAnalysis = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
  };

  const resetApp = () => {
    setAnalysis(null);
    setShowEmailCapture(false);
    setSubmitted(false);
    setBusinessName('');
    setLocation('');
    setEmail('');
    setManualData({
      rating: '',
      reviewCount: '',
      photoCount: '',
      hasWebsite: false,
      hasPhone: false,
      hasHours: false,
      hasDescription: false,
    });
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
            <div style={{ width: '80px', height: '80px', backgroundColor: '#D1FAE5', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
              ✓
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Analysis Sent!</h2>
            <p style={{ color: '#6B7280', marginBottom: '24px' }}>
              Your GBP analysis has been sent to {email}.
            </p>
            <button 
              onClick={resetApp}
              style={{ backgroundColor: '#2563EB', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }}
            >
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
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                {businessName} - GBP Analysis
              </h2>
              <div style={{ 
                fontSize: '64px', 
                fontWeight: 'bold', 
                color: getScoreColor(analysis.overallScore),
                backgroundColor: `${getScoreColor(analysis.overallScore)}20`,
                padding: '24px 32px',
                borderRadius: '16px',
                display: 'inline-block',
                marginTop: '16px'
              }}>
                {analysis.overallScore}/100
              </div>
              <p style={{ color: '#6B7280', marginTop: '16px', fontSize: '18px' }}>Overall Google Business Profile Score</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {analysis.categories.map((category, index) => (
                <div key={index} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '16px' }}>{category.name}</h3>
                    <div style={{ 
                      backgroundColor: `${getScoreColor(category.score)}20`,
                      color: getScoreColor(category.score),
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {category.score}/100
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
              <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                Get Your Detailed Report
              </h3>
              <p style={{ color: '#6B7280' }}>
                Enter your email to receive the complete analysis
              </p>
            </div>
            
            <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', gap: '16px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{ flex: 1, padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }}
              />
              <button
                onClick={sendAnalysis}
                disabled={!email}
                style={{ 
                  backgroundColor: '#2563EB', 
                  color: 'white', 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  cursor: email ? 'pointer' : 'not-allowed', 
                  fontWeight: '500',
                  opacity: email ? 1 : 0.5
                }}
              >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#2563EB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>
              📍
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>GBP Strength Analyzer</h1>
              <p style={{ color: '#6B7280', margin: 0 }}>Optimize your Google Business Profile</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: '32px' }}>
            Manual Business Analysis
          </h2>

          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Average Rating (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={manualData.rating}
                  onChange={(e) => setManualData({...manualData, rating: e.target.value})}
                  placeholder="4.2"
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Number of Reviews
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualData.reviewCount}
                  onChange={(e) => setManualData({...manualData, reviewCount: e.target.value})}
                  placeholder="127"
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Number of Photos
              </label>
              <input
                type="number"
                min="0"
                value={manualData.photoCount}
                onChange={(e) => setManualData({...manualData, photoCount: e.target.value})}
                placeholder="15"
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '16px' }}
              />
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
                    <input
                      type="checkbox"
                      checked={manualData[item.key]}
                      onChange={(e) => setManualData({...manualData, [item.key]: e.target.checked})}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={analyzeManually}
              disabled={!businessName || isAnalyzing}
              style={{ 
                width: '100%', 
                backgroundColor: '#2563EB', 
                color: 'white', 
                padding: '16px', 
                borderRadius: '12px', 
                border: 'none', 
                cursor: (!businessName || isAnalyzing) ? 'not-allowed' : 'pointer', 
                fontWeight: '600',
                fontSize: '18px',
                opacity: (!businessName || isAnalyzing) ? 0.5 : 1
              }}
            >
              {isAnalyzing ? 'Analyzing...' : '🔍 Analyze My Business Profile'}
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Complete Analysis</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Get scored on 4 key areas of GBP optimization
              </p>
            </div>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Actionable Insights</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Specific recommendations to improve your ranking
              </p>
            </div>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
              <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Quick Results</h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Get your analysis in under 30 seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GBPAnalyzer;
