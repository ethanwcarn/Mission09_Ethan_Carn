import { useEffect, useState } from "react";
import "./App.css";
import teamsData from "./CollegeBasketballTeams.json";

// Define the shape of one team entry from the JSON file.
// This keeps props strongly typed and improves readability.
type TeamInfo = {
  tid: number;
  school: string;
  name: string;
  city: string;
  state: string;
  abbrev: string;
};

type CfbTeam = {
  school?: string;
  logos?: string[];
};

type EspnTeamContainer = {
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    logos?: Array<{ href?: string }>;
  };
};

type EspnApiResponse = {
  sports?: Array<{
    leagues?: Array<{
      teams?: EspnTeamContainer[];
    }>;
  }>;
};

type FilterMode = "alphabetical" | "state" | "logo-success" | "logo-unsuccessful";

// Pull just the "teams" array from the imported JSON object.
// We cast it to TeamInfo[] so TypeScript can validate our component props.
const teams = teamsData.teams as TeamInfo[];

// Build a normalized key so school names from two different data sources
// can be compared safely even if punctuation/spacing differs.
function normalizeSchoolName(school: string): string {
  return school.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Build a short label for the final visual fallback.
// Priority:
// 1) Provided abbreviation from the JSON data.
// 2) First letters of school words (ignoring small connector words).
function createTeamAcronym(school: string, abbrev?: string): string {
  const cleanedAbbrev = (abbrev || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (cleanedAbbrev) {
    return cleanedAbbrev.slice(0, 4);
  }

  const ignoredWords = new Set(["of", "the", "and", "at", "for", "to"]);
  const letters = school
    .split(/[\s-]+/)
    .filter((word) => word && !ignoredWords.has(word.toLowerCase()))
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  if (letters) {
    return letters.slice(0, 4);
  }

  return school.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 4) || "TEAM";
}

// Resolve the best available external logo URL for a school (if one exists).
function getResolvedLogoUrl(
  school: string,
  logosBySchool: Record<string, string>,
  espnLogosBySchool: Record<string, string>,
): string | undefined {
  const normalizedSchool = normalizeSchoolName(school);
  return logosBySchool[normalizedSchool] || espnLogosBySchool[normalizedSchool];
}

// Component #1:
// Displays a clear heading that introduces the purpose of the page.
function HeadingSection() {
  return <h1>NCAA College Basketball Teams</h1>;
}

// This extra component helps satisfy the "at least three components used in App"
// requirement and gives users context for what is being displayed.
function PageDescription() {
  return (
    <p className="page-description">
      Browse each school&apos;s name, mascot, and location from the provided JSON
      data set. Team logos are loaded from the CFBD API when a key is provided.
    </p>
  );
}

// Show users exactly how to enable CFBD logos after cloning the project.
// This helps because API keys are typically kept out of source control.
function ApiSetupInstructions() {
  return (
    <section className="api-setup-box">
      <h2>Enable School Logos (One-Time Setup)</h2>
      <ol>
        <li>Create a free account at CollegeFootballData.com and generate an API key.</li>
        <li>Copy `frontend/.env.example` to `frontend/.env`.</li>
        <li>Open `frontend/.env` and set: `VITE_CFBD_API_KEY=your_api_key_here`</li>
        <li>Save the file and restart the app with `npm run dev` inside `frontend`.</li>
      </ol>
      <p>
        If no key is set, the app still runs and uses ESPN/acronym logo fallbacks.
      </p>
    </section>
  );
}

// Component #3:
// Iterates through all teams and renders one TeamCard per school.
function TeamList({
  teamsToShow,
  logosBySchool,
  espnLogosBySchool,
}: {
  teamsToShow: TeamInfo[];
  logosBySchool: Record<string, string>;
  espnLogosBySchool: Record<string, string>;
}) {
  return (
    <section className="team-list">
      {teamsToShow.map((team) => (
        <TeamCard
          key={team.tid}
          school={team.school}
          name={team.name}
          city={team.city}
          state={team.state}
          abbrev={team.abbrev}
          logoUrl={logosBySchool[normalizeSchoolName(team.school)]}
          espnLogoUrl={espnLogosBySchool[normalizeSchoolName(team.school)]}
        />
      ))}
    </section>
  );
}

// Logo fallback chain:
// 1) CFBD logo URL from private key-based API
// 2) ESPN logo URL from public endpoint/CDN
// 3) Acronym circle generated from team abbreviation
function TeamLogo({
  school,
  abbrev,
  logoUrl,
  espnLogoUrl,
}: {
  school: string;
  abbrev: string;
  logoUrl?: string;
  espnLogoUrl?: string;
}) {
  const [logoSource, setLogoSource] = useState<"cfbd" | "espn" | "acronym">(
    logoUrl ? "cfbd" : espnLogoUrl ? "espn" : "acronym",
  );

  // Reset the source when props change.
  useEffect(() => {
    setLogoSource(logoUrl ? "cfbd" : espnLogoUrl ? "espn" : "acronym");
  }, [logoUrl, espnLogoUrl]);

  const currentLogoUrl = logoSource === "cfbd" ? logoUrl : espnLogoUrl;

  if (logoSource === "acronym" || !currentLogoUrl) {
    return <div className="team-logo-fallback">{createTeamAcronym(school, abbrev)}</div>;
  }

  return (
    <img
      className="team-logo"
      src={currentLogoUrl}
      alt={`${school} logo`}
      onError={() => {
        if (logoSource === "cfbd" && espnLogoUrl) {
          setLogoSource("espn");
          return;
        }
        setLogoSource("acronym");
      }}
    />
  );
}

// Component #2:
// A reusable "card" that shows the required team information.
function TeamCard({
  school,
  name,
  city,
  state,
  abbrev,
  logoUrl,
  espnLogoUrl,
}: {
  school: string;
  name: string;
  city: string;
  state: string;
  abbrev: string;
  logoUrl?: string;
  espnLogoUrl?: string;
}) {
  return (
    <article className="team-card">
      <TeamLogo
        school={school}
        abbrev={abbrev}
        logoUrl={logoUrl}
        espnLogoUrl={espnLogoUrl}
      />
      <h2>{school}</h2>
      <h3>Mascot: {name || "No mascot listed"}</h3>
      <h3>
        Location: {city}, {state}
      </h3>
    </article>
  );
}

// App composes the page by using three separate components:
// HeadingSection, PageDescription, and TeamList.
function App() {
  const [logosBySchool, setLogosBySchool] = useState<Record<string, string>>({});
  const [espnLogosBySchool, setEspnLogosBySchool] = useState<Record<string, string>>(
    {},
  );
  const [logoStatusMessage, setLogoStatusMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pendingFilterMode, setPendingFilterMode] = useState<FilterMode>("alphabetical");
  const [appliedFilterMode, setAppliedFilterMode] =
    useState<FilterMode>("alphabetical");

  useEffect(() => {
    // Vite exposes client-safe env variables that start with VITE_.
    const apiKey = import.meta.env.VITE_CFBD_API_KEY;

    // Keep fetch logic in a separate async function inside useEffect.
    async function loadLogos(): Promise<void> {
      const cfbdLogos: Record<string, string> = {};
      const espnLogos: Record<string, string> = {};
      const statusParts: string[] = [];

      // Primary source: CFBD API (requires key).
      if (apiKey) {
        try {
          const cfbdResponse = await fetch(
            "https://api.collegefootballdata.com/teams",
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );

          if (cfbdResponse.status === 429) {
            statusParts.push("CFBD rate limit reached; using backups.");
          } else if (!cfbdResponse.ok) {
            statusParts.push(`CFBD unavailable (status ${cfbdResponse.status}).`);
          } else {
            const cfbdTeams = (await cfbdResponse.json()) as CfbTeam[];
            for (const cfbdTeam of cfbdTeams) {
              if (!cfbdTeam.school || !cfbdTeam.logos?.length) {
                continue;
              }
              cfbdLogos[normalizeSchoolName(cfbdTeam.school)] = cfbdTeam.logos[0];
            }
          }
        } catch {
          statusParts.push("CFBD request failed; using backups.");
        }
      } else {
        statusParts.push("No CFBD key set; using backup logo sources.");
      }

      // First backup source: ESPN public endpoint and CDN pattern.
      try {
        const espnResponse = await fetch(
          "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams",
        );

        if (!espnResponse.ok) {
          statusParts.push(`ESPN API unavailable (status ${espnResponse.status}).`);
        } else {
          const espnData = (await espnResponse.json()) as EspnApiResponse;
          const espnTeams = espnData.sports?.[0]?.leagues?.[0]?.teams ?? [];

          for (const teamContainer of espnTeams) {
            const team = teamContainer.team;
            if (!team?.displayName) {
              continue;
            }

            const explicitLogo = team.logos?.[0]?.href;
            const cdnLogo = team.id
              ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.id}.png`
              : undefined;
            const selectedLogo = explicitLogo || cdnLogo;

            if (!selectedLogo) {
              continue;
            }

            espnLogos[normalizeSchoolName(team.displayName)] = selectedLogo;
            if (team.shortDisplayName) {
              espnLogos[normalizeSchoolName(team.shortDisplayName)] = selectedLogo;
            }
          }
        }
      } catch {
        statusParts.push("ESPN logo source unavailable.");
      }

      setLogosBySchool(cfbdLogos);
      setEspnLogosBySchool(espnLogos);
      setLogoStatusMessage(statusParts.join(" "));
    }

    loadLogos();
  }, []);

  // First apply text search against the school name.
  const searchedTeams = teams.filter((team) =>
    team.school.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );

  // Then apply the selected filter/sort mode from the button.
  let visibleTeams = [...searchedTeams];

  if (appliedFilterMode === "logo-success") {
    visibleTeams = visibleTeams
      .filter((team) =>
        Boolean(getResolvedLogoUrl(team.school, logosBySchool, espnLogosBySchool)),
      )
      .sort((a, b) => a.school.localeCompare(b.school));
  } else if (appliedFilterMode === "logo-unsuccessful") {
    visibleTeams = visibleTeams
      .filter(
        (team) =>
          !getResolvedLogoUrl(team.school, logosBySchool, espnLogosBySchool),
      )
      .sort((a, b) => a.school.localeCompare(b.school));
  } else if (appliedFilterMode === "state") {
    visibleTeams = visibleTeams.sort(
      (a, b) => a.state.localeCompare(b.state) || a.school.localeCompare(b.school),
    );
  } else {
    visibleTeams = visibleTeams.sort((a, b) => a.school.localeCompare(b.school));
  }

  return (
    <main className="app-container">
      <HeadingSection />
      <PageDescription />
      <ApiSetupInstructions />
      {logoStatusMessage ? (
        <p className="logo-status-message">{logoStatusMessage}</p>
      ) : null}
      <section className="controls-row">
        <input
          className="search-input"
          type="text"
          placeholder="Search by college name..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select
          className="filter-select"
          value={pendingFilterMode}
          onChange={(event) =>
            setPendingFilterMode(event.target.value as FilterMode)
          }
        >
          <option value="alphabetical">Sort: Alphabetical (A-Z)</option>
          <option value="state">Sort: By State</option>
          <option value="logo-success">Filter: Logo loaded successfully</option>
          <option value="logo-unsuccessful">Filter: Logo not loaded</option>
        </select>
        <button
          className="filter-button"
          type="button"
          onClick={() => setAppliedFilterMode(pendingFilterMode)}
        >
          Apply Filter
        </button>
      </section>
      <p className="results-count">Showing {visibleTeams.length} colleges</p>
      <TeamList
        teamsToShow={visibleTeams}
        logosBySchool={logosBySchool}
        espnLogosBySchool={espnLogosBySchool}
      />
    </main>
  );
}

export default App;
