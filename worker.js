export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    if (url.pathname === "/api/generate" && request.method === "POST") {

      try {

        const body = await request.json();

        const image = body.image;
        const year = body.year;

        if (!image) {
          return Response.json(
            { error: "Photo is required." },
            { status: 400 }
          );
        }

        if (!year) {
          return Response.json(
            { error: "Year is required." },
            { status: 400 }
          );
        }

        if (!env.AI) {
          return Response.json(
            { error: "Workers AI binding is not configured." },
            { status: 500 }
          );
        }

        let style = "";

        if (year === "2000") {

          style = `
Make the uploaded photograph realistically look like it
was taken around the year 2000.

Use authentic early-2000s clothing, hairstyles,
technology, objects, colors and surroundings.

Remove modern-looking details where appropriate.

Keep the result photorealistic and natural.
`;

        } else if (year === "2075") {

          style = `
Transform the uploaded photograph into a believable
vision of the year 2075.

Use realistic futuristic clothing, architecture,
transportation, technology and surroundings.

The future should look advanced but believable.

Keep everything photorealistic.

Do not make it cartoon-like.
`;

        } else if (
          year === "bw" ||
          year === "black-white" ||
          year === "blackwhite"
        ) {

          style = `
Convert the uploaded photograph into a beautiful
high-quality realistic black and white photograph.

Keep the person's identity, face, pose and composition.

Use natural realistic grayscale tones,
professional photography quality,
good contrast and detailed facial features.

Do not change the person's identity.
`;

        } else {

          style = `
Keep the uploaded photograph realistic and contemporary.

Preserve the person's identity and appearance.

Use realistic modern clothing, technology,
architecture and surroundings.
`;
        }

        const prompt = `
Edit the uploaded photograph.

${style}

VERY IMPORTANT:

Keep the same person recognizable.

Preserve the person's facial identity,
facial structure, facial proportions,
pose and overall appearance as much as possible.

Do NOT replace the person with another person.

Do NOT create a different face.

Only change clothing, surroundings, objects,
technology, colors and other details necessary
for the selected transformation.

The final image must look like a real photograph
taken with a high-quality camera.

Natural skin texture.
Realistic lighting.
Realistic shadows.
Realistic details.

Selected transformation: ${year}
`;

        /*
          Convert the incoming data URL into binary image data.
        */

        const matches = image.match(
          /^data:(.+?);base64,(.+)$/
        );

        if (!matches) {
          return Response.json(
            { error: "Invalid image format." },
            { status: 400 }
          );
        }

        const contentType = matches[1];
        const base64Data = matches[2];

        const binaryString = atob(base64Data);

        const bytes = new Uint8Array(
          binaryString.length
        );

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const imageBlob = new Blob(
          [bytes],
          { type: contentType }
        );

        /*
          Create multipart form data for FLUX.2 Klein 4B.
        */

        const form = new FormData();

        form.append(
          "prompt",
          prompt
        );

        form.append(
          "input_image_0",
          imageBlob,
          "input.png"
        );

        form.append(
          "width",
          "1024"
        );

        form.append(
          "height",
          "1024"
        );

        /*
          Serialize FormData so Cloudflare can send
          the correct multipart boundary.
        */

        const formResponse = new Response(form);

        const formStream = formResponse.body;

        const formContentType =
          formResponse.headers.get("content-type");

        /*
          Run Cloudflare Workers AI.
        */

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
          return Response.json(
            {
              error: "AI did not return an image."
            },
            {
              status: 500
            }
          );
        }

        return Response.json({
          image: `data:image/png;base64,${result.image}`,
          year: year
        });

      } catch (error) {

        return Response.json(
          {
            error:
              error?.message ||
              "Cloudflare AI generation failed."
          },
          {
            status: 500
          }
        );
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      "Time Travel AI Worker is running."
    );
  }
};
