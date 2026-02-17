/**
 * WebSocket streaming service for Canva design element generation.
 *
 * Handles the full lifecycle of streaming elements for a single card:
 * 1. Opens WebSocket to backend
 * 2. Sends card + page dimensions
 * 3. Streams elements sequentially via callback
 * 4. Handles image uploads internally before passing element to callback
 */
import { CONFIG } from "../config";
import { Card, CanvaElement, WsMessage, WsElementMessage } from "../types";
import { uploadImage } from "./canva";

interface StreamCallbacks {
  /**
   * Called when an element is ready to be added to the design.
   * If this returns a Promise, the stream will wait for it to resolve
   * before processing the next element (preserving layer order).
   */
  onElement: (element: CanvaElement) => Promise<void> | void;
  
  /**
   * Called to update progress status and counts.
   */
  onProgress: (elementCount: number, status: string) => void;
  
  /**
   * Called on error.
   */
  onError: (msg: string) => void;
}

/**
 * Stream design elements for a single card via WebSocket.
 *
 * Elements are processed sequentially to preserve Z-index order.
 * Image uploads happen *before* the element is passed to `onElement`.
 *
 * @param card - The card to generate elements for
 * @param pageDimensions - Current page dimensions from Canva
 * @param callbacks - Event handlers for streaming
 * @returns Promise resolving when the stream is complete
 */
export function streamCardElements(
  card: Card,
  pageDimensions: { dimensions: { width: number; height: number } },
  callbacks: StreamCallbacks
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${CONFIG.WS_URL}/ws/canva_request`);
    let elementCount = 0;
    
    // Queue for ensuring sequential processing
    const messageQueue: WsElementMessage[] = [];
    let isProcessingQueue = false;
    let streamClosed = false;

    // Process the queue sequentially
    const processQueue = async () => {
      if (isProcessingQueue || messageQueue.length === 0) return;

      isProcessingQueue = true;

      try {
        while (messageQueue.length > 0) {
          const msg = messageQueue.shift();
          if (!msg) break;

          const element = msg.data;
          callbacks.onProgress(elementCount, `Processing ${element.type}...`);

          // Handle image upload if needed
          if (element.type === "image" && element.ref) {
            try {
              callbacks.onProgress(elementCount, "Uploading image...");
              const canvaRef = await uploadImage(element.ref);
              element.ref = canvaRef;
              console.log(`[WS] Image uploaded for element ${msg.index}`);
            } catch (err) {
              console.error(`[WS] Image upload failed for element ${msg.index}:`, err);
              // Continue with broken/original ref rather than crashing
            }
          }

          // Pass to UI to add to Canva
          // We await this to ensure Canva adds it before we process the next one
          callbacks.onProgress(elementCount, `Adding ${element.type}...`);
          await callbacks.onElement(element);
          
          elementCount++;
          callbacks.onProgress(elementCount, "Streaming...");
        }
      } catch (err) {
        console.error("[WS] Error processing queue:", err);
        callbacks.onError("Failed to add element to design");
      } finally {
        isProcessingQueue = false;
        
        // If stream is closed and queue is empty, we are done
        if (streamClosed && messageQueue.length === 0) {
          resolve();
        } else if (messageQueue.length > 0) {
           // Queue not empty, keep processing
           processQueue();
        }
      }
    };

    ws.onopen = () => {
      console.log("[WS] Connected, sending card payload");
      callbacks.onProgress(0, "Connected");

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
        case "element":
          console.log(`[WS] Received element ${msg.index} (type: ${msg.data.type})`);
          messageQueue.push(msg);
          processQueue();
          break;

        case "complete":
          console.log(`[WS] Stream complete signal. Total: ${msg.total_elements}`);
          streamClosed = true;
          // Trigger queue processing to ensure any remaining items are handled
          // and the stream resolves gracefully via the finally block.
          processQueue();
          break;

        case "error":
          console.error("[WS] Server error:", msg.message);
          callbacks.onError(msg.message);
          reject(new Error(msg.message));
          ws.close();
          break;

        default:
          console.warn("[WS] Unknown message type:", msg);
      }
    };

    ws.onerror = (event) => {
      console.error("[WS] Connection error:", event);
      if (!streamClosed) {
        callbacks.onError("Connection error");
        reject(new Error("WebSocket connection error"));
      }
    };

    ws.onclose = (event) => {
      console.log(`[WS] Connection closed (code: ${event.code})`);
      if (!streamClosed && messageQueue.length === 0) {
          // Only reject if we didn't get a complete signal and haven't finished processing
          // Actually, if connection closes cleanly after complete, it's fine.
          // But usually server sends 'complete' then closes? Or we close?
          // Let's assume server keeps it open or we close it.
          // If unexpected close:
          if (event.code !== 1000) {
              reject(new Error(`WebSocket closed unexpectedly (code: ${event.code})`));
          }
      }
    };
  });
}
