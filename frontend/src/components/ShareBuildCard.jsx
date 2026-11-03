import { useState } from "react";
import { Download } from "lucide-react";
import { money, consultationDate } from "../data/offers.js";
import { categoryNames } from "../data/hardwareFields.js";
import { publicBuildUrl } from "../data/publicLinks.js";

function lines(ctx, text, x, y, maxWidth, lineHeight, limit = 2) {
  const words = String(text || "").split(/\s+/);
  let line = "",
    count = 0;
  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      count++;
      line = word;
      if (count >= limit - 1) {
        const rest = [line, ...words.slice(index + 1)].join(" ");
        let clipped = rest;
        while (
          ctx.measureText(clipped + "…").width > maxWidth &&
          clipped.length
        )
          clipped = clipped.slice(0, -1);
        ctx.fillText(clipped + "…", x, y);
        return;
      }
    } else line = candidate;
  }
  if (line) ctx.fillText(line, x, y);
}

export default function ShareBuildCard({ item, resolution }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function download() {
    setBusy(true);
    setError("");
    try {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = Math.max(1350, 730 + (item.parts?.length || 0) * 78);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error("O navegador não permite criar a imagem.");
      ctx.fillStyle = "#101d2a";
      ctx.fillRect(0, 0, 1080, canvas.height);
      ctx.fillStyle = "#e26430";
      ctx.fillRect(0, 0, 1080, 12);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 44px Barlow, sans-serif";
      ctx.fillText("dreambuild", 56, 85);
      ctx.fillStyle = "#ff9b6b";
      ctx.font = "600 18px Barlow, sans-serif";
      ctx.fillText("MEU PRÓXIMO SETUP", 56, 145);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 48px Barlow Condensed, sans-serif";
      lines(ctx, item.title, 56, 205, 650, 52, 2);
      ctx.fillStyle = "#b4c2d2";
      ctx.font = "400 22px Barlow, sans-serif";
      ctx.fillText(`Montado por ${item.nickname}`, 56, 310);
      if (
        item.image &&
        new URL(item.image, location.origin).origin === location.origin
      ) {
        const photo = new Image();
        const loaded = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(false), 1500);
          photo.onload = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          photo.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
          photo.src = item.image;
        });
        if (loaded) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(760, 130, 264, 195);
          const ratio = Math.min(
            240 / photo.naturalWidth,
            171 / photo.naturalHeight,
          );
          const w = photo.naturalWidth * ratio,
            h = photo.naturalHeight * ratio;
          ctx.drawImage(photo, 772 + (240 - w) / 2, 142 + (171 - h) / 2, w, h);
        }
      }
      const report = item.performance?.[resolution];
      ctx.fillStyle = "#1c2c3e";
      ctx.fillRect(56, 350, 968, 140);
      ctx.fillStyle = "#aabccd";
      ctx.font = "500 18px Barlow, sans-serif";
      ctx.fillText("COTAÇÃO CADASTRADA", 80, 385);
      ctx.fillText(`REFERÊNCIA / ESTIMATIVA · ${resolution}`, 540, 385);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 38px Barlow, sans-serif";
      ctx.fillText(
        item.priceCents ? money(item.priceCents) : "Cotação incompleta",
        80,
        443,
      );
      ctx.fillText(
        Number.isFinite(report?.rankAverageFps)
          ? `${report.rankAverageFps.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} FPS`
          : "Sem média elegível",
        540,
        443,
      );
      let y = 545;
      for (const part of item.parts || []) {
        ctx.fillStyle = "#ff9b6b";
        ctx.font = "600 16px Barlow, sans-serif";
        ctx.fillText(
          (categoryNames[part.category] || part.category).toUpperCase(),
          56,
          y,
        );
        ctx.fillStyle = "#edf2f7";
        ctx.font = "500 22px Barlow, sans-serif";
        lines(
          ctx,
          `${part.quantity > 1 ? `${part.quantity}× ` : ""}${part.name}`,
          56,
          y + 30,
          968,
          26,
          2,
        );
        y += 78;
      }
      ctx.fillStyle = "#ff9b6b";
      ctx.fillRect(56, canvas.height - 160, 54, 4);
      ctx.fillStyle = "#aabccd";
      ctx.font = "400 18px Barlow, sans-serif";
      ctx.fillText(
        `Preços de ${consultationDate(item.quotedAt || item.publishedAt)} · frete não incluído`,
        56,
        canvas.height - 117,
      );
      ctx.fillText(
        "FPS não medidos pelo site. Veja fontes e condições no link.",
        56,
        canvas.height - 85,
      );
      ctx.fillStyle = "#ffffff";
      ctx.font = "500 19px Barlow, sans-serif";
      ctx.fillText(publicBuildUrl(item.id), 56, canvas.height - 45);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw Error("Não foi possível gerar a imagem.");
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "meu-pc-dreambuild.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.message || "Não foi possível baixar o cartão.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="share-build-download">
      <button
        className="secondary-button"
        type="button"
        disabled={busy}
        onClick={download}
      >
        <Download size={17} />
        {busy ? "Preparando cartão…" : "Baixar cartão do meu PC"}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
