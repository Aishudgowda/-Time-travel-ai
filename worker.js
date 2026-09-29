export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // AI image generation
    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        const body = await request.json();

        const image = body.image;
        const year = body.year;

        if (!image) {
          return Response.json(
            { error: "Photo is required" },
            { status: 400 }
          );
        }

        if (!year) {
          return Response.json(
            { error: "Year is required" },
            { status: 400 }
          );
        }

        if (!env.OPENAI_API_KEY) {
          return Response.json(
            { error: "OPENAI_API_KEY is not configured" },
            { status: 500 }
          );
        }

        let style;

        if (year === "2000") {
          style =
            "Transform the scene into the year 2000, with authentic early-2000s fashion, hairstyle, colors, environment and visual atmosphere.";
        } else if (year === "2026") {
          style =
            "Keep the scene contemporary and realistic, representing the year 2026.";
        } else if (year === "2075") {
          style =
            "Transform the scene into the year 2075, with a realistic futuristic environment, advanced technology, futuristic fashion and architecture.";
        } else {
          style = `Transform the scene to realistically represent the year ${year}.`;
        }

        const prompt = `
Edit the uploaded photo.

${style}

Keep the person clearly recognizable.
Preserve the person's facial structure, identity, pose and overall appearance as much as possible.
Only change the time period, surroundings, clothing and visual details needed to represent the selected year.
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
                      image_url: image,
                      detail: "high"
                    }
                  ]
                }
              ],
              tools: [
                {
                  type: "image_generation",
                  action: "edit",
                  model: "gpt-image-2",
                  quality: "medium",
                  size: "1024x1024",
                  output_format: "png"
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
                data.error?.message ||
                "OpenAI image generation failed"
            },
            { status: response.status }
          );
        }

        const imageResult = data.output?.find(
          (item) => item.type === "image_generation_call"
        );

        if (!imageResult?.result) {
          return Response.json(
            { error: "AI did not return an image" },
            { status: 500 }
          );
        }

        return Response.json({
          image: `data:image/png;base64,${imageResult.result}`,
          year: year
        });

      } catch (error) {
        return Response.json(
          {
            error: error?.message || "Server error"
          },
          { status: 500 }
        );
      }
    }

    // Website files
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Time Travel AI Worker is running.");
  }
};
