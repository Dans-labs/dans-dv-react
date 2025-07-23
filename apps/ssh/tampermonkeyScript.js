// ==UserScript==
// @name         Dataverse injector SSH
// @namespace    http://tampermonkey.net/
// @version      2025-07-23
// @description  Inject custom React app into live Dataverse instance
// @match        https://demo.ssh.datastations.nl/dataset.xhtml*
// @grant        none
// ==/UserScript==

const devServer = "http://localhost:5173";

(function() {
    'use strict';

    // Inject Vite client (responsible for HMR)
    const clientScript = document.createElement('script');
    clientScript.type = 'module';
    clientScript.src = `${devServer}/@vite/client`;
    document.head.appendChild(clientScript);

    // Inject Vite React preamble
    const preamble = document.createElement('script');
    preamble.type = 'module';
    preamble.textContent = `
        import RefreshRuntime from "${devServer}/@react-refresh";
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
    `;
    document.head.appendChild(preamble);

    // Load dev bundle from Vite
    const script = document.createElement('script');
    script.type = 'module';
    script.src = `${devServer}/src/main.tsx`;
    document.body.appendChild(script);

})();