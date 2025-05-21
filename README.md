# React plugin for Dataverse
This plugin lets you configure advanced editing functions for metadata inside Dataverse.

## How to setup your dev env
* Grab the plugin [Tampermonkey](https://www.tampermonkey.net/) for your browser, and make sure developer mode is active (if using Chrome)
* Grab a CORS unblocking plugin for your browser to bypass CORS requests on the appropriate Dataverse URL (needed for script injection from localhost)
* Add a new script, and paste in the contents of the appropriate apps/{appName}/tamperMonkeyScipt.js (be sure to adjust your dev server address if needed)
* Install dependencies `pnpm i`
* Run the app dev server, e.g. `pnpm dev:eosc`
* Visit the appropriate Dataverse site and select a dataset. You should see an Advanced Edit button rendered below the default editing action buttons.