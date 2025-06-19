import { createContext, useContext, useEffect } from "react";

export const ShadowRootContext = createContext<ShadowRoot | null>(null);

export function useShadowRoot() {
  return useContext(ShadowRootContext);
}

type CSSFile = {
  id: string;
  cssText: string;
};

export function useInjectGlobalStyle(files: CSSFile[]) {
  const shadowRoot = useShadowRoot();

  useEffect(() => {
    if (!shadowRoot) return;

    for (const { id, cssText } of files) {
      if (shadowRoot.querySelector(`style[data-id="${id}"]`)) continue;

      const style = document.createElement("style");
      style.setAttribute("data-id", id);
      style.textContent = cssText;
      shadowRoot.appendChild(style);
    }
  }, [files, shadowRoot]);
}