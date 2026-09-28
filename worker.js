export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // AI generation API
    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        const body = await request.json();
        const prompt = body.prompt;

        if (!prompt) {
          return Response.json(
            { error: "Prompt is required" },
            { status: 400 }
          );
        }

        if (!env.OPENAI_API_KEY) {
          return Response.json(
            { error: "OPENAI_API_KEY is not configured" },
            { status: 500 }
          );
        }

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
              input: prompt
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return Response.json(
            { error: data.error?.message || "OpenAI API error" },
            { status: response.status }
          );
        }

        return Response.json({
          output: data.output_text || ""
        });

      } catch (error) {
        return Response.json(
          { error: "Server error" },
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
