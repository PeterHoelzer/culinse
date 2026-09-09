import fs from "fs";
import { buildPrompt, genCloudflare } from "./lib/images.mjs";

const CASES = [
  { slug: "garnelen-linguine-chili", image_prompt: "linguine coated in a glossy garlic-chilli oil sauce, pink curled prawns, halved red cherry tomatoes, flecks of red chilli and green parsley, a light sheen from the emulsified sauce, served in one simple bowl on a wooden table" },
  { slug: "fisch-kartoffel-auflauf", image_prompt: "a baked fish and potato gratin with overlapping golden potato slices on top over flaky white fish, coated in a creamy mustard sauce with melted golden cheese, garnished with fresh chopped dill, one portion served in a simple ceramic baking dish on a wooden table" },
  { slug: "one-pot-pasta-pilze", image_prompt: "a pot of linguine coated in a glossy light brown mushroom sauce with tender brown mushroom slices woven through the strands, garnished with fresh thyme leaves and freshly cracked black pepper, served in one simple deep bowl on a wooden table" },
];

fs.mkdirSync("/tmp/guardtest", { recursive: true });
for (const c of CASES) {
  const p = buildPrompt(c);
  console.log("##", c.slug);
  console.log(p);
  for (let i = 1; i <= 2; i++) {
    const buf = await genCloudflare(p);
    fs.writeFileSync(`/tmp/guardtest/${c.slug}-g${i}.jpg`, buf);
    console.log("  variante", i, "ok");
  }
}
console.log("TESTGEN FERTIG");
