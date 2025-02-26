import { ExtensionContext } from "@foxglove/extension";
import { initParametersPanel } from "./ParametersPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({
    name: "Hytech Parameter Testing",
    initPanel: initParametersPanel,
  });
}
