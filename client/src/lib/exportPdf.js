// client/src/lib/exportPdf.js — shared PDF export for meal cards
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function exportMealPdf(meal) {
  const cardW = 375, cardH = 600;
  const node = document.createElement('div');
  // position:absolute (not fixed) so html-to-image's clone/render pipeline
  // doesn't get confused by viewport-relative positioning
  node.style.cssText = [
    `width:${cardW}px`, `height:${cardH}px`, 'background:#fff',
    "font-family:'Inter',system-ui,sans-serif", 'position:absolute',
    'top:-9999px', 'left:-9999px', 'padding:28px', 'box-sizing:border-box',
    'overflow:hidden',
  ].join(';');

  const photoHtml = meal.photo_url
    ? `<img src="${meal.photo_url}" crossorigin="anonymous"
         style="width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:16px;display:block" />`
    : `<div style="width:100%;height:160px;background:#F7F3EE;border-radius:12px;
         margin-bottom:16px;display:flex;align-items:center;justify-content:center;
         font-size:52px">🍽</div>`;

  const tableRows = [
    ['Carbs',   meal.carbs_g,   'g'],
    ['Protein', meal.protein_g, 'g'],
    ['Fat',     meal.fat_g,     'g'],
    ['Fiber',   meal.fiber_g,   'g'],
    ['Sugar',   meal.sugar_g,   'g'],
    ['Sodium',  meal.sodium_mg, 'mg'],
  ].map(([label, val, unit], i) => `
    <tr style="background:${i % 2 === 0 ? '#F7F3EE' : '#fff'}">
      <td style="padding:7px 10px;color:#5C4030;font-size:13px">${label}</td>
      <td style="padding:7px 10px;text-align:right;font-weight:600;color:#271A0F;font-size:13px">
        ${val != null ? Math.round(val) + unit : '—'}
      </td>
    </tr>`).join('');

  node.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
      <div style="width:26px;height:26px;background:#C4674A;border-radius:7px"></div>
      <span style="font-size:15px;font-weight:700;color:#271A0F;letter-spacing:-0.3px">Platewise</span>
    </div>
    ${photoHtml}
    <div style="font-size:20px;font-weight:700;color:#271A0F;margin-bottom:3px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${meal.name}</div>
    <div style="font-size:12px;color:#9A7A66;margin-bottom:14px">
      ${[meal.serving, meal.meal_type].filter(Boolean).join(' · ')}
    </div>
    <div style="font-size:44px;font-weight:700;color:#C4674A;margin-bottom:16px;line-height:1">
      ${Math.round(meal.calories)}<span style="font-size:15px;font-weight:400;color:#9A7A66"> kcal</span>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">${tableRows}</table>
    <div style="font-size:10px;color:#C4B4A4;text-align:center">
      Exported ${new Date().toLocaleDateString()} · Platewise
    </div>`;

  document.body.appendChild(node);

  try {
    // Double rAF: guarantees at least one full layout+paint pass before capture
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // Explicitly wait for the photo to load (or fail) before capturing
    if (meal.photo_url) {
      const img = node.querySelector('img');
      if (img) {
        await new Promise((resolve) => {
          if (img.complete) return resolve();
          img.onload = resolve;
          img.onerror = resolve;          // don't block export if the photo fails
          setTimeout(resolve, 4000);      // safety timeout
        });
      }
    }

    const png = await toPng(node, {
      width: cardW,
      height: cardH,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#FFFFFF',
    });

    const pdf = new jsPDF({ unit: 'px', format: [cardW, cardH] });
    pdf.addImage(png, 'PNG', 0, 0, cardW, cardH);
    pdf.save(`platewise-${slugify(meal.name)}.pdf`);
  } catch (err) {
    console.error('PDF export failed:', err);
    throw err;
  } finally {
    document.body.removeChild(node);
  }
}
