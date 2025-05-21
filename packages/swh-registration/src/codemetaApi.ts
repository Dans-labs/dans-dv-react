import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Helper to extract the host, owner, and repo from a Git URL
function extractRepoInfo(repoUrl: string) {
  try {
    const url = new URL(repoUrl);
    const host = url.hostname;
    const parts = url.pathname.split('/').filter(Boolean);
    const owner = parts[0];
    const repo = parts[1]?.replace(/\.git$/, '');
    return { host, owner, repo };
  } catch {
    return null;
  }
}

export const codemetaApi = createApi({
  reducerPath: "codemetaApi",
  baseQuery: fetchBaseQuery(),
  endpoints: (build) => ({
    fetchCodemeta: build.query<any, string>({
      async queryFn(repoUrl) {
        const info = extractRepoInfo(repoUrl);
        if (!info) return { error: { status: 400, data: 'Invalid repo URL' } };

        const { host, owner, repo } = info;

        try {
          let branch = 'main';
          let rawUrl = '';

          if (host === 'github.com') {
            const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            if (!apiRes.ok) return { error: { status: apiRes.status, data: 'GitHub repo not found' } };
            const repoData = await apiRes.json();
            branch = repoData.default_branch || 'main';
            rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/codemeta.json`;
          }

          else if (host === 'gitlab.com') {
            const encoded = encodeURIComponent(`${owner}/${repo}`);
            const apiRes = await fetch(`https://gitlab.com/api/v4/projects/${encoded}`);
            if (!apiRes.ok) return { error: { status: apiRes.status, data: 'GitLab repo not found' } };
            const repoData = await apiRes.json();
            branch = repoData.default_branch || 'main';
            rawUrl = `https://gitlab.com/${owner}/${repo}/-/raw/${branch}/codemeta.json`;
          }

          else if (host === 'bitbucket.org') {
            const apiRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${owner}/${repo}`);
            if (!apiRes.ok) return { error: { status: apiRes.status, data: 'Bitbucket repo not found' } };
            const repoData = await apiRes.json();
            branch = repoData.mainbranch?.name || 'main';
            rawUrl = `https://bitbucket.org/${owner}/${repo}/raw/${branch}/codemeta.json`;
          }

          else {
            return { error: { status: 400, data: 'Unsupported git host' } };
          }

          const fileRes = await fetch(rawUrl);
          if (!fileRes.ok) return { error: { status: fileRes.status, data: 'codemeta.json not found' } };
          const json = await fileRes.json();
          return { data: json };

        } catch (err: any) {
          return { error: { status: 500, data: err.message || 'Unknown error' } };
        }
      },
    }),
  }),
});

export const { useLazyFetchCodemetaQuery } = codemetaApi;
