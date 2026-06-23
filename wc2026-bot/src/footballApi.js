import axios from "axios";

const BASE = "https://v3.football.api-sports.io";
const LEAGUE_ID = 1; // FIFA World Cup
const SEASON = 2026;

const client = axios.create({
  baseURL: BASE,
  headers: {
    "x-apisports-key": process.env.FOOTBALL_API_KEY ?? "",
  },
});

export async function getLiveMatches() {
  try {
    const res = await client.get("/fixtures", {
      params: { live: "all", league: LEAGUE_ID, season: SEASON },
    });
    return mapFixtures(res.data.response ?? []);
  } catch { return []; }
}

export async function getTodayMatches() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await client.get("/fixtures", {
      params: { date: today, league: LEAGUE_ID, season: SEASON },
    });
    return mapFixtures(res.data.response ?? []);
  } catch { return []; }
}

export async function getRecentResults() {
  try {
    const res = await client.get("/fixtures", {
      params: { league: LEAGUE_ID, season: SEASON, last: 5, status: "FT" },
    });
    return mapFixtures(res.data.response ?? []);
  } catch { return []; }
}

export async function getTopScorers() {
  try {
    const res = await client.get("/players/topscorers", {
      params: { league: LEAGUE_ID, season: SEASON },
    });
    return (res.data.response ?? []).slice(0, 5).map((r) => ({
      player: r.player.name,
      team: r.statistics[0]?.team?.name ?? "N/A",
      goals: r.statistics[0]?.goals?.total ?? 0,
      photo: r.player.photo,
    }));
  } catch { return []; }
}

export async function getStandings() {
  try {
    const res = await client.get("/standings", {
      params: { league: LEAGUE_ID, season: SEASON },
    });
    const groups = [];
    const leagueStandings = res.data.response?.[0]?.league?.standings ?? [];
    for (const group of leagueStandings) {
      for (const team of group) {
        groups.push({
          rank: team.rank,
          team: team.team.name,
          logo: team.team.logo,
          played: team.all.played,
          won: team.all.win,
          drawn: team.all.draw,
          lost: team.all.lose,
          points: team.points,
          group: team.group ?? "Group",
        });
      }
    }
    return groups;
  } catch { return []; }
}

function mapFixtures(fixtures) {
  return fixtures.map((f) => ({
    fixtureId: f.fixture.id,
    date: f.fixture.date,
    status: f.fixture.status.long,
    homeTeam: f.teams.home.name,
    homeLogo: f.teams.home.logo,
    awayTeam: f.teams.away.name,
    awayLogo: f.teams.away.logo,
    homeGoals: f.goals.home,
    awayGoals: f.goals.away,
    venue: f.fixture.venue?.name ?? "TBD",
    elapsed: f.fixture.status.elapsed,
  }));
}
