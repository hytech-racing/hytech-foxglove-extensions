import { ExtensionContext } from "@foxglove/extension";
import { initParametersPanel } from "./ParametersPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "parameters-panel", initPanel: initParametersPanel });
}
