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

        if (!env.OPENAI_API_KEY) {
          return Response.json(
            { error: "OPENAI_API_KEY is not configured." },
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
Keep the result photorealistic.
`;
        }

        else if (year === "2026") {
          style = `
Keep the uploaded photograph realistic and contemporary,
representing the year 2026.

Use realistic modern clothing, technology,
architecture and surroundings.
`;
        }

        else if (year === "2075") {
          style = `
Transform the uploaded photograph into a believable
vision of the year 2075.

Use realistic futuristic clothing, architecture,
transportation, technology and surroundings.

Keep everything photorealistic and believable.
Do not make it cartoon-like.
`;
        }

        else {
          style = `
Make the uploaded photograph realistically represent
the year ${year}.
`;
        }

        const prompt = `
Edit the uploaded photograph.

${style}

Very important:

Keep the same person recognizable.

Preserve the person's facial identity,
facial structure, pose and overall appearance
as much as possible.

Do not replace the person with another person.

Only change clothing, surroundings, objects,
technology and other details necessary to represent
the selected year.

Create a realistic high-quality photograph.

Selected year: ${year}
`;

        const response = await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`
            },

            body: JSON.stringify({

              model: "gpt-5.6-luna",

              input: [
                {
                  role: "user",
                  content: [
                    {
                      type: "input_text",
                      text: prompt
                    },
                    {
                      type: "input_image",
                      image_url: image
                    }
                  ]
                }
              ],

              tools: [
                {
                  type: "image_generation",
                  model: "gpt-image-2",
                  action: "edit",
                  size: "1024x1024",
                  quality: "medium"
                }
              ]
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return Response.json(
            {
              error:
                data?.error?.message ||
                "OpenAI image generation failed."
            },
            {
              status: response.status
            }
          );
        }

        const imageResult = data.output?.find(
          item => item.type === "image_generation_call"
        );

        if (!imageResult?.result) {
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
          image: `data:image/png;base64,${imageResult.result}`,
          year: year
        });

      } catch (error) {

        return Response.json(
          {
            error: error?.message || "Server error."
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
