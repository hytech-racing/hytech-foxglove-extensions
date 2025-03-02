# User Information

## Installation

Foxglove allows for the exporting of custom parameter panels in .foxe files. This file should be downloaded local, and then draged into the foxglove studio app. Double clicking on the extension results in an "invalid extension .foxe" error. The existing panel is called "parameters-panel".

## Using the extension

When first opening the panel, there are three main areas of interest.

The tab system at the top allows for the creation and renaming of tabs. These custom tabs can also be named by clicking on on them. Each stores a configuration of panels.

The search bar performs the obvious function, searching for existing parameters. These should be coming from whatever server, so when testing in the drivebrain test repository, three parameters show up. To add parameters either click on the add button or press enter after selecting.

The final line has saving and loading of configs. The "Save config to Json" button will save the current layout and values to a json, stored wherever in the file system. Choose file will load a previously stored json file into the configuration. There's currently an issue where after loading a configuration you can't immediately edit parameters, this will be fixed eventually. The current fix is to click "Choose file" a second time, which then allows for editing.

## Current Issues/Bugs

- When loading file, see above.
- Adjusting css to indicate which tab is selected.

# hytech-foxglove-extension

[Foxglove](https://foxglove.dev) allows developers to create [extensions](https://docs.foxglove.dev/docs/visualization/extensions/introduction), or custom code that is loaded and executed inside the Foxglove application. This can be used to add custom panels. Extensions are authored in TypeScript using the `@foxglove/extension` SDK.

## Develop

Extension development uses the `npm` package manager to install development dependencies and run build scripts.

To install extension dependencies, run `npm` from the root of the extension package.

```sh
npm install
```

To build and install the extension into your local Foxglove desktop app, run:

```sh
npm run local-install
```

Open the Foxglove desktop (or `ctrl-R` to refresh if it is already open). Your extension is installed and available within the app.

## Package

Extensions are packaged into `.foxe` files. These files contain the metadata (package.json) and the build code for the extension.

Before packaging, make sure to set `name`, `publisher`, `version`, and `description` fields in _package.json_. When ready to distribute the extension, run:

```sh
npm run package
```

This command will package the extension into a `.foxe` file in the local directory.

## Publish

You can publish the extension to the public registry or privately for your organization.

See documentation here: https://docs.foxglove.dev/docs/visualization/extensions/publish/#packaging-your-extension
