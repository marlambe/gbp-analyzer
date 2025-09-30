import React from 'react';

const GBPAnalyzer = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '32px', color: '#2563eb', marginBottom: '20px' }}>
        GBP Strength Analyzer
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>
        Optimize your Google Business Profile for better local SEO
      </p>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '40px', 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Test Page</h2>
        <p style={{ color: '#666' }}>
          If you can see this, your deployment is working! 
          The issue was with the complex component.
        </p>
        <button style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
          marginTop: '20px'
        }}>
          Click Me to Test
        </button>
      </div>
    </div>
  );
};

export default GBPAnalyzer;
