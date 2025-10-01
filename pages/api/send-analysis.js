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
    const { userEmail, businessName, analysis } = req.body;
    
    if (!userEmail || !businessName || !analysis) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, just log to console
    // Later we'll add SendGrid/Resend integration
    console.log('=== EMAIL CAPTURE ===');
    console.log('User Email:', userEmail);
    console.log('Business:', businessName);
    console.log('Score:', analysis.overallScore);
    console.log('===================');

    // TODO: Add email sending here (SendGrid/Resend)
    
    res.status(200).json({
      success: true,
      message: 'Analysis captured'
    });

  } catch (error) {
    console.error('Send analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send analysis'
    });
  }
}
