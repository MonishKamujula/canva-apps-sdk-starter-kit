/**
 * WebSocket streaming service for Canva design element generation.
 *
 * Handles the full lifecycle of streaming elements for a single card:
 * 1. Opens WebSocket to backend
 * 2. Sends card + page dimensions
 * 3. Buffers elements as they stream in
 * 4. Uploads images in parallel during streaming
 * 5. Returns the complete element array once all elements arrive
 */
import { CONFIG } from "../config";
import { Card, CanvaElement, WsMessage } from "../types";
import { uploadImage } from "./canva";

/**
 * Stream design elements for a single card via WebSocket.
 *
 * Elements are buffered as they arrive. Image uploads start immediately
 * (in parallel with streaming) so they're mostly done by the time
 * the complete message arrives.
 *
 * @param card - The card to generate elements for
 * @param pageDimensions - Current page dimensions from Canva
 * @param onProgress - Callback for real-time progress updates
 * @returns Promise resolving to the full array of processed elements
 */
export function streamCardElements(
  card: Card,
  pageDimensions: { dimensions: { width: number; height: number } },
  onProgress: (elementCount: number, status: string) => void
): Promise<CanvaElement[]> {
  return new Promise((resolve, reject) => {
    const elements: CanvaElement[] = [];
    const imageUploadPromises: Promise<void>[] = [];
    let completed = false;

    const ws = new WebSocket(`${CONFIG.WS_URL}/ws/canva_request`);

    ws.onopen = () => {
      console.log("[WS] Connected, sending card payload");
      onProgress(0, "Connected");

      ws.send(
        JSON.stringify({
          card,
          page_dimensions: pageDimensions,
        })
      );
    };

    ws.onmessage = (event: MessageEvent) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        console.error("[WS] Failed to parse message:", event.data);
        return;
      }

      switch (msg.type) {
        case "element": {
          const element = msg.data;
          const elementIndex = elements.length;
          elements.push(element);

          console.log(
            `[WS] Received element ${msg.index} (type: ${element.type})`
          );
          onProgress(elements.length, `Received ${element.type} element`);

          // Start image upload immediately (parallel with streaming)
          if (element.type === "image" && element.ref) {
            const uploadPromise = uploadImage(element.ref)
              .then((canvaRef) => {
                // Replace the Pexels URL with the Canva ImageRef
                elements[elementIndex].ref = canvaRef;
                console.log(
                  `[WS] Image uploaded for element ${msg.index}`
                );
              })
              .catch((err) => {
                console.error(
                  `[WS] Image upload failed for element ${msg.index}:`,
                  err
                );
                // Keep the original ref — Canva will show a broken image
                // but won't crash the entire generation
              });

            imageUploadPromises.push(uploadPromise);
          }
          break;
        }

        case "complete": {
          console.log(
            `[WS] Stream complete. Total elements: ${msg.total_elements}`
          );
          completed = true;
          onProgress(elements.length, "Uploading images...");

          // Wait for all pending image uploads to finish
          Promise.all(imageUploadPromises)
            .then(() => {
              onProgress(elements.length, "Ready");
              resolve(elements);
            })
            .catch((err) => {
              // Even if some uploads fail, resolve with what we have
              console.warn("[WS] Some image uploads failed:", err);
              resolve(elements);
            });
          break;
        }

        case "error": {
          console.error("[WS] Server error:", msg.message);
          reject(new Error(msg.message));
          ws.close();
          break;
        }

        default:
          console.warn("[WS] Unknown message type:", msg);
      }
    };

    ws.onerror = (event) => {
      console.error("[WS] Connection error:", event);
      if (!completed) {
        reject(new Error("WebSocket connection error"));
      }
    };

    ws.onclose = (event) => {
      console.log(`[WS] Connection closed (code: ${event.code})`);
      if (!completed && elements.length === 0) {
        reject(
          new Error(
            `WebSocket closed unexpectedly (code: ${event.code})`
          )
        );
      }
    };
  });
}
