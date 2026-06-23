import { EmbedBuilder } from "discord.js";

const WC_COLOR = 0xFFD700;
const LIVE_COLOR = 0xFF4444;
const VIDEO_COLOR = 0xFF0000;

export function buildLiveMatchEmbed(match) {
  const score = match.homeGoals !== null && match.awayGoals !== null
    ? `**${match.homeGoals} - ${match.awayGoals}**` : "vs";
  const elapsed = match.elapsed ? ` (${match.elapsed}')` : "";
  return new EmbedBuilder()
    .setColor(LIVE_COLOR)
    .setTitle(`🔴 LIVE${elapsed}: ${match.homeTeam} ${score} ${match.awayTeam}`)
    .setDescription(`📍 ${match.venue}`)
    .addFields(
      { name: "Home", value: match.homeTeam, inline: true },
      { name: "Score", value: score, inline: true },
      { name: "Away", value: match.awayTeam, inline: true },
      { name: "Status", value: match.status, inline: false },
    )
    .setThumbnail(match.homeLogo)
    .setFooter({ text: "FIFA World Cup 2026" })
    .setTimestamp()
    .toJSON();
}

export function buildUpcomingMatchEmbed(match) {
  const ts = Math.floor(new Date(match.date).getTime() / 1000);
  return new EmbedBuilder()
    .setColor(WC_COLOR)
    .setTitle(`⚽ Upcoming: ${match.homeTeam} vs ${match.awayTeam}`)
    .addFields(
      { name: "Kickoff", value: `<t:${ts}:F>`, inline: false },
      { name: "Venue", value: match.venue, inline: true },
    )
    .setThumbnail(match.homeLogo)
    .setFooter({ text: "FIFA World Cup 2026" })
    .toJSON();
}

export function buildResultEmbed(match) {
  const score = `${match.homeGoals ?? 0} - ${match.awayGoals ?? 0}`;
  const winner = (match.homeGoals ?? 0) > (match.awayGoals ?? 0)
    ? match.homeTeam
    : (match.awayGoals ?? 0) > (match.homeGoals ?? 0)
    ? match.awayTeam : "Draw";
  return new EmbedBuilder()
    .setColor(WC_COLOR)
    .setTitle(`🏁 FT: ${match.homeTeam} ${score} ${match.awayTeam}`)
    .addFields(
      { name: "Result", value: winner === "Draw" ? "🤝 Draw" : `🏆 ${winner} wins!`, inline: false },
      { name: "Venue", value: match.venue, inline: true },
    )
    .setThumbnail(match.homeLogo)
    .setFooter({ text: "FIFA World Cup 2026" })
    .setTimestamp()
    .toJSON();
}

export function buildTopScorersEmbed(scorers) {
  const desc = scorers.length
    ? scorers.map((s, i) => `**${i + 1}.** ${s.player} (${s.team}) — ⚽ ${s.goals} goals`).join("\n")
    : "No data available yet.";
  return new EmbedBuilder()
    .setColor(WC_COLOR)
    .setTitle("🥇 WC 2026 — Top Scorers")
    .setDescription(desc)
    .setFooter({ text: "FIFA World Cup 2026" })
    .setTimestamp()
    .toJSON();
}

export function buildStandingsEmbed(standings) {
  const groups = {};
  for (const s of standings) {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  }
  const embed = new EmbedBuilder()
    .setColor(WC_COLOR)
    .setTitle("📊 WC 2026 — Group Standings")
    .setFooter({ text: "FIFA World Cup 2026" })
    .setTimestamp();
  for (const [group, teams] of Object.entries(groups).slice(0, 4)) {
    const value = teams.slice(0, 4)
      .map((t) => `**${t.rank}.** ${t.team} — P:${t.played} W:${t.won} D:${t.drawn} L:${t.lost} **Pts:${t.points}**`)
      .join("\n");
    embed.addFields({ name: group, value: value || "—", inline: false });
  }
  return embed.toJSON();
}

export function buildVideoEmbed(video) {
  return new EmbedBuilder()
    .setColor(VIDEO_COLOR)
    .setTitle(`🎬 ${video.title}`)
    .setURL(video.url)
    .setDescription(`Posted by **${video.channelTitle}**`)
    .setImage(video.thumbnail)
    .setFooter({ text: "FIFA World Cup 2026 Highlights" })
    .setTimestamp(new Date(video.publishedAt))
    .toJSON();
}

export function buildHelpEmbed() {
  return new EmbedBuilder()
    .setColor(WC_COLOR)
    .setTitle("⚽ FIFA World Cup 2026 Bot — Commands")
    .addFields(
      { name: "`!wc live`", value: "Show all currently live matches", inline: false },
      { name: "`!wc today`", value: "Today's fixtures and live scores", inline: false },
      { name: "`!wc results`", value: "Last 5 finished match results", inline: false },
      { name: "`!wc scorers`", value: "Top 5 goal scorers", inline: false },
      { name: "`!wc standings`", value: "Group stage standings table", inline: false },
      { name: "`!wc highlights [team]`", value: "Latest YouTube highlights (optional: team name)", inline: false },
      { name: "`!wc help`", value: "Show this help message", inline: false },
    )
    .setFooter({ text: "Auto-posts live updates every 2 min • Highlights every hour" })
    .toJSON();
}
