// ==UserScript==
// @name         Dataverse injector
// @namespace    http://tampermonkey.net/
// @version      2025-05-19
// @description  Inject custom React app into live Dataverse instance
// @match        https://dataverse.eosc.dansdemo.nl/dataset.xhtml*
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

    // Wait till ReactAppMount is available
    const interval = setInterval(() => {
        // Add mounting element
        const anchor = document.getElementById('actionButtonBlock');
        let mount = document.getElementById('dans-dv-react-root');
        if (!mount) {
            mount = document.createElement('div');
            mount.id = 'dans-dv-react-root';

            if (anchor) {
                anchor.appendChild(mount); // ✅ insert inside, preserving existing content
            } else {
                document.body.appendChild(mount); // fallback if anchor not found
            }
        }


        if (window.ReactAppMount) {
            window.ReactAppMount(mount);
            clearInterval(interval);
        }
    }, 500);
})();