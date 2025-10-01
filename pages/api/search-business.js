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

    // Using NEW Google Places API (v1) - Text Search
    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    const requestBody = {
      textQuery: `${businessName} ${location}`,
      maxResultCount: 5,
      languageCode: 'en'
    };
    
    console.log('Searching for:', requestBody.textQuery);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.rating',
          'places.userRatingCount',
          'places.businessStatus',
          'places.types',
          'places.primaryType',
          'places.location'
        ].join(',')
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (response.ok && data.places) {
      // Transform new API format to match old format for backward compatibility
      const transformedResults = data.places.map(place => ({
        place_id: place.id,
        name: place.displayName?.text || '',
        formatted_address: place.formattedAddress || '',
        vicinity: place.formattedAddress || '',
        rating: place.rating || 0,
        user_ratings_total: place.userRatingCount || 0,
        business_status: place.businessStatus || 'OPERATIONAL',
        types: place.types || [],
        primary_type: place.primaryType || '',
        geometry: {
          location: place.location ? {
            lat: place.location.latitude,
            lng: place.location.longitude
          } : null
        }
      }));
      
      console.log(`Found ${transformedResults.length} results`);
      
      res.status(200).json({
        success: true,
        results: transformedResults
      });
    } else {
      console.error('Google Places API Error:', response.status, data);
      res.status(400).json({
        success: false,
        error: data.error?.message || `API Error: ${response.status}`
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
