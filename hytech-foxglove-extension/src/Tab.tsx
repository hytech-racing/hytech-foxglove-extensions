import React, { useEffect, useState, useCallback } from "react";
import { Immutable, PanelExtensionContext, ParameterValue } from "@foxglove/extension";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./styles.css";

/* Tab */
type RegisteredParameter = {
  parameterValue: ParameterValue;
  inputField: string;
};

interface Tab {
  id: string;
  name: string;
  registeredParameters: Map<string, RegisteredParameter>;
}

type TabSystemProps = {
  parameters: undefined | Immutable<Map<string, ParameterValue>>;
  setParameters: React.Dispatch<
    React.SetStateAction<undefined | Immutable<Map<string, ParameterValue>>>
  >;
  pExtensionContext: PanelExtensionContext;
};

/* Final export */

const TabSystem: React.FC<TabSystemProps> = ({ parameters, setParameters, pExtensionContext }) => {
  const [tabs, setTabs] = useState<Tab[]>([
    // sets up initial tab
    // these parameters are for testing only, not real.
    {
      id: "1",
      name: "Tab 1",
      // registeredParameters: new Map<string, RegisteredParameter>([
      //   ["temperature", { parameterValue: 22.5, inputField: "22.5" }],
      //   ["mode", { parameterValue: "automatic", inputField: "automatic" }],
      //   ["enabled", { parameterValue: true, inputField: "true" }],
      // ]),
      registeredParameters: new Map<string, RegisteredParameter>(),
    },
  ]);
  const [activeTab, setActiveTab] = useState<string>("1");

  // testing parameters
  const dummyParameters = new Map<string, ParameterValue>([
    ["temperature", 22.5],
    ["mode", "automatic"],
    ["enabled", true],
    ["volume", 75],
    ["brightness", 50],
    ["status", "active"],
  ]);
  if (!parameters || parameters.size === 0) {
    setParameters(dummyParameters);
  }

  // Tab functions
  const addTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      name: "New Tab",
      registeredParameters: new Map<string, RegisteredParameter>(),
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const deleteTab = (id: string) => {
    if (tabs.length > 1) {
      const newTabs: Tab[] = tabs.filter((tab) => tab.id !== id);
      setTabs(newTabs);

      if (activeTab === id) {
        setActiveTab(newTabs[0]?.id || "");
      }
    }
  };

  const getActiveTab = (): Tab => {
    let tab = null;
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i]?.id == activeTab) {
        tab = tabs[i];
      }
    }
    return (
      tab ?? {
        id: Date.now().toString(),
        name: "New Tab",
        registeredParameters: new Map<string, RegisteredParameter>(),
      }
    );
  };

  const renameTab = (id: string, newName: string) => {
    const newTabs = tabs.map((tab) => (tab.id === id ? { ...tab, name: newName } : tab));
    setTabs(newTabs);
  };

  // Adding parameters
  let paramNames: string[] = Array.from((parameters ?? new Map<string, ParameterValue>()).keys());

  const handleParameterSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formElements = form.elements as typeof form.elements & {
      parameter_input: { value: string };
    };
    if (paramNames.includes(formElements.parameter_input.value)) {
      onParameterSubmit(formElements.parameter_input.value);
    }
  };

  const onParameterSubmit = (newParam: string) => {
    const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (activeTabIndex === -1) return;

    const tab = tabs[activeTabIndex];
    if (tab !== null && tab?.registeredParameters.get(newParam) == undefined) {
      // If parameter isn't registered, add it
      let updatedParameters = new Map(tab?.registeredParameters);
      updatedParameters.set(newParam, {
        parameterValue: parameters?.get(newParam) as ParameterValue,
        inputField: parameters?.get(newParam) as string,
      });

      const updatedTab = { ...tab, registeredParameters: updatedParameters } as Tab;

      const updatedTabs = [...tabs];
      updatedTabs[activeTabIndex] = updatedTab;

      setTabs(updatedTabs);
    }
  };

  // Modifying Parameters
  const onParameterChange = (paramKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    const newValue = event.target.value;
    const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (activeTabIndex === -1) return;

    const tab = tabs[activeTabIndex];

    if (tab === undefined) return;

    const paramToChange = tab?.registeredParameters.get(paramKey);
    if (!paramToChange) {
      console.error(`Parameter ${paramKey} not found`);
      return;
    }

    let convertedValue: ParameterValue;

    // Convert input back to original type
    if (typeof paramToChange.parameterValue === "boolean") {
      convertedValue = newValue.toLowerCase() === "true";
    } else if (typeof paramToChange.parameterValue === "number") {
      convertedValue = isFinite(+newValue) ? +newValue : paramToChange.parameterValue;
    } else if (paramToChange.parameterValue instanceof Date) {
      convertedValue = new Date(newValue);
    } else {
      convertedValue = newValue;
    }

    const updatedParameter: RegisteredParameter = {
      ...paramToChange,
      parameterValue: convertedValue, // Store with correct type
      inputField: newValue, // Store input as string for UI
    };

    // if (typeof paramToChange.parameterValue === "string") {
    //   updatedParameter.parameterValue = newValue;
    // } else if (typeof paramToChange.parameterValue === "number") {
    //   updatedParameter.parameterValue = isFinite(+newValue)
    //     ? +newValue
    //     : paramToChange.parameterValue;
    // } else if (typeof paramToChange.parameterValue === "boolean") {
    //   updatedParameter.parameterValue = newValue.toLowerCase() === "true";
    // } else {
    //   console.error(`Unsupported parameter type for ${paramKey}`);
    // }

    updatedParameter.inputField = newValue;

    const updatedLocalParameters = new Map(tab?.registeredParameters);
    updatedLocalParameters.set(paramKey, updatedParameter);

    const updatedTab = { ...tab, registeredParameters: updatedLocalParameters };
    const updatedTabs = [...tabs];
    updatedTabs[activeTabIndex] = updatedTab;

    // Save the updated tabs
    setTabs(updatedTabs);

    // Set the actual parameter values
    pExtensionContext.setParameter(paramKey, updatedLocalParameters.get(paramKey)?.parameterValue);
  };

  const removeParameter = (paramKey: string) => {
    const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (activeTabIndex === -1) return;

    const tab = tabs[activeTabIndex];

    if (!tab) return;

    // Create a new Map without the deleted parameter
    const updatedParameters = new Map(tab.registeredParameters);
    updatedParameters.delete(paramKey);

    // Update the tab and state
    const updatedTab = { ...tab, registeredParameters: updatedParameters };
    const updatedTabs = [...tabs];
    updatedTabs[activeTabIndex] = updatedTab;

    setTabs(updatedTabs);
  };

  const [buttonLoading, setButtonLoading] = useState(false);

  // idk useCallback makes this use the most recent state so ctrl s save functionality works properly
  // i couldnt tell you how react works
  const saveParameters = useCallback(() => {
    setButtonLoading(true);

    let curr = getActiveTab();

    let parameters: Record<string, ParameterValue> = {};

    // map parameters into json
    curr.registeredParameters.forEach((param, name) => {
      parameters[name] = param.parameterValue;
    });

    let tabJson = JSON.stringify(parameters, null, 2);

    // idk some file saving code
    const blob = new Blob([tabJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "parameters.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    // let button be pressed again
    setButtonLoading(false);
  }, [activeTab, tabs]);

  // listens for ctrl s to indicate save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        saveParameters();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [saveParameters]);

  // reads the jsons saved for registered parameter configurations
  const loadParametersFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        // Ensure jsonData is an object
        if (typeof jsonData !== "object" || jsonData === null) {
          alert("Invalid JSON format!");
          return;
        }

        const newParameters = new Map<string, RegisteredParameter>();

        // iterate through JSON keys and values, and create parameters
        Object.entries(jsonData).forEach(([key, value]) => {
          let parsedValue: ParameterValue;

          // Preserve the correct type
          if (typeof value === "boolean") {
            parsedValue = value;
          } else if (typeof value === "number") {
            parsedValue = value;
          } else if (typeof value === "string") {
            parsedValue = value;
          } else {
            parsedValue = String(value); // Fallback to string
          }

          newParameters.set(key, {
            parameterValue: parsedValue,
            inputField: String(parsedValue),
          });
        });

        // update active tab's registered parameters
        setTabs((prevTabs) =>
          prevTabs.map((tab) =>
            tab.id === activeTab ? { ...tab, registeredParameters: newParameters } : tab,
          ),
        );

        alert("Parameters loaded successfully!");
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Failed to load JSON file. Check the file format.");
      }
      fileInput.value = "";
    };

    reader.readAsText(file);
  };

  function getParameterType(value: ParameterValue): string {
    if (value === undefined) return "undefined";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "string") return "string";
    if (value instanceof Date) return "Date";
    if (value instanceof Uint8Array) return "Uint8Array";

    return "unknown";
  }

  // reordering parameters
  const moveParameter = (key: string, direction: "up" | "down") => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) => {
        if (tab.id !== activeTab) return tab;

        const paramsArray = Array.from(tab.registeredParameters.entries());
        const index = paramsArray.findIndex(([paramKey]) => paramKey === key);

        if (index === -1) return tab; // If key is not found, return without changes

        // Determine new index
        const newIndex = direction === "up" ? index - 1 : index + 1;

        // Ensure the new index is within bounds
        if (newIndex < 0 || newIndex >= paramsArray.length) return tab;

        // Swap elements safely
        const movedItem = paramsArray[index];
        const targetItem = paramsArray[newIndex];

        if (!movedItem || !targetItem) return tab; // Prevent undefined errors

        paramsArray[index] = targetItem;
        paramsArray[newIndex] = movedItem;

        return {
          ...tab,
          registeredParameters: new Map(paramsArray),
        };
      }),
    );
  };

  return (
    <div>
      <div className="nav_bar">
        {tabs.map((tab) => (
          <span className="tab_box">
            <input
              type="text"
              value={tab.name}
              onChange={(e) => renameTab(tab.id, e.target.value)}
              className="tab_entry"
              onClick={(e) => setActiveTab(tab.id)}
            />
            <button
              className="tab_delete"
              onClick={(e) => {
                e.stopPropagation();
                deleteTab(tab.id);
              }}
            >
              x
            </button>
          </span>
        ))}
        <button onClick={addTab} className="tab_add">
          +
        </button>
      </div>
      <div className="parameter_add_box">
        <form className="parameter_add_form" onSubmit={handleParameterSubmit}>
          <input id="parameter_input" placeholder="Search parameters" list="params" />
          <datalist id="params">
            {paramNames.map((param) => (
              <option>{param}</option>
            ))}
          </datalist>
          <button id="add_param" type="submit">
            Add
          </button>
        </form>
      </div>

      <div>
        {Array.from(
          (getActiveTab().registeredParameters ?? new Map<string, ParameterValue>()).keys(),
        ).map((key, index, array) => (
          <div className="parameter_list" key={key}>
            <div className="move_buttons">
              <button onClick={() => moveParameter(key, "up")} disabled={index === 0}>
                ⬆️
              </button>
              <button
                onClick={() => moveParameter(key, "down")}
                disabled={index === array.length - 1}
              >
                ⬇️
              </button>
            </div>
            <label className="parameter_name">{key}</label>
            <input
              id="param_type"
              type="text"
              value={getParameterType(getActiveTab().registeredParameters.get(key)?.parameterValue)}
              readOnly
            />
            <input
              id="change_param"
              type="text"
              value={getActiveTab().registeredParameters.get(key)?.inputField}
              onChange={(e) => onParameterChange(key, e)}
            />
            <button className="delete_param" onClick={() => removeParameter(key)}>
              x
            </button>
          </div>
        ))}
      </div>
      <div>
        <button onClick={saveParameters} disabled={buttonLoading}>
          Save config to JSON
        </button>
        <input type="file" accept="application/json" onChange={loadParametersFromFile} />
      </div>
    </div>
  );
};

export default TabSystem;

/* Helper functions */
function getParameterValue(param: ParameterValue): string | number {
  if (typeof param === "string" || typeof param === "number") {
    return param; // Primitive values
  } else if (typeof param == "boolean") {
    return param === true ? "true" : "false";
  } else {
    return "what the sigma";
  }
}

function isNumber(val: any): boolean {
  return !isNaN(parseFloat(val)) && isFinite(val);
}
