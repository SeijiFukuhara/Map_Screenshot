import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import type { Timestamp } from "firebase-admin/firestore";
import type { RouteCard } from "@routecard/shared";
import { db } from "../lib/admin";

// FirestoreのTTLポリシー対象であるexpiresAtだけはTimestamp型で保存されている
// （他の日時項目は@routecard/shared通りISO文字列）
type StoredRouteCard = Omit<RouteCard, "expiresAt"> & { expiresAt: Timestamp };

const hostingDomain = defineString("HOSTING_DOMAIN", {
  default: "https://routecard.example.com",
});

/**
 * /r/{cardId} 用のSSRページ。Firebase Hostingのrewriteでこの関数にルーティングする。
 * LINE等でのOGP展開のためHTMLを直接返す（クライアントJSでの再描画はしない）。
 */
export const renderCard = onRequest(
  { region: "asia-northeast1" },
  async (req, res) => {
    const cardId = req.path.replace(/^\/r\//, "").replace(/\/$/, "");

    if (!cardId) {
      res.status(404).send(renderError("カードが見つかりません"));
      return;
    }

    const snap = await db.collection("routeCards").doc(cardId).get();

    if (!snap.exists) {
      res.status(404).send(renderError("カードが見つかりません"));
      return;
    }

    const stored = snap.data() as StoredRouteCard;

    if (stored.expiresAt.toDate().getTime() < Date.now()) {
      res.status(404).send(renderError("カードが見つかりません"));
      return;
    }

    const card: RouteCard = { ...stored, expiresAt: stored.expiresAt.toDate().toISOString() };
    res.status(200).send(renderCardHtml(cardId, card));
  }
);

function renderCardHtml(cardId: string, card: RouteCard): string {
  const dep = new Date(card.departureTime);
  const arr = new Date(card.arrivalTime);
  const dateLabel = formatDate(dep);
  const title = `${dateLabel} ${formatTime(dep)} ${card.origin.name} → ${card.destination.name}`;
  const transferCount = card.legs.filter((l) => l.mode === "TRANSIT").length - 1;
  const description = `${card.legs.find((l) => l.mode === "TRANSIT")?.lineName ?? ""}・乗換${Math.max(
    transferCount,
    0
  )}回・${formatTime(arr)}着`;

  const cardUrl = `${hostingDomain.value()}/r/${cardId}`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    card.origin.name
  )}&destination=${encodeURIComponent(card.destination.name)}&travelmode=transit`;

  const timeline = card.legs
    .map((leg) => {
      if (leg.mode === "WALK") {
        return `<li class="leg leg-walk">徒歩 ${leg.durationMinutes}分</li>`;
      }
      return `<li class="leg leg-transit">
        <div>${formatTime(new Date(leg.depTime))} ${escapeHtml(leg.depStop)}</div>
        <div class="line">${escapeHtml(leg.lineName ?? "")}${
        leg.headsign ? `（${escapeHtml(leg.headsign)}）` : ""
      }</div>
        <div>${formatTime(new Date(leg.arrTime))} ${escapeHtml(leg.arrStop)}</div>
      </li>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${cardUrl}" />
<meta property="og:type" content="website" />
<style>
  body { font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 16px; }
  header h1 { font-size: 18px; }
  ul.timeline { list-style: none; padding: 0; border-left: 2px solid #ddd; margin-left: 8px; }
  li.leg { padding: 8px 0 8px 16px; }
  li.leg-walk { color: #888; font-size: 14px; }
  .line { color: #555; font-size: 14px; }
  .memo { background: #f5f5f5; padding: 12px; border-radius: 8px; }
  .cta { display: block; text-align: center; padding: 12px; margin-top: 16px; background: #1a73e8; color: #fff; text-decoration: none; border-radius: 8px; }
  .note { color: #888; font-size: 12px; margin-top: 8px; }
  footer { color: #888; font-size: 12px; margin-top: 24px; }
</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(dateLabel)} ${escapeHtml(card.origin.name)} → ${escapeHtml(
    card.destination.name
  )}</h1>
    <p>${formatTime(dep)}発 → ${formatTime(arr)}着</p>
  </header>
  <ul class="timeline">
    ${timeline}
  </ul>
  ${card.memo ? `<p class="memo">メモ: ${escapeHtml(card.memo)}</p>` : ""}
  <a class="cta" href="${mapsUrl}">Googleマップで開く</a>
  <p class="note">時刻はこのカードを参照してください（Googleマップには引き継がれません）</p>
  <footer>${escapeHtml(dateLabel)}時点の検索結果です。最新の運行情報はご確認ください。</footer>
</body>
</html>`;
}

function renderError(message: string): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8" /><title>${message}</title></head><body><p>${message}</p></body></html>`;
}

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
