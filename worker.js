export default {
  async fetch(request, env) {

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    const json = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          ...cors
        }
      });
    };

    const url = new URL(request.url);

    if (
      url.pathname === "/api/generate" &&
      request.method === "POST"
    ) {
      try {

        if (!env.AI) {
          return json(
            { error: "Workers AI binding is missing." },
            500
          );
        }

        const body = await request.json();

        const image = body.image;
        const option = body.option || body.year;

        if (!image) {
          return json(
            { error: "Photo is required." },
            400
          );
        }

        if (!option) {
          return json(
            { error: "Please select an option." },
            400
          );
        }

        const match = image.match(
          /^data:(image\/[^;]+);base64,(.+)$/
        );

        if (!match) {
          return json(
            { error: "Invalid image format." },
            400
          );
        }

        const contentType = match[1];
        const base64 = match[2];

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const imageBlob = new Blob([bytes], {
          type: contentType
        });

        let prompt;

        if (option === "bw") {

          prompt = `
Use image 0 as the reference photograph.

Create a premium black-and-white OUTLINE PORTRAIT
of the same person.

Preserve the person's identity, face, facial structure,
eyes, nose, mouth, hairstyle, head shape and pose.

The person must remain clearly recognizable.

Convert the photograph into detailed black ink and
pencil line art on a mostly white background.

This MUST be an outline drawing, NOT a normal
black-and-white photograph.

Add elegant time-travel artwork around the person:

- detailed vintage clock
- clock hands
- mechanical clock gears
- several gears
- artistic airplane
- time-travel motion lines
- subtle mechanical sketch details

Keep the person as the main subject.

Professional illustration.
Realistic proportions.
Detailed fine line work.
Elegant premium composition.

Do not create a blank image.
Do not remove the person.
Do not replace the person.
Do not distort the face.
Do not make it childish or cartoon-like.
Do not add text or logos.
`;

        } else if (option === "2000") {

          prompt = `
Use image 0 as the reference photograph.

Transform the same person into a realistic photograph
representing the year 2000.

Preserve the person's identity, face, facial structure,
eyes, nose, mouth, hairstyle, body proportions and pose.

Use authentic early-2000s clothing, hairstyles,
technology, objects and surroundings.

Remove clearly modern elements.

Create a realistic early-2000s photograph.

Do not replace the person.
Do not distort the face.
Do not make it cartoon-like.
Do not add text or logos.
`;

        } else if (option === "2075") {

          prompt = `
Use image 0 as the reference photograph.

Transform the same person into a realistic photograph
representing a believable year 2075.

Preserve the person's identity, face, facial structure,
eyes, nose, mouth, hairstyle, body proportions and pose.

Use believable futuristic clothing, architecture,
transportation and advanced technology.

Make it look like a real high-quality photograph.

Do not replace the person.
Do not distort the face.
Do not make it cartoon-like.
Do not add text or logos.
`;

        } else {
          return json(
            { error: "Invalid option." },
            400
          );
        }

        const form = new FormData();

        form.append("prompt", prompt);

        form.append(
          "input_image_0",
          imageBlob,
          "reference.jpg"
        );

        form.append("width", "1024");
        form.append("height", "1024");

        const formResponse = new Response(form);

        const result = await env.AI.run(
          "@cf/black-forest-labs/flux-2-klein-4b",
          {
            multipart: {
              body: formResponse.body,
              contentType:
                formResponse.headers.get("content
