// The land and the road on it: casing, asphalt and the centre dashes
// (edge lines: roadside.ts).

import { BoxGeometry, DoubleSide, Euler, InstancedMesh, Matrix4, Mesh, PlaneGeometry, Quaternion, Vector3, type Scene } from "three";
import { LEN, N, PTS, TANS } from "../route";
import { grain, mat, P } from "./materials";
import { ribbon } from "./ribbon";

export function buildGround(scene: Scene) {
  // the land: fine grain and wide, faint patches of tone
  const land = new Mesh(new PlaneGeometry(6000, 6000), grain(mat(P.land), { amount: 0.045, size: 5, broad: 90 }));
  land.rotation.x = -Math.PI / 2;
  land.receiveShadow = true;
  scene.add(land);

  scene.add(
    ribbon(11, 0.03, grain(mat(P.casing, { side: DoubleSide }), { amount: 0.08, size: 2 })),
    ribbon(9, 0.06, grain(mat(P.road, { side: DoubleSide }), { amount: 0.035, size: 2.5 })),
  );

  const n = Math.ceil(LEN / 7);
  const dash = new InstancedMesh(new BoxGeometry(0.25, 0.02, 3), mat(P.dash), n);
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const one = new Vector3(1, 1, 1);
  const at = new Vector3();
  let j = 0;
  for (let s = 20; s < LEN - 20; s += 7) {
    const i = Math.round((s / LEN) * N);
    const p = PTS[i];
    const t = TANS[i];
    q.setFromEuler(e.set(0, Math.atan2(t.x, t.z), 0));
    dash.setMatrixAt(j++, m.compose(at.set(p.x, 0.08, p.z), q, one));
  }
  dash.count = j;
  dash.receiveShadow = true;
  scene.add(dash);
}
