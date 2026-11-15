# My Pet — phone test

A cozy little pasture you can open on your phone. This is a **test build**. Your pet, hearts, looks, and the little coin badge are saved in this browser only. The coin is not a real Arbiter coin.

## Play on your phone

Open: **https://inverhyt.github.io/My-pet/**

1. Adopt a Valais sheep or a capybara and give it a name.
2. Tap the trough, water, hay nest, flowers, or the sheep.
3. Tap the hay bale, slide, or tunnel — or use **Play**.
4. **Bath** is three little games: scrub with soap, **rinse** the bubbles, then **dry** the wool. You cannot fail.
5. **Brush** is a little game too: swipe the comb over burrs and dusty wool. A ☁️ Fluffy meter fills up. You cannot fail.
6. Butterflies sometimes drift by. Tap one, or wait, and the sheep will trot over. The butterfly lands on his nose, then flutters off.
7. Tap **🧪 Test** (top right) to add **10 hearts**. The flower crown unlocks at 8, the bell collar at 12, the bow at 16, the little hat at 28, and the witch hat at 40. The bell can be worn with a hat. Each look has cozy color swatches.
8. When you adopt, you can pick colors (wool or fur, face or nose, and eyes) and a field.
9. The sky around the pasture follows the time of day. One full day takes 8 real hours, so a new day starts three times a day. At night Biscuit naps in his hay bed on his own. Tap him or care for him and he wakes, then he goes back to sleep after a while. Needs never drop.
10. Open Looks and tap 🌿 Field to pick a grass theme. All five are free. Tap 🛋️ Items to swap the water, food, and bed (trough, basin, or hot tub; hay or veggie bowl; hay bed or straw mat). All free, saved per pet.
11. Weather comes and goes on its own: clear, rain, snow, and sometimes a rainbow after rain.
12. The adopt screen is a cute paper certificate. It shows today's date as the pet's birthday, and you can pick colors and a field. A stamp and confetti play when you tap Adopt.
13. On the pet's birthday each month you get a little party (bunting, and a party hat if no other hat is on), plus a one-time 🎂 popup with bonus hearts. The yearly birthday is the big one.
14. You can have more than one pet. Your old save becomes pet #1. Big ⬅️➡️ arrows, a swipe, and a dot row switch between their fields. The last slot is ➕ Adopt.
15. The first pet is free. More slots unlock with friendship hearts added up across all pets: slot 2 at 30, slot 3 at 75, then +60 each. Locked slots show a heart bar.
16. The Valais sheep and ten more friends are ready: fox, capybara, rock, dragon, kiwi bird, cat, dog, duck, crow, and rat. Each comes with a fitting field and a few cozy props. Pick colors on the adopt paper — the dragon can dye its mint body and lavender wings separately.
17. Each pet has a 📖 Journal: birthday, days together, auto milestones, and a photo album of the last 12 shots from 📷 Photo.


Add it to your Home Screen from Safari or Chrome if you like.

This is not the Discord Activity yet. The real game still lives with Muse. This folder is only the static web game — no server, no secrets, no tokens.


## Add a new pet

Each new friend should be a data and art drop-in. Do not rewrite the care loop.

1. Draw the poses in Biscuit's style: flat top-down pixel art, large pixels, cute, small on the field, same outline weight and shading. Files: `{prefix}_idle.png`, `walk1`–`walk4`, `eat`, `drink`, `happy`, `sleep` (same canvas sizes as the sheep: 133×121, happy 133×139, sleep 132×130). Origin is the feet, mid-bottom.
2. Measure HEAD, NECK, and NOSE anchors for every pose (offsets from the feet). Hats, the collar, the party hat, and butterflies use these.
3. Add a species block in `js/species.js`: id, name, emoji, prefix, color slots and palettes, default colors, default items, default field, optional `homeDecor`, anchors, and any idle moods.
4. If it needs new colors, add palettes in `js/color.js` and a `recolor*` path in `recolorPetImage`. Keep `pet.wool` / `pet.face` / `pet.eyes` as the three saved slots.
5. If it needs new care items or home props, add them to `ITEMS` or a decor list in `js/species.js` and drop the PNGs in `assets/`. Wire the files into `ITEM_FILES` in `game.js` if they are new.
6. Move it out of `COMING_SOON` (it will show as a real card on the adopt paper). It still needs an unlocked slot, unless it is the first pet.
7. Copy new assets and `js/` (not `js/api.js` or `vendor/`) into both `static-pages/` and the Arbiter `web/` tree. Bump `?v=` in both `index.html` files.
8. Check on a phone viewport: adopt colors, field + items, hats and collar, bath / brush / play, butterflies, night, weather, birthday, journal, and the pet arrows.

