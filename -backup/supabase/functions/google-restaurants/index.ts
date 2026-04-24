import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { lat, lng, tag } = await req.json(); // ✅ 接收前端傳來的標籤
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

    // ✅ 基本 URL
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=restaurant&language=zh-TW&key=${GOOGLE_MAPS_API_KEY}`;

    // ✅ 如果有傳入標籤，加入 keyword 讓 Google 進行關鍵字過濾
    if (tag) {
      url += `&keyword=${encodeURIComponent(tag)}`;
    }

    const googleRes = await fetch(url);
    const googleData = await googleRes.json();

    const restaurants = (googleData.results || []).slice(0, 5).map((place: any) => {
      const photoRef = place.photos?.[0]?.photo_reference;
      return {
        name: place.name,
        image: photoRef 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`
          : 'https://via.placeholder.com/400x300?text=No+Photo',
        tags: tag ? [tag, ...place.types?.slice(0, 2)] : place.types?.slice(0, 3), // ✅ 優先顯示選中標籤
        distance: 0.8, 
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      };
    });

    return new Response(JSON.stringify(restaurants), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})