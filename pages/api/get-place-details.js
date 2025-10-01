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
    const { placeId } = req.body;
    
    if (!placeId) {
      return res.status(400).json({ error: 'Place ID required' });
    }

    // Use server-side API key from environment variables
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!googleApiKey) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    const fields = 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos,reviews,business_status';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${googleApiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      res.status(200).json({
        success: true,
        result: data.result
      });
    } else {
      res.status(400).json({
        success: false,
        error: data.error_message || `API Error: ${data.status}`
      });
    }
  } catch (error) {
    console.error('Get details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
