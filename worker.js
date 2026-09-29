export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        if (!env.AI) {
          return Response.json(
            { error: "Workers AI binding is not configured." },
            { status: 500 }
          );
        }

        const body = await request.json();
        const image = body.image;
        const option = body.option || body.year;

        if (!image) {
          return Response.json(
            { error: "Photo is required." },
            { status: 400 }
          );
        }

        if (!option) {
          return Response.json(
            { error: "Please choose an option." },
            { status: 400 }
          );
        }

        const match = image.match(
          /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
        );

        if (!match) {
          return Response.json(
            { error: "Invalid image format." },
            { status: 400 }
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

        let prompt = "";

        if (
          option === "bw" ||
          option === "black-white"
        ) {
          prompt = `
Transform the uploaded person's photograph into a
beautiful detailed black-and-white TIME TRAVEL OUTLINE
ARTWORK.

IMPORTANT:

Preserve the same person's identity, face shape,
facial features, hairstyle, pose and recognizable
appearance as accurately as possible.

Create a clean artistic black ink and pencil outline
illustration on a mostly white background.

The person must remain the main subject.

Add elegant time-travel themed drawing elements around
the person:

- a detailed vintage clock
- visible clock hands
- clock gears and mechanical components
- an artistic aeroplane / airplane drawing
- subtle time-travel motion lines and sketch details

Integrate the clock, gears and aeroplane naturally into
the composition rather than randomly placing them.

Use fine black outlines, detailed line work,
professional illustration quality and realistic
proportions.

It should look like a sophisticated hand-drawn
ink/pencil portrait, NOT a childish cartoon.

Keep the person's face recognizable.

Do not replace the person with another person.

Do not distort the face.

Do not add random text or logos.

Final style:
premium black-and-white time-travel portrait,
clean white background, detailed outline drawing,
clock + gears + aeroplane.
`;
        }

        else if (option === "2000") {
          prompt = `
Edit the uploaded photograph so it realistically looks
like it was taken around the year 2000.

Preserve the SAME person's identity, face, facial
structure, facial proportions, pose and recognizable
appearance.

Use authentic early-2000s clothing, hairstyles,
technology, objects, colors, interiors and surroundings.

Remove clearly modern-looking details where appropriate.

Use realistic early-2000s photography characteristics
without making the image look artificially old.

Create a highly realistic photograph.

Do not replace the person.

Do not change the person's identity.

Do not make it cartoon-like.

No text or logos.
`;
        }

        else if (option === "2075") {
          prompt = `
Transform the uploaded photograph into a believable
vision of the year 2075.

Preserve the SAME person's identity, face, facial
structure, facial proportions, pose and recognizable
appearance.

Only transform clothing, surroundings, architecture,
technology, transportation and objects to represent
a believable year 2075.

Use advanced but physically believable technology,
futuristic architecture, elegant futuristic clothing,
advanced transportation and realistic environmental
details.

The result must look like a real high-quality photograph
from a believable future.

Do not replace the person.

Do not create a different face.

Do not make it cartoon-like.

No text or logos.
`;
        }

        else {
          return Response.json(
            { error: "Invalid option." },
            { status: 400 }
          );
        }

        const form = new FormData();

        form.append("prompt", prompt);

        form.append(
          "input_image_0",
          imageBlob,
          "input.jpg"
        );

        form.append("width", "1024");
        form.append("height", "1024");

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
          return Response.json(
            {
              error: "Cloudflare AI did not return an image."
            },
            { status: 500 }
          );
        }

        return Response.json({
          image: `data:image/png;base64,${result.image}`,
          option
        });

      } catch (error) {
        return Response.json(
          {
            error:
              error?.message ||
              "Cloudflare AI generation failed."
          },
          { status: 500 }
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
