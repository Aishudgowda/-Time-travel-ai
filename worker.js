export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        if (!env.AI) {
          return Response.json(
            { error: "Workers AI binding is missing." },
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
            { error: "Please select an option." },
            { status: 400 }
          );
        }

        const match = image.match(
          /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
        );

        if (!match) {
          return Response.json(
            { error: "Invalid uploaded image." },
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

        // =========================
        // B&W OUTLINE
        // =========================

        if (option === "bw") {
          prompt = `
Use the uploaded reference photo as the source image.

Create a premium black-and-white TIME TRAVEL OUTLINE
PORTRAIT of the SAME PERSON from the reference photo.

The person's identity must be preserved.

Keep the same:
- face
- facial structure
- eyes
- nose
- mouth
- hairstyle
- head shape
- body proportions
- pose

The person must remain clearly recognizable.

Convert the photograph into sophisticated black ink
and pencil line-art.

IMPORTANT:
This is an OUTLINE / SKETCH artwork, not a normal
black-and-white photograph.

Use a mostly WHITE background.

Draw the person with detailed clean black outlines,
fine pencil shading and professional artistic line work.

Add elegant time-travel elements around the person:

1. A large detailed vintage clock
2. Visible clock hands
3. Mechanical clock gears
4. Several elegant gears around the composition
5. A small artistic airplane
6. Time-travel motion lines
7. Subtle mechanical and futuristic sketch details

The clock, gears and airplane should be integrated
naturally into the artwork.
