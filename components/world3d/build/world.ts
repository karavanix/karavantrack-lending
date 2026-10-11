// The whole world along the road, from the Tashkent depot to the Fergana
// one. Everything static is merged per material at the end (batch.ts);
// trees, rocks and the vine are instanced.
//
// The order below is the probe's and must stay: every builder draws from
// the same random sequence, and moving one would rearrange all that follow.
//
// Building takes a few hundred milliseconds on a phone, so it is a generator:
// it yields between the builders, and the engine gives the page a turn
// there (scrolling, the participants' scenes) before going on.

import { Group } from "three";
import { buildChaikhana, CHAI, CHAI_R } from "./chaikhana";
import { buildDepot, FERGANA, TASHKENT } from "./depot";
import { buildFields, fieldMaterials } from "./fields";
import { createKit } from "./kit";
import { buildHills, buildTowers, scatterRocks } from "./pass";
import { plantPoplars, plantTrees, scatterTrees } from "./trees";
import { buildVillage } from "./village";

export function* buildWorld() {
  const world = new Group();
  world.name = "world";
  const k = createKit(2031);
  k.take(CHAI.x, CHAI.z, CHAI_R);

  buildDepot(k, TASHKENT);
  buildDepot(k, FERGANA);
  yield;
  const fm = fieldMaterials();
  buildFields(k, fm, -50, 535, false);
  buildFields(k, fm, -810, -545, true); // the cotton valley
  plantPoplars(k);
  yield;
  buildVillage(k, -40, 520, 90);
  yield;
  buildVillage(k, -800, -560, 30);
  scatterTrees(k, [[-110, 530], [-810, -550]], 140);
  yield;
  buildChaikhana(k, world);
  const towers = buildTowers(k, world);
  buildHills(k);
  scatterRocks(k, world);
  plantTrees(k, world);
  yield;
  yield* k.flush(world);

  world.traverse((o) => {
    o.matrixAutoUpdate = false;
    o.updateMatrix();
  });
  return { world, towers };
}
