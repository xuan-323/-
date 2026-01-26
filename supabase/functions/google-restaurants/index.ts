// @ts-nocheck
import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { lat, lng, tag } = await req.json();

    if (!lat || !lng) {
      return new Response("Missing location", { status: 400, headers: corsHeaders });
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response("Missing Google API Key", { status: 500, headers: corsHeaders });
    }

    const radius = 1500;
    const keyword = tag ?? "餐廳";

    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}` +
      `&radius=${radius}` +
      `&type=restaurant` +
      `&keyword=${encodeURIComponent(keyword)}` +
      `&language=zh-TW` +
      `&key=${apiKey}`;

    const gRes = await fetch(url);
    const gData = await gRes.json();

    const restaurants = (gData.results ?? []).slice(0, 5).map((r) => {
      const rLat = r.geometry.location.lat;
      const rLng = r.geometry.location.lng;

      return {
        name: r.name,
        image: r.photos
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${r.photos[0].photo_reference}&key=${apiKey}`
          : "https://picsum.photos/400/260?restaurant",
        tags: r.types?.slice(0, 3) ?? [],
        distance: 0, // 你前端已有距離顯示，之後要算再加
        lat: rLat,
        lng: rLng,
      };
    });

    return new Response(JSON.stringify(restaurants), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
