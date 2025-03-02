import { Immutable, MessageEvent, PanelExtensionContext, Topic } from "@foxglove/extension";
import { ReactElement, useEffect, useLayoutEffect, useState, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { CompressedImage } from "@foxglove/schemas";

type ImageMessage = MessageEvent<CompressedImage>;

type PanelState = {
  topic?: string;
};

async function drawImageOnCanvas(imgData: Uint8Array, canvas: HTMLCanvasElement, format: string) {
  const ctx = canvas.getContext("2d");

  if (ctx == undefined) {
    return;
  }

  // Create a bitmap from our raw compressed image data.
  const blob = new Blob([imgData], { type: `image/${format}` });
  const bitmap = await createImageBitmap(blob);

  // Adjust for aspect ratio.
  canvas.width = Math.round((canvas.height * bitmap.width) / bitmap.height);

  // Draw the image.
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  ctx.resetTransform();
}

function ExamplePanel({ context }: { context: PanelExtensionContext }): ReactElement {
  const [topics, setTopics] = useState<undefined | Immutable<Topic[]>>();
  const [message, setMessage] = useState<ImageMessage>();

  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();

  const imageTopics = useMemo(() => {
    // debugging
    console.log("Topics available:", topics); // Debugging line
    topics?.forEach((topic) => console.log(`Topic: ${topic.name}, Datatype: ${topic.datatype}`));

    console.log(
      "Filtered image topics:",
      (topics ?? []).filter((topic) => topic.datatype === "sensor_msgs/CompressedImage"),
    );

    return topics ?? [];
  }, [topics]);

  const [state, setState] = useState<PanelState>(() => {
    return context.initialState as PanelState;
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (message) {
      drawImageOnCanvas(message.message.data, canvasRef.current!, message.message.format).catch(
        (error) => console.log(error),
      );
    }
  }, [message]);

  useEffect(() => {
    context.saveState({ topic: state.topic });
    if (state.topic) {
      context.subscribe([state.topic]);
    }
  }, [context, state.topic]);

  useEffect(() => {
    if (!state.topic && imageTopics.length > 0) {
      console.log("Setting default topic:", imageTopics[0]?.name);
      setState({ topic: imageTopics[0]?.name });
    }
  }, [imageTopics]);

  useEffect(() => {
    console.log("Subscribing to topics...");
    context.watch("topics");
  }, [context]);

  // We use a layout effect to setup render handling for our panel. We also setup some topic subscriptions.
  useLayoutEffect(() => {
    // The render handler is run by the broader studio system during playback when your panel
    // needs to render because the fields it is watching have changed. How you handle rendering depends on your framework.
    // You can only setup one render handler - usually early on in setting up your panel.
    //
    // Without a render handler your panel will never receive updates.
    //
    // The render handler could be invoked as often as 60hz during playback if fields are changing often.
    context.onRender = (renderState, done) => {
      console.log("Rendering topics:", renderState.topics); // Debugging
      // render functions receive a _done_ callback. You MUST call this callback to indicate your panel has finished rendering.
      // Your panel will not receive another render callback until _done_ is called from a prior render. If your panel is not done
      // rendering before the next render call, studio shows a notification to the user that your panel is delayed.
      //
      // Set the done callback into a state variable to trigger a re-render.
      setRenderDone(() => done);

      // We may have new topics - since we are also watching for messages in the current frame, topics may not have changed
      // It is up to you to determine the correct action when state has not changed.
      setTopics(renderState.topics);

      // currentFrame has messages on subscribed topics since the last render call
      if (renderState.currentFrame && renderState.currentFrame.length > 0) {
        setMessage(renderState.currentFrame[renderState.currentFrame.length - 1] as ImageMessage);
      }
    };

    // After adding a render handler, you must indicate which fields from RenderState will trigger updates.
    // If you do not watch any fields then your panel will never render since the panel context will assume you do not want any updates.

    // tell the panel context that we care about any update to the _topic_ field of RenderState
    context.watch("topics");

    // tell the panel context we want messages for the current frame for topics we've subscribed to
    // This corresponds to the _currentFrame_ field of render state.
    context.watch("currentFrame");

    // subscribe to some topics, you could do this within other effects, based on input fields, etc
    // Once you subscribe to topics, currentFrame will contain message events from those topics (assuming there are messages).
    context.subscribe([{ topic: "/some/topic" }]);
  }, [context]);

  // invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);

  return (
    <div style={{ height: "100%", padding: "1rem" }}>
      <div style={{ paddingBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <label>Choose a topic to render:</label>

        {imageTopics.length === 0 ? (
          <p>No image topics available</p>
        ) : (
          <select
            value={state.topic}
            onChange={(event) => setState({ topic: event.target.value })}
            style={{ flex: 1 }}
          >
            {imageTopics.map((topic) => (
              <option key={topic.name} value={topic.name}>
                {topic.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <canvas width={480} height={480} ref={canvasRef} />
    </div>
  );
}

export function initExamplePanel(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<ExamplePanel context={context} />);

  // Return a function to run when the panel is removed
  return () => {
    root.unmount();
  };
}
