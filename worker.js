const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    // Test endpoint
    if (url.pathname === "/api/test" && request.method === "GET") {
      return json({
        success: true,
        message: "Time Travel AI is working"
      });
    }

    // AI image generation
    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        const body = await request.json();

        const image = body.image;
        const option = body.option;

        if (!image) {
          return json({
            success: false,
            error: "No image received"
          }, 400);
        }

        if (!option) {
          return json({
            success: false,
            error: "No option selected"
          }, 400);
        }

        // Convert base64 image to Blob
        let base64 = image;

        if (base64.includes(",")) {
          base64 = base64.split(",")[1];
        }

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const imageBlob = new Blob([bytes], {
          type: "image/jpeg"
        });

        let prompt = "";

        if (option === "bw") {
          prompt = `
Create a premium realistic black ink and pencil outline sketch
based directly on the uploaded person's photograph.

IMPORTANT:
Preserve the person's facial identity, face shape, eyes, nose, lips,
hair, hairstyle, body proportions and recognizable appearance.
Do not replace the person with another face.
Do not make the person cartoon-like.

Convert the photograph into an elegant detailed black-and-white
outline/sketch illustration on a mostly white background.

Use clean artistic ink and pencil lines, realistic anatomy,
fine facial details and professional hand-drawn quality.

Add subtle time-travel themed design elements around the person:
a vintage clock, clock gears, small aeroplane illustration,
and elegant time-travel motion lines.

The clock, gears and aeroplane must remain secondary decorations.
The person's face and identity must remain the main focus.

Premium realistic artwork, detailed line work, balanced composition,
white background, no childish cartoon style.
`;

        } else if (option === "2000") {
          prompt = `
Transform the uploaded photograph into a highly realistic
authentic early-2000s photograph.

CRITICAL:
Keep the exact same person.
Preserve facial identity, face shape, eyes, nose, lips,
skin characteristics, hairstyle and body proportions.
Do NOT change the person's identity.

Make the clothing, hairstyle, accessories, environment and visual
style genuinely resemble the late 1990s / early 2000s period.

Use authentic early-2000s fashion, realistic fabrics and styling,
period-appropriate surroundings, objects and technology.

Avoid modern smartphones, modern fashion, modern cars,
modern buildings, modern accessories or futuristic elements.

The result should look like a real photograph taken around the year 2000,
not like a modern photograph with a vintage filter.

Natural realistic lighting, realistic skin texture,
realistic facial proportions and photographic detail.
`;

        } else if (option === "2075") {
          prompt = `
Transform the uploaded photograph into a highly realistic vision
of the year 2075.

CRITICAL:
Keep the exact same person and preserve facial identity.
Keep the face shape, eyes, nose, lips, hairstyle and body proportions
recognizable.

Create a believable futuristic world rather than a cartoon or fantasy scene.

Use advanced but realistic 2075 technology, futuristic architecture,
modern materials, subtle holographic interfaces, advanced transport,
and sophisticated futuristic clothing.

The person's
