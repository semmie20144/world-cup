import {
  Client,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
} from "discord.js";
import {
  getLiveMatches,
  getTodayMatches,
  getRecentResults,
  getTopScorers,
  getStandings,
} from "./footballApi.js";
import { getLatestHighlights, searchWC2026Videos } from "./youtube.js";
import {
  buildLiveMatchEmbed,
  buildUpcomingMatchEmbed,
  buildResultEmbed,
  buildTopScorersEmbed,
  buildStandingsEmbed,
  buildVideoEmbed,
  buildHelpEmbed,
} from "./embeds.js";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

if (!BOT_TOKEN) throw new Error("Missing DISCORD_BOT_TOKEN environment variable");
if (!CHANNEL_ID) throw new Error("Missing DISCORD_CHANNEL_ID environment variable");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendToChannel(embeds, content) {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !(channel instanceof TextChannel)) {
      console.error("Channel not found or not a text channel:", CHANNEL_ID);
      return;
    }
    for (let i = 0; i < embeds.length; i += 10) {
      await channel.send({ content: i === 0 ? content : undefined, embeds: embeds.slice(i, i + 10) });
    }
  } catch (err) {
    console.error("Failed to send message:", err.message);
  }
}

function noData(title, description) {
  return [new EmbedBuilder().setColor(0xffaa00).setTitle(title).setDescription(description)
    .setFooter({ text: "FIFA World Cup 2026" }).toJSON()];
}

// ─── Command Handlers ────────────────────────────────────────────────────────

async function handleLive() {
  const matches = await getLiveMatches();
  return matches.length
    ? matches.map(buildLiveMatchEmbed)
    : noData("⚽ No live matches right now", "Check back during match time or use `!wc today`.");
}

async function handleToday() {
  const matches = await getTodayMatches();
  if (!matches.length) return noData("📅 No fixtures today", "Use `!wc results` for recent results.");
  return matches.map((m) =>
    m.status === "Not Started" ? buildUpcomingMatchEmbed(m) : buildLiveMatchEmbed(m)
  );
}

async function handleResults() {
  const matches = await getRecentResults();
  return matches.length
    ? matches.map(buildResultEmbed)
    : noData("🏁 No recent results", "No finished matches found yet.");
}

async function handleScorers() {
  return [buildTopScorersEmbed(await getTopScorers())];
}

async function handleStandings() {
  return [buildStandingsEmbed(await getStandings())];
}

async function handleHighlights(query) {
  const videos = query ? await searchWC2026Videos(query) : await getLatestHighlights();
  if (!videos.length) {
    const msg = process.env.YOUTUBE_API_KEY
      ? "No recent highlights found. Try `!wc highlights <team name>`."
      : "Add a YOUTUBE_API_KEY env var to enable video search.";
    return noData("🎬 No videos found", msg);
  }
  return videos.map(buildVideoEmbed);
}

// ─── Auto-poster ─────────────────────────────────────────────────────────────

let lastLiveIds = new Set();
let lastHighlightUrls = new Set();

async function pollLive() {
  try {
    const matches = await getLiveMatches();
    if (!matches.length) return;
    const hasNew = matches.some((m) => !lastLiveIds.has(m.fixtureId));
    const is15min = matches.some((m) => m.elapsed && m.elapsed % 15 === 0);
    if (hasNew || is15min) {
      await sendToChannel(matches.map(buildLiveMatchEmbed), "🔴 **Live World Cup 2026 Update!**");
      lastLiveIds = new Set(matches.map((m) => m.fixtureId));
    }
  } catch (err) {
    console.error("Live poll error:", err.message);
  }
}

async function pollHighlights() {
  try {
    const videos = await getLatestHighlights();
    const newVideos = videos.filter((v) => !lastHighlightUrls.has(v.url));
    if (newVideos.length) {
      await sendToChannel(newVideos.map(buildVideoEmbed), "🎬 **New World Cup 2026 Highlights!**");
      newVideos.forEach((v) => lastHighlightUrls.add(v.url));
    }
  } catch (err) {
    console.error("Highlights poll error:", err.message);
  }
}

// ─── Bot Events ──────────────────────────────────────────────────────────────

client.once("clientReady", async () => {
  console.log(`✅ Bot ready: ${client.user.tag}`);

  // Startup: post help + today's fixtures
  setTimeout(async () => {
    await sendToChannel([buildHelpEmbed()], "⚽ **WC 2026 Bot is online!** Here's what I can do:");
    const todayEmbeds = await handleToday();
    await sendToChannel(todayEmbeds, "📅 **Today's World Cup 2026 Fixtures:**");
    // Initial highlights check
    await pollHighlights();
  }, 3000);

  // Poll live scores every 2 minutes
  setInterval(pollLive, 2 * 60 * 1000);
  // Poll highlights every hour
  setInterval(pollHighlights, 60 * 60 * 1000);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const content = message.content.trim().toLowerCase();
  if (!content.startsWith("!wc")) return;

  const parts = content.split(/\s+/);
  const sub = parts[1] ?? "help";
  const extra = parts.slice(2).join(" ");

  let embeds = [];
  try {
    switch (sub) {
      case "live":       embeds = await handleLive(); break;
      case "today":      embeds = await handleToday(); break;
      case "results":    embeds = await handleResults(); break;
      case "scorers":    embeds = await handleScorers(); break;
      case "standings":  embeds = await handleStandings(); break;
      case "highlights": embeds = await handleHighlights(extra || undefined); break;
      default:           embeds = [buildHelpEmbed()]; break;
    }
    for (let i = 0; i < embeds.length; i += 10) {
      await message.reply({ embeds: embeds.slice(i, i + 10) });
    }
  } catch (err) {
    console.error("Command error:", err.message);
    await message.reply("❌ Something went wrong. Please try again.");
  }
});

client.login(BOT_TOKEN).catch((err) => {
  console.error("Login failed:", err.message);
  process.exit(1);
});
