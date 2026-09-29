const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
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

    if (url.pathname === "/api/test") {
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
          return json({ success: false, error: "No image received" }, 400);
        }

        if (!option) {
          return json({ success: false, error: "No option selected" }, 400);
        }

        let base64 = image;

        if (base64.indexOf(",") !== -1) {
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

        let prompt;

        if (option === "bw") {
          prompt = "Convert this exact reference photograph into a premium realistic black ink and graphite pencil outline drawing. Preserve the SAME PERSON and facial identity, face shape, eyes, eyebrows, nose, lips, jawline, hair and body proportions. The face must remain clearly recognizable. Do not create another person. Use only black ink and graphite lines on clean white paper. No color, no painted face, no cartoon, no 3D render. Create detailed professional contours and fine linework. Add elegant time travel decorations around the subject: a detailed clock, clock gears, a small aeroplane and subtle motion lines. Keep all decorations away from the face. The final result must clearly look like a professional black-and-white outline sketch made from the original photograph.";
        } else if (option === "2000") {
          prompt = "Create a realistic early-2000s photograph using this exact reference person. Preserve the same facial identity, face shape, eyes, eyebrows, nose, lips, jawline, hairstyle and body proportions. Do not create a different person. Change mainly the clothing, accessories, environment, technology and styling to authentic year 2000 and early-2000s appearance. Use genuine early-2000s fashion, hairstyles, objects and surroundings. Avoid modern smartphones, modern fashion and futuristic objects. Make it look like a real photograph taken around the year 2000, not a modern photograph with a vintage filter. Keep realistic skin, natural lighting and photographic detail.";
        } else if (option === "2075") {
          prompt = "Create a highly realistic year 2075 version of this exact reference person. Preserve the same facial identity, face shape, eyes, eyebrows, nose, lips, jawline, hairstyle and body proportions. Do not replace the person with another face. Change mainly the clothing, environment, technology and surroundings into a believable year 2075 future. Use realistic advanced technology, sophisticated futuristic clothing, believable architecture, advanced transportation and subtle holographic interfaces. Keep the person human and recognizable. Do not make the person a robot or cartoon. Use realistic skin, anatomy, lighting and high-detail photography.";
        } else {
          return json({
            success: false,
            error: "Invalid option"
          }, 400);
        }

        const form = new FormData();

        form.append("input_image_0", imageBlob);
        form.append("prompt", prompt);
        form.append("width", "1024");
        form.append("height", "1024");
        form.append("guidance", "7");

        const formResponse = new Response(form);

        const result = await env.AI.run(
          "@cf/black-forest-labs/flux-2-klein-4b",
          {
            multipart: {
              body: formResponse.body,
              contentType: formResponse.headers.get("content-type")
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

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);

    Object.entries(corsHeaders).forEach(function(item) {
      headers.set(item[0], item[1]);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
  }
};
