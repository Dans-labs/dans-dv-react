// apiTokenContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

interface ApiTokenContextValue {
  apiToken: string | null;
  loading: boolean;
  error: string | null;
  doi: string | null;
}

const ApiTokenContext = createContext<ApiTokenContextValue>({
  apiToken: null,
  loading: true,
  error: null,
  doi: null,
});

export const useApiToken = () => useContext(ApiTokenContext);

export const ApiTokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doi, setDoi] = useState<string | null>(null);

  useEffect(() => {
    // This function fetches the API token from the Dataverse user page
    const fetchApiToken = async () => {
      try {
        const res = await fetch('/dataverseuser.xhtml?selectTab=apiTokenTab');
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        let token = doc.querySelector('#dataverseUserForm\\:dataRelatedToMeView\\:apiTokenTab code')?.textContent?.trim() || '';

        if (token && !token.startsWith('API Token')) {
          setApiToken(token);
          setLoading(false);
        } else {
          // Reconstruct POST data from hidden fields and submit button
          const form = doc.querySelector('#dataverseUserForm') as HTMLFormElement;
          if (!form) throw new Error('Form not found');

          const formData = new FormData();
          form.querySelectorAll('input[type="hidden"]').forEach(input => {
            const el = input as HTMLInputElement;
            formData.append(el.name, el.value);
          });

          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          if (submitButton?.name) {
            formData.append(submitButton.name, submitButton.value);
          }

          const postRes = await fetch('/dataverseuser.xhtml?selectTab=apiTokenTab', {
            method: 'POST',
            body: formData,
          });

          const postText = await postRes.text();
          const postDoc = parser.parseFromString(postText, 'text/html');
          token = postDoc.querySelector('#dataverseUserForm\\:dataRelatedToMeView\\:apiTokenTab code')?.textContent?.trim() || '';

          setApiToken(token);
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch API token');
        setLoading(false);
      }
    };

    fetchApiToken();

    // Fetch DOI from URL
    const doi = new URL(window.location.href).searchParams.get("persistentId");
    if (doi) {
      setDoi(doi);
    }
  }, []);

  return (
    <ApiTokenContext.Provider value={{ apiToken, loading, error, doi }}>
      {children}
    </ApiTokenContext.Provider>
  );
};
