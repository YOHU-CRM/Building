import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function generateFalImage(prompt: string) {
  const result = await fal.subscribe(
    process.env.FAL_DEFAULT_MODEL || "fal-ai/flux/schnell",
    {
      input: {
        prompt,
        image_size: "landscape_4_3",
        num_images: 1,
      },
      logs: true,
      onQueueUpdate(update) {
        if (update.status === "IN_PROGRESS") {
          console.log(update.logs?.map((l) => l.message).join("\n"));
        }
      },
    }
  );

  return result.data;
}