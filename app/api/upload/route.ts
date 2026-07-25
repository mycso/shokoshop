import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
// SVG is deliberately excluded: it can embed <script>, which executes if the
// file is ever opened directly rather than rendered as an <img> (stored XSS).
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Issues a short-lived client token so the browser can upload the file
// straight to Blob storage, bypassing the function body size limit.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("designs/")) {
          throw new Error("Invalid upload path");
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_SIZE,
          addRandomSuffix: false,
        };
      },
      onUploadCompleted: async () => {},
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
