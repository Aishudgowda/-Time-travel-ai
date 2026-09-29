const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
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

    if (url.pathname === "/api/test" && request.method === "GET") {
      return json({
        success: true,
        message: "Time Travel AI is working"
      });
    }

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
          prompt =
            "Create a premium realistic black ink and pencil outline sketch based directly on the uploaded photograph. " +
            "Preserve the exact person's facial identity, face shape, eyes, nose, lips, hair, hairstyle, body proportions and recognizable appearance. " +
            "Do not replace the person with another face. Do not make the person cartoon-like. " +
            "Convert the photograph into an elegant detailed black-and-white outline sketch on a mostly white background. " +
            "Use clean artistic ink and pencil lines, realistic anatomy and fine facial details. " +
            "Add subtle time-travel design elements around the person: a vintage clock, clock gears, a small aeroplane and elegant time-travel motion lines. " +
            "The clock, gears and aeroplane must remain secondary decorations. " +
            "The person's face and identity must remain the main focus. " +
            "Premium realistic artwork, detailed line work, balanced composition, white background, not childish or cartoonish.";
        } else if (option === "2000") {
          prompt =
            "Transform the uploaded photograph into a highly realistic authentic early-2000s photograph. " +
            "Keep the exact same person and preserve facial identity, face shape, eyes, nose, lips, skin characteristics, hairstyle and body proportions. " +
            "Do not change the person's identity. " +
            "Make the clothing, hairstyle, accessories, environment and visual style genuinely resemble the late 1990s and early 2000s period. " +
            "Use authentic early-2000s fashion, realistic fabrics, period-appropriate surroundings, objects and technology. " +
            "Avoid modern smartphones, modern fashion, modern cars, modern buildings and modern accessories. " +
            "The result should look like a real photograph taken around the year 2000, not a modern photograph with a vintage filter. " +
            "Use natural realistic lighting, realistic skin texture, realistic facial proportions and photographic detail.";
        } else if (option === "2075") {
          prompt =
            "Transform the uploaded photograph into a highly realistic vision of the year 2075. " +
            "Keep the exact same person and preserve facial identity, face shape, eyes, nose, lips, hairstyle and body proportions. " +
            "Create a believable futuristic world rather than a cartoon or fantasy scene. " +
            "Use advanced but realistic 2075 technology, futuristic architecture, modern materials, subtle holographic interfaces, advanced transport and sophisticated futuristic clothing. " +
            "The person's identity must remain unchanged. " +
            "Use photorealistic skin, realistic lighting, realistic anatomy, high-detail photography and believable futuristic design. " +
            "Do not turn the person into a robot. Do not replace the person's face.";
        } else {
          return json({
            success: false,
            error: "Invalid option"
          }, 400);
        }

        const form = new FormData();

        form.append("input_image_0", imageBlob);
        form.append("prompt", prompt);

        const formResponse = new Response(form);

        const formStream = formResponse.body;
        const formContentType =
          formResponse.headers.get("content-type");

        const result = await env.AI.run(
          "@cf/black-forest-labs/flux-2-klein-4b",
          {
            multipart: {
              body: formStream,
              contentType: formContentType
            }
          }
        );

        if (!result || !result.image) {
          return json({
            success: false,
            error: "AI did not return an image"
          }, 500);
        }

        return json({
          success: true,
          image: "data:image/png;base64," + result.image
        });

      } catch (error) {
        return json({
          success: false,
          error: error && error.message
            ? error.message
            : "Image generation failed"
        }, 500);
      }
    }

    try {
      const response = await env.ASSETS.fetch(request);

      const headers = new Headers(response.headers);

      Object.entries(corsHeaders).forEach(function(entry) {
        headers.set(entry[0], entry[1]);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
    } catch (error) {
      return json({
        success: false,
        error: "Website file not found"
      }, 404);
    }
  }
};
