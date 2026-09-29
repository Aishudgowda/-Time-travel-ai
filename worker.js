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
          return json({ success: false, error: "No image received" }, 400);
        }

        if (!option) {
          return json({ success: false, error: "No option selected" }, 400);
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
            "Convert the uploaded photograph into a PREMIUM REALISTIC BLACK INK OUTLINE DRAWING. " +
            "This is an image-to-image transformation, not a new person. " +
            "Preserve the SAME PERSON and preserve facial identity, face shape, eyes, eyebrows, nose, lips, jawline, hairstyle and body proportions. " +
            "The face must remain clearly recognizable as the person in the reference photograph. " +
            "Do not invent a different face. " +
            "Use ONLY black ink and graphite pencil lines on clean white paper. " +
            "No color. No painted face. No photorealistic color rendering. No cartoon style. " +
            "Create detailed clean contours and fine linework around the eyes, nose, lips, hair and clothing. " +
            "Keep realistic human anatomy and realistic proportions. " +
            "Add elegant TIME TRAVEL design elements around the subject: a detailed clock, clock gears, a small vintage aeroplane and subtle time-travel motion lines. " +
            "These decorative elements must stay around the subject and must not cover the face. " +
            "The final image must unmistakably look like a professional black-and-white outline/sketch artwork made from the original photograph.";

        } else if (option === "2000") {
          prompt =
            "
