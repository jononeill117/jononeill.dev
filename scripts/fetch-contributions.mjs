#!/usr/bin/env node
/**
 * FETCH CONTRIBUTIONS. jononeill.dev
 *
 * Pulls Jon's GitHub contribution data through the gh CLI (GraphQL) and
 * writes apps/site/src/data/contributions.json, which the contributions
 * board on the home page renders.
 *
 * What GitHub will and will not say:
 *   - The contribution calendar gives a count per day for the last year,
 *     public and private combined.
 *   - restrictedContributionsCount is the private total. GitHub does not
 *     break private contributions down by repository, for anyone, so the
 *     site shows private work as one honest aggregate and never guesses.
 *   - The by-repository endpoints are filtered to public repos only before
 *     anything is written, so a private repo name can never reach the site.
 *
 * Requires: gh CLI, signed in (gh auth login). Run from anywhere:
 *   node scripts/fetch-contributions.mjs
 */

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LOGIN = "jononeill117";

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
      restrictedContributionsCount
      commitContributionsByRepository(maxRepositories: 100) {
        contributions { totalCount }
        repository { nameWithOwner isPrivate url }
      }
      pullRequestContributionsByRepository(maxRepositories: 100) {
        contributions { totalCount }
        repository { nameWithOwner isPrivate url }
      }
    }
  }
}
`;

function ghGraphql() {
  const out = execFileSync(
    "gh",
    ["api", "graphql", "-f", `query=${QUERY}`, "-f", `login=${LOGIN}`],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  return JSON.parse(out);
}

function byRepo(entries) {
  const map = new Map();
  for (const entry of entries) {
    const repo = entry.repository;
    if (repo.isPrivate) continue; // public repos only, by design
    const row = map.get(repo.nameWithOwner) ?? {
      repo: repo.nameWithOwner,
      url: repo.url,
      commits: 0,
      prs: 0,
    };
    map.set(repo.nameWithOwner, row);
  }
  return map;
}

const data = ghGraphql();
const collection = data?.data?.user?.contributionsCollection;
if (!collection) {
  console.error("fetch-contributions: no contributionsCollection in gh response");
  process.exit(1);
}

const days = collection.contributionCalendar.weeks
  .flatMap((week) => week.contributionDays)
  .map((day) => ({ date: day.date, count: day.contributionCount }))
  .sort((a, b) => a.date.localeCompare(b.date));

const repos = byRepo(collection.commitContributionsByRepository);
for (const entry of collection.commitContributionsByRepository) {
  if (entry.repository.isPrivate) continue;
  repos.get(entry.repository.nameWithOwner).commits = entry.contributions.totalCount;
}
for (const entry of collection.pullRequestContributionsByRepository) {
  if (entry.repository.isPrivate) continue;
  const row = repos.get(entry.repository.nameWithOwner);
  if (row) row.prs = entry.contributions.totalCount;
}

const publicRepos = [...repos.values()]
  .map((row) => ({ ...row, total: row.commits + row.prs }))
  .sort((a, b) => b.total - a.total);

const out = {
  user: LOGIN,
  profileUrl: `https://github.com/${LOGIN}`,
  generatedAt: new Date().toISOString().slice(0, 10),
  totalContributions: collection.contributionCalendar.totalContributions,
  privateTotal: collection.restrictedContributionsCount,
  days,
  publicRepos,
};

const target = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "apps/site/src/data/contributions.json",
);
writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);
console.log(
  `fetch-contributions: wrote ${target} (${out.totalContributions} total, ${out.privateTotal} private, ${days.length} days, ${publicRepos.length} public repos)`,
);
