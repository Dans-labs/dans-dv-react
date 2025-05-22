import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Helper to extract the host, owner, and repo from a Git URL
function extractRepoInfo(repoUrl: string) {
  try {
    const url = new URL(repoUrl.trim());
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean); // trim trailing slash

    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, ""); // strip .git

    return { host, owner, repo };
  } catch {
    return null;
  }
}

// Timeout helper, to abort fetch requests after a specified time
async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// TODO Should be on proxy/server to avoid CORS issues
export const codemetaApi = createApi({
  reducerPath: "codemetaApi",
  baseQuery: fetchBaseQuery(),
  endpoints: (build) => ({
    fetchCodemeta: build.query<any, string>({
      async queryFn(repoUrl) {
        const info = extractRepoInfo(repoUrl);
        if (!info) {
          return {
            error: {
              status: 400,
              data: "This doesn't look like a valid Git repository URL. Please check the format (e.g., https://github.com/user/repo).",
            },
          };
        }

        const { host, owner, repo } = info;

        try {
          let branch = "main";
          let rawUrl = "";

          if (host === "github.com") {
            const res = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`);
            if (!res.ok) {
              return { error: { status: res.status, data: "GitHub repository not found or inaccessible." } };
            }
            const data = await res.json();
            branch = data.default_branch || "main";
            rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/codemeta.json`;
          }

          else if (host === "gitlab.com") {
            const encoded = encodeURIComponent(`${owner}/${repo}`);
            const res = await fetchWithTimeout(`https://gitlab.com/api/v4/projects/${encoded}`);
            if (!res.ok) {
              return { error: { status: res.status, data: "GitLab repository not found or inaccessible." } };
            }
            const data = await res.json();
            branch = data.default_branch || "main";
            rawUrl = `https://gitlab.com/${owner}/${repo}/-/raw/${branch}/codemeta.json`;
          }

          else if (host === "bitbucket.org") {
            const res = await fetchWithTimeout(`https://api.bitbucket.org/2.0/repositories/${owner}/${repo}`);
            if (!res.ok) {
              return { error: { status: res.status, data: "Bitbucket repository not found or inaccessible." } };
            }
            const data = await res.json();
            branch = data.mainbranch?.name || "main";
            rawUrl = `https://bitbucket.org/${owner}/${repo}/raw/${branch}/codemeta.json`;
          }

          else {
            return {
              error: {
                status: 400,
                data: `The host "${host}" is not supported. Currently, we support GitHub, GitLab, and Bitbucket.`,
              },
            };
          }

          const fileRes = await fetchWithTimeout(rawUrl);
          if (!fileRes.ok) {
            return {
              error: {
                status: fileRes.status,
                data: `We couldn't find a codemeta.json file in this repository (branch: ${branch}). Please make sure it exists.`,
              },
            };
          }

          const json = await fileRes.json();
          return { data: json };
        } catch (err) {
          const message = err instanceof Error
            ? err.name === "AbortError"
              ? "The request timed out. Please try again."
              : err.message
            : String(err);
          return { error: { status: 500, data: message || "Something went wrong. Please try again." } };
        }
      },
    }),
  }),
});

export const { useLazyFetchCodemetaQuery, useFetchCodemetaQuery } = codemetaApi;
