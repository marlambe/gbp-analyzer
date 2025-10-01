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

    // Using NEW Google Places API (v1)
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    
    console.log('Fetching place details for:', placeId);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': [
          // Basic Information
          'id',
          'displayName',
          'formattedAddress',
          'nationalPhoneNumber',
          'internationalPhoneNumber',
          'websiteUri',
          'googleMapsUri',
          'businessStatus',
          'types',
          'primaryType',
          'primaryTypeDisplayName',
          
          // Reviews & Ratings
          'rating',
          'userRatingCount',
          'reviews',
          
          // Photos
          'photos',
          
          // Hours
          'regularOpeningHours',
          'currentOpeningHours',
          
          // Pricing
          'priceLevel',
          'editorialSummary',
          
          // Accessibility & Amenities
          'accessibilityOptions',
          
          // Service Options
          'delivery',
          'dineIn',
          'takeout',
          'reservable',
          'servesBreakfast',
          'servesLunch',
          'servesDinner',
          'servesBrunch',
          'servesBeer',
          'servesWine',
          'servesVegetarianFood',
          
          // Additional Attributes
          'curbsidePickup',
          'outdoorSeating',
          'liveMusic',
          'restroom',
          'goodForChildren',
          'goodForGroups',
          'allowsDogs',
          'goodForWatchingSports',
          'paymentOptions',
          'parkingOptions',
          
          // Location
          'location',
          'viewport',
          'shortFormattedAddress',
          
          // Other
          'iconMaskBaseUri',
          'iconBackgroundColor',
          'utcOffsetMinutes'
        ].join(',')
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data) {
      // Transform new API format to match old format for backward compatibility
      const transformedData = {
        place_id: data.id || placeId,
        name: data.displayName?.text || '',
        formatted_address: data.formattedAddress || data.shortFormattedAddress || '',
        formatted_phone_number: data.nationalPhoneNumber || '',
        international_phone_number: data.internationalPhoneNumber || '',
        website: data.websiteUri || '',
        url: data.googleMapsUri || '',
        business_status: data.businessStatus || '',
        types: data.types || [],
        primary_type: data.primaryType || '',
        
        // Reviews & Ratings
        rating: data.rating || 0,
        user_ratings_total: data.userRatingCount || 0,
        reviews: data.reviews ? data.reviews.map(r => ({
          author_name: r.authorAttribution?.displayName || 'Anonymous',
          author_url: r.authorAttribution?.uri || '',
          rating: r.rating || 0,
          text: r.text?.text || r.originalText?.text || '',
          time: new Date(r.publishTime).getTime() / 1000, // Convert to Unix timestamp
          relative_time_description: r.relativePublishTimeDescription || '',
          reply: r.ownerReply ? {
            text: r.ownerReply.text?.text || '',
            time: new Date(r.ownerReply.publishTime).getTime() / 1000
          } : null
        })) : [],
        
        // Photos
        photos: data.photos ? data.photos.map(p => ({
          photo_reference: p.name,
          height: p.heightPx || 0,
          width: p.widthPx || 0,
          html_attributions: p.authorAttributions || []
        })) : [],
        
        // Hours
        opening_hours: data.regularOpeningHours ? {
          open_now: data.currentOpeningHours?.openNow || false,
          periods: data.regularOpeningHours.periods || [],
          weekday_text: data.regularOpeningHours.weekdayDescriptions || []
        } : null,
        current_opening_hours: data.currentOpeningHours || null,
        
        // Pricing & Details
        price_level: data.priceLevel ? ['FREE', 'INEXPENSIVE', 'MODERATE', 'EXPENSIVE', 'VERY_EXPENSIVE'].indexOf(data.priceLevel) : null,
        editorial_summary: data.editorialSummary?.text || null,
        
        // Accessibility & Amenities
        wheelchair_accessible_entrance: data.accessibilityOptions?.wheelchairAccessibleEntrance || null,
        
        // Service Options
        delivery: data.delivery,
        dine_in: data.dineIn,
        takeout: data.takeout,
        reservable: data.reservable,
        serves_breakfast: data.servesBreakfast,
        serves_lunch: data.servesLunch,
        serves_dinner: data.servesDinner,
        serves_brunch: data.servesBrunch,
        serves_beer: data.servesBeer,
        serves_wine: data.servesWine,
        serves_vegetarian_food: data.servesVegetarianFood,
        
        // Additional Attributes (NEW - only available in new API)
        curbside_pickup: data.curbsidePickup,
        outdoor_seating: data.outdoorSeating,
        live_music: data.liveMusic,
        restroom: data.restroom,
        good_for_children: data.goodForChildren,
        good_for_groups: data.goodForGroups,
        allows_dogs: data.allowsDogs,
        good_for_watching_sports: data.goodForWatchingSports,
        payment_options: data.paymentOptions,
        parking_options: data.parkingOptions,
        
        // Location
        geometry: {
          location: data.location ? {
            lat: data.location.latitude,
            lng: data.location.longitude
          } : null,
          viewport: data.viewport || null
        },
        vicinity: data.shortFormattedAddress || '',
        
        // Other
        icon_background_color: data.iconBackgroundColor || '',
        icon_mask_base_uri: data.iconMaskBaseUri || ''
      };
      
      // Log key metrics for debugging
      console.log('=== PLACE DETAILS FETCHED (NEW API) ===');
      console.log('Business:', transformedData.name);
      console.log('Rating:', transformedData.rating);
      console.log('Reviews:', transformedData.user_ratings_total);
      console.log('Photos:', transformedData.photos?.length || 0);
      console.log('Has Website:', !!transformedData.website);
      console.log('Has Phone:', !!transformedData.formatted_phone_number);
      console.log('Has Hours:', !!transformedData.opening_hours);
      console.log('Business Status:', transformedData.business_status);
      console.log('Primary Type:', transformedData.primary_type);
      console.log('Attributes:', {
        delivery: transformedData.delivery,
        dine_in: transformedData.dine_in,
        takeout: transformedData.takeout,
        reservable: transformedData.reservable,
        wheelchair_accessible: transformedData.wheelchair_accessible_entrance,
        outdoor_seating: transformedData.outdoor_seating,
        live_music: transformedData.live_music,
        good_for_children: transformedData.good_for_children,
        good_for_groups: transformedData.good_for_groups,
        allows_dogs: transformedData.allows_dogs
      });
      console.log('============================');
      
      res.status(200).json({
        success: true,
        result: transformedData
      });
    } else {
      console.error('Google Places API Error:', response.status, data);
      res.status(400).json({
        success: false,
        error: data.error?.message || `API Error: ${response.status}`
      });
    }
  } catch (error) {
    console.error('Get details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}
