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

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!googleApiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Request ALL available fields for comprehensive analysis
    // Organized by category for clarity
    const fields = [
      // Basic Information
      'place_id',
      'name',
      'formatted_address',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'url',
      'business_status',
      'types',
      
      // Reviews & Ratings
      'rating',
      'user_ratings_total',
      'reviews',
      
      // Photos
      'photos',
      
      // Hours
      'opening_hours',
      'current_opening_hours',
      'secondary_opening_hours',
      
      // Pricing & Details
      'price_level',
      'editorial_summary',
      
      // Accessibility & Amenities
      'wheelchair_accessible_entrance',
      
      // Service Options (Restaurant/Food specific)
      'delivery',
      'dine_in',
      'takeout',
      'reservable',
      'serves_breakfast',
      'serves_lunch',
      'serves_dinner',
      'serves_brunch',
      'serves_beer',
      'serves_wine',
      'serves_vegetarian_food',
      
      // Additional Attributes
      'curbside_pickup',
      'outdoor_seating',
      'live_music',
      'restroom',
      'good_for_children',
      'good_for_groups',
      'allows_dogs',
      
      // Location
      'geometry',
      'vicinity',
      'plus_code',
      
      // Other
      'icon',
      'icon_background_color',
      'icon_mask_base_uri',
      'utc_offset'
    ].join(',');
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${googleApiKey}`;
    
    console.log('Fetching place details for:', placeId);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      // Log key metrics for debugging
      console.log('=== PLACE DETAILS FETCHED ===');
      console.log('Business:', data.result.name);
      console.log('Rating:', data.result.rating);
      console.log('Reviews:', data.result.user_ratings_total);
      console.log('Photos:', data.result.photos?.length || 0);
      console.log('Has Website:', !!data.result.website);
      console.log('Has Phone:', !!data.result.formatted_phone_number);
      console.log('Has Hours:', !!data.result.opening_hours);
      console.log('Business Status:', data.result.business_status);
      console.log('Attributes:', {
        delivery: data.result.delivery,
        dine_in: data.result.dine_in,
        takeout: data.result.takeout,
        reservable: data.result.reservable,
        wheelchair_accessible: data.result.wheelchair_accessible_entrance
      });
      console.log('============================');
      
      res.status(200).json({
        success: true,
        result: data.result
      });
    } else {
      console.error('Google Places API Error:', data.status, data.error_message);
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
