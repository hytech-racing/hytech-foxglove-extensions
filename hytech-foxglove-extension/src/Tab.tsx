import React, { useState } from 'react';
import { Immutable, PanelExtensionContext, ParameterValue } from "@foxglove/extension";

/* Tab */
type RegisteredParameter = {
    parameterValue: ParameterValue;
    inputField: string;
}

interface Tab { 
    id: string;
    name: string;
    registeredParameters: Map<string, RegisteredParameter>;
}

type TabSystemProps = {
    parameters: undefined | Immutable<Map<string, ParameterValue>>;
    setParameters: React.Dispatch<React.SetStateAction<undefined | Immutable<Map<string, ParameterValue>>>>;
    pExtensionContext: PanelExtensionContext
}

/* Final export */

const TabSystem: React.FC<TabSystemProps> = ({parameters, setParameters, pExtensionContext}) =>  {
    
    const [tabs, setTabs] = useState<Tab[]>([{id: '1', name: "Tab 1", registeredParameters: new Map<string, RegisteredParameter>()}]);
    const [activeTab, setActiveTab] = useState<string>('1');

    // Tabs
    const addTab = () => {
        const newTab: Tab = {
            id: Date.now().toString(),
            name: 'New Tab',
            registeredParameters: new Map<string, RegisteredParameter>()
        };
        setTabs([...tabs, newTab]);
        setActiveTab(newTab.id);
    };

    const deleteTab = (id: string) => {
        if (tabs.length > 1) {
            const newTabs: Tab[] = tabs.filter(tab => tab.id !== id);
            setTabs(newTabs);

            if (activeTab === id) {
                setActiveTab(newTabs[0]?.id || '');
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
        return tab ?? {
            id: Date.now().toString(),
            name: 'New Tab',
            registeredParameters: new Map<string, RegisteredParameter>()
        };
    };

    const renameTab = (id: string, newName: string) => {
        const newTabs = tabs.map(tab => tab.id == id ? {...tab, name: newName} : tab);
        setTabs(newTabs);
    };

    // Adding paramaters
    let paramNames: string[] = Array.from((parameters ?? new Map<string, ParameterValue>()).keys());

    const handleParameterSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formElements = form.elements as typeof form.elements & {
            parameter_input: {value: string}
        }
        if (paramNames.includes(formElements.parameter_input.value)) {
            onParameterSubmit(formElements.parameter_input.value)
        }
    };

    const onParameterSubmit = (newParam: string) => {   
        const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab);
        if (activeTabIndex === -1) return;

        const tab = tabs[activeTabIndex]; 
        if (tab !== null && tab?.registeredParameters.get(newParam) == undefined) { // If parameter isn't registered, add it
            let updatedParameters = new Map(tab?.registeredParameters);
            updatedParameters.set(
                newParam, 
                { parameterValue: parameters?.get(newParam) as ParameterValue, inputField: parameters?.get(newParam) as string}
            );
            
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

        const updatedParameter: RegisteredParameter = { ...paramToChange };

        if (typeof paramToChange.parameterValue === "string") {
            updatedParameter.parameterValue = newValue;
        } else if (typeof paramToChange.parameterValue === "number") {
            updatedParameter.parameterValue = isFinite(+newValue) ? +newValue : paramToChange.parameterValue;
        } else if (typeof paramToChange.parameterValue === "boolean") {
            updatedParameter.parameterValue = newValue.toLowerCase() === "true";
        } else {
            console.error(`Unsupported parameter type for ${paramKey}`);
        }

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

    }

    return (
        <div>
            <div className="tab_box">
                {
                    tabs.map(tab => (
                        <div key={tab.id} className="tab" onClick={() => setActiveTab(tab.id)}>
                            <input type="text" value={tab.name} onChange={(e) => renameTab(tab.id, e.target.value)} className="tab_input" />
                            <button className="delete" onClick={(e) => {
                                e.stopPropagation();
                                deleteTab(tab.id);
                            }}>x</button>
                        </div>
                    ))
                }
            </div>
            <button onClick={addTab} className="add_tab">+</button>
            <div> 
                <form onSubmit={handleParameterSubmit}>
                    <input id="parameter_input" placeholder="Search parameters" list="params" />
                    <datalist id="params">
                        {paramNames.map((param) => (
                            <option>{param}</option>
                        ))}
                    </datalist>
                    <button id="add_param" type="submit">Add</button>
                </form>
            </div>
            <div>
                {Array.from((getActiveTab().registeredParameters ?? new Map<string, ParameterValue>()).keys()).map((key) => (
                    <div>
                        <label>{key}</label>
                        <input id="change_param" type="text" value={getActiveTab().registeredParameters.get(key)?.inputField} onChange={(e) => onParameterChange(key, e)} />
                        <label>{getParameterValue(getActiveTab().registeredParameters.get(key)?.parameterValue)}</label>
                    </div>
                ))}
            </div>
        </div>
    )

}

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