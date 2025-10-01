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
    const { businessName, location } = req.body;
    
    if (!businessName || !location) {
      return res.status(400).json({ error: 'Business name and location required' });
    }

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!googleApiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    // Using OLD Google Places API for compatibility
    const query = encodeURIComponent(`${businessName} ${location}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${googleApiKey}`;
    
    console.log('Searching for:', `${businessName} ${location}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log(`Found ${data.results.length} results`);
      
      res.status(200).json({
        success: true,
        results: data.results.slice(0, 5)
      });
    } else {
      console.error('Google Places API Error:', data.status, data.error_message);
      res.status(400).json({
        success: false,
        error: data.error_message || `API Error: ${data.status}`
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}
