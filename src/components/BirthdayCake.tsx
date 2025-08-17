import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// Text rendering removed per request; imports for FontLoader/TextGeometry have been deleted.

// Utility: create a soft radial sprite texture (for candle flame/glow)
function makeRadialSpriteTexture({
  size = 128,
  innerColor = "#fff7cc",
  outerColor = "rgba(255,165,0,0)",
}: {
  size?: number;
  innerColor?: string;
  outerColor?: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.05,
    size / 2,
    size / 2,
    size * 0.5
  );
  g.addColorStop(0, innerColor);
  g.addColorStop(1, outerColor);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Create a simple cake layer (cylinder) with nice PBR material
function createCakeLayer({
  radiusTop,
  radiusBottom,
  height,
  color,
  roughness = 0.8,
  metalness = 0.05,
  radialSegments = 96,
  heightSegments = 1,
  map,
}: {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  color: string | number;
  roughness?: number;
  metalness?: number;
  radialSegments?: number;
  heightSegments?: number;
  map?: THREE.Texture;
}) {
  const geo = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    heightSegments,
    true
  );
  // Add top and bottom caps separately for better shading
  const capTop = new THREE.CircleGeometry(radiusTop, radialSegments);
  const capBottom = new THREE.CircleGeometry(radiusBottom, radialSegments);
  capTop.rotateX(-Math.PI / 2);
  capBottom.rotateX(Math.PI / 2);

  const matParams: THREE.MeshStandardMaterialParameters = {
    color,
    roughness,
    metalness,
  };
  if (map) matParams.map = map;
  const mat = new THREE.MeshStandardMaterial(matParams);
  if (map) map.colorSpace = THREE.SRGBColorSpace;

  const group = new THREE.Group();
  const side = new THREE.Mesh(geo, mat);
  side.castShadow = true;
  side.receiveShadow = true;
  group.add(side);

  const top = new THREE.Mesh(capTop, mat);
  top.position.y = height / 2;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const bottom = new THREE.Mesh(capBottom, mat);
  bottom.position.y = -height / 2;
  bottom.castShadow = true;
  bottom.receiveShadow = true;
  group.add(bottom);

  return group;
}

// Create a simple icing rim using Torus
function createIcingRim(radius: number, y: number, color = 0xffffff) {
  const geo = new THREE.TorusGeometry(radius, 0.04 * radius, 32, 200);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Elegant bead border using instanced spheres
function createBeadBorder({
  radius,
  y,
  beadRadius,
  count = 64,
  color = 0xffffff,
  offsetOut = 0.02,
}: {
  radius: number;
  y: number;
  beadRadius: number;
  count?: number;
  color?: number;
  offsetOut?: number;
}) {
  const geo = new THREE.SphereGeometry(beadRadius, 16, 12);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.05,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = radius + offsetOut;
    dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  return mesh;
}

// Thin metallic band for a luxurious accent
function createGoldBand(radius: number, y: number, thickness = 0.008) {
  const geo = new THREE.TorusGeometry(radius, thickness, 24, 256);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 1,
    roughness: 0.2,
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = Math.PI / 2;
  m.position.y = y;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Drip icing ring using capsules, varied lengths and slight outward tilt
function createDripIcingRing({
  radius,
  yTop,
  avgLength = 0.08,
  variance = 0.05,
  count = 48,
  color = 0xffffff,
  tiltOut = 0.15,
  capsuleRadius = 0.01,
}: {
  radius: number;
  yTop: number;
  avgLength?: number;
  variance?: number;
  count?: number;
  color?: number;
  tiltOut?: number;
  capsuleRadius?: number;
}) {
  const geo = new THREE.CapsuleGeometry(capsuleRadius, 1, 4, 8);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.03,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.05;
    const len = Math.max(0.02, avgLength + (Math.random() * 2 - 1) * variance);
    const x = Math.cos(a) * (radius + capsuleRadius * 0.2);
    const z = Math.sin(a) * (radius + capsuleRadius * 0.2);
    dummy.position.set(x, yTop - len / 2, z);
    // Orient capsule vertically and tilt slightly outward
    dummy.rotation.set(0, a, 0);
    dummy.rotateX(tiltOut);
    dummy.scale.set(1, len, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  return mesh;
}

// Icing swags using bezier tube segments around the layer
function createIcingSwags({
  radius,
  y,
  segments = 12,
  sag = 0.08,
  tubeRadius = 0.012,
  color = 0xffffff,
}: {
  radius: number;
  y: number;
  segments?: number;
  sag?: number;
  tubeRadius?: number;
  color?: number;
}) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.05,
  });
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const p0 = new THREE.Vector3(
      Math.cos(a0) * radius,
      y,
      Math.sin(a0) * radius
    );
    const p1 = new THREE.Vector3(
      Math.cos(a1) * radius,
      y,
      Math.sin(a1) * radius
    );
    // Control point sags down and slightly outward
    const midAngle = (a0 + a1) / 2;
    const pc = new THREE.Vector3(
      Math.cos(midAngle) * (radius + tubeRadius * 0.5),
      y - sag,
      Math.sin(midAngle) * (radius + tubeRadius * 0.5)
    );
    const curve = new THREE.QuadraticBezierCurve3(p0, pc, p1);
    const tube = new THREE.TubeGeometry(curve, 20, tubeRadius, 8, false);
    const mesh = new THREE.Mesh(tube, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

// Canvas-based round topper with elegant text
function makeTopperTexture({
  size = 1024,
  textTop = "Happy",
  textBottom = "Birthday",
  textEnd = "",
}: {
  size?: number;
  textTop: string;
  textBottom: string;
  textEnd?: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, size, size);

  // Round plaque with radial gradient (dark chocolate)
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.floor(size * 0.46);
  const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  grad.addColorStop(0, "#3a2319");
  grad.addColorStop(1, "#22140f");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Gold rim
  ctx.lineWidth = Math.max(4, size * 0.012);
  const gold = ctx.createLinearGradient(0, 0, size, size);
  gold.addColorStop(0, "#f6e27a");
  gold.addColorStop(0.5, "#d4af37");
  gold.addColorStop(1, "#fff2a8");
  ctx.strokeStyle = gold;
  ctx.beginPath();
  ctx.arc(cx, cy, r - ctx.lineWidth, 0, Math.PI * 2);
  ctx.stroke();

  // Text with slight emboss
  const topSize = Math.floor(size * 0.12);
  const bottomSize = Math.floor(size * 0.11);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = Math.max(4, size * 0.01);
  ctx.shadowOffsetY = Math.max(2, size * 0.005);
  ctx.fillStyle = gold;
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = Math.max(2, size * 0.006);

  // Top text ("Happy")
  ctx.font = `${Math.max(12, topSize)}px serif`;
  ctx.strokeText(textTop, cx, cy - size * 0.12);
  ctx.fillText(textTop, cx, cy - size * 0.12);

  // Middle text ("Birthday")
  ctx.font = `italic ${Math.max(12, bottomSize)}px serif`;
  ctx.strokeText(textBottom, cx, cy - size * 0.02);
  ctx.fillText(textBottom, cx, cy - size * 0.02);

  // Bottom text ("Darling!" if provided)
  if (textEnd) {
    ctx.font = `italic ${Math.max(12, bottomSize)}px serif`;
    ctx.strokeText(textEnd, cx, cy + size * 0.08);
    ctx.fillText(textEnd, cx, cy + size * 0.08);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createTextTopper({
  textTop = "Happy",
  textBottom = "Birthday",
  textEnd = "",
  radius = 0.22,
  y = 0,
}: {
  textTop?: string;
  textBottom?: string;
  textEnd?: string;
  radius?: number;
  y?: number;
}) {
  const group = new THREE.Group();
  const tex = makeTopperTexture({ textTop, textBottom, textEnd, size: 1024 });
  const geo = new THREE.CircleGeometry(radius, 64);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    roughness: 0.5,
    metalness: 0.2,
  });
  const plaque = new THREE.Mesh(geo, mat);
  plaque.rotation.x = -Math.PI / 2;
  plaque.position.y = y + 0.006;
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = -1;
  mat.polygonOffsetUnits = -1;
  plaque.castShadow = false;
  plaque.receiveShadow = false;

  const edge = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.008, 64, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x2a1912,
      roughness: 0.6,
      metalness: 0.05,
    })
  );
  edge.position.y = y + 0.002;
  edge.castShadow = true;
  edge.receiveShadow = true;
  group.add(edge, plaque);
  return group;
}

// Create a single candle with body, wick, flame sprite and a point light
function createCandle({ height = 0.35, radius = 0.04, color = 0xfff1e6 }) {
  const candle = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(radius, radius * 1.02, height, 32);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.05,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  candle.add(body);

  // Wick
  const wickGeo = new THREE.CylinderGeometry(
    radius * 0.1,
    radius * 0.1,
    height * 0.12,
    12
  );
  const wickMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const wick = new THREE.Mesh(wickGeo, wickMat);
  wick.position.y = height / 2 + (height * 0.12) / 2;
  candle.add(wick);

  // Flame sprite
  const flameTex = makeRadialSpriteTexture({
    innerColor: "#fff1b8",
    outerColor: "rgba(255,140,0,0)",
  });
  const flameMat = new THREE.SpriteMaterial({
    map: flameTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const flame = new THREE.Sprite(flameMat);
  flame.scale.set(radius * 3, radius * 4.5, 1);
  flame.position.y = wick.position.y + 0.03;
  candle.add(flame);

  // Warm point light (non-shadow for performance)
  const light = new THREE.PointLight(0xffc58f, 0.8, 2.5);
  light.position.y = flame.position.y;
  candle.add(light);

  // Flicker behavior
  const baseIntensity = light.intensity;
  const baseScale = flame.scale.clone();
  const update = (t: number) => {
    const n = (Math.sin(t * 7 + Math.random() * 100) + 1) * 0.5; // 0..1
    light.intensity = baseIntensity * (0.85 + 0.3 * n);
    flame.scale.set(
      baseScale.x * (0.9 + 0.25 * n),
      baseScale.y * (0.9 + 0.35 * n),
      1
    );
  };

  return { group: candle, update };
}

// Create a simple plate
function createPlate(radius: number) {
  const geo = new THREE.CylinderGeometry(
    radius,
    radius * 1.02,
    0.05 * radius,
    64,
    1,
    true
  );
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f3,
    roughness: 0.35,
    metalness: 0.1,
  });
  const side = new THREE.Mesh(geo, mat);
  side.receiveShadow = true;
  const capTop = new THREE.CircleGeometry(radius, 64);
  const capBottom = new THREE.CircleGeometry(radius * 1.02, 64);
  capTop.rotateX(-Math.PI / 2);
  capBottom.rotateX(Math.PI / 2);
  const top = new THREE.Mesh(capTop, mat);
  top.position.y = (0.05 * radius) / 2;
  top.receiveShadow = true;
  const bottom = new THREE.Mesh(capBottom, mat);
  bottom.position.y = (-0.05 * radius) / 2;
  bottom.receiveShadow = true;
  const g = new THREE.Group();
  g.add(side, top, bottom);
  return g;
}

// Create sprinkles on the top as tiny instanced cylinders
function createSprinkles({
  radius,
  y,
  count = 200,
}: {
  radius: number;
  y: number;
  count?: number;
}) {
  const colors = [0xff6b6b, 0x4ecdc4, 0xf7b801, 0xc0a7ff, 0xffb3c1, 0x84dcc6];
  const geo = new THREE.CylinderGeometry(0.005, 0.005, 0.03, 6);
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.5,
    metalness: 0.05,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const r = Math.random() * (radius * 0.85);
    const a = Math.random() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const rot = Math.random() * Math.PI * 2;
    dummy.position.set(x, y + 0.005, z);
    dummy.rotation.set(-Math.PI / 2 + Math.random() * 0.3, rot, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    const color = new THREE.Color(colors[(Math.random() * colors.length) | 0]);
    mesh.setColorAt(i, color);
  }
  mesh.instanceColor!.needsUpdate = true;
  return mesh;
}

// Main component
export default function BirthdayCake() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0f13);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const computeDPR = () => {
      const isNarrow = Math.min(window.innerWidth, window.innerHeight) < 768;
      return Math.min(window.devicePixelRatio || 1, isNarrow ? 1.75 : 2);
    };
    renderer.setPixelRatio(computeDPR());
    el.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    scene.add(camera);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.495;

    // Helpers to frame the cake responsively
    const frameCake = (padding = 1.25, isInitial = false) => {
      // Compute bounds
      const box = new THREE.Box3().setFromObject(cakeGroup);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      // For perspective cameras, ensure both height and width fit
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const { clientWidth, clientHeight } = el;
      const aspect = Math.max(0.0001, clientWidth / Math.max(1, clientHeight));
      const halfHeight = (size.y * padding) / 2;
      const halfWidth = (size.x * padding) / 2;
      const distForHeight = halfHeight / Math.tan(vFov / 2);
      const distForWidth = halfWidth / (Math.tan(vFov / 2) * aspect);
      const radius = Math.max(distForHeight, distForWidth);
      const r = Math.max(1.0, radius);

      if (isInitial) {
        // Start with a screen-like front view
        camera.position.set(0, center.y, r * 1.2);
        controls.target.copy(center);
        controls.update();

        // Animate to the elegant angled view
        const targetAzimuth = Math.PI / 4; // 45°
        const targetElevation = Math.PI / 7.2; // ~25°
        const targetY = center.y + r * Math.sin(targetElevation);
        const targetX =
          center.x + r * Math.cos(targetElevation) * Math.cos(targetAzimuth);
        const targetZ =
          center.z + r * Math.cos(targetElevation) * Math.sin(targetAzimuth);

        // Smooth camera transition using GSAP-like easing
        const startPos = camera.position.clone();
        const startTime = performance.now();
        const duration = 2500; // 2.5 seconds

        const animateCamera = () => {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Smooth easing function (ease-out-cubic)
          const eased = 1 - Math.pow(1 - progress, 3);

          // Interpolate position
          camera.position.lerpVectors(
            startPos,
            new THREE.Vector3(targetX, targetY, targetZ),
            eased
          );

          controls.update();

          if (progress < 1) {
            requestAnimationFrame(animateCamera);
          }
        };

        // Start the animation after a brief delay
        setTimeout(animateCamera, 300);
      } else {
        // Choose a pleasant view angle (45° azimuth, ~25° elevation)
        const azimuth = Math.PI / 4;
        const elevation = Math.PI / 7.2; // ~25°

        // Position camera on orbit around center
        const y = center.y + r * Math.sin(elevation);
        const x = center.x + r * Math.cos(elevation) * Math.cos(azimuth);
        const z = center.z + r * Math.cos(elevation) * Math.sin(azimuth);
        camera.position.set(x, y, z);
        controls.target.copy(center);
        controls.update();
      }

      // Update control distances around computed radius
      controls.minDistance = r * 0.6;
      controls.maxDistance = r * 2.2;
    };

    // Resize
    const resize = () => {
      const { clientWidth, clientHeight } = el;
      renderer.setPixelRatio(computeDPR());
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = Math.max(0.0001, clientWidth / Math.max(1, clientHeight));
      camera.updateProjectionMatrix();
      // Reduce shadow map on small screens for perf
      const small = Math.min(clientWidth, clientHeight) < 700;
      dirLight.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
      frameCake();
    };
    window.addEventListener("resize", resize);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1b1d24,
      roughness: 0.9,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Key light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(2.5, 4.0, 2.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.radius = 4;
    scene.add(dirLight);

    // Fill and rim lights for a modern look
    const fill = new THREE.SpotLight(0x88aaff, 0.3, 12, Math.PI / 6, 0.4, 1.2);
    fill.position.set(-4, 2.5, -1.5);
    fill.target.position.set(0, 0.6, 0);
    fill.castShadow = false;
    scene.add(fill, fill.target);

    const rim = new THREE.PointLight(0xff6699, 0.15, 10);
    rim.position.set(0, 2.8, -3);
    scene.add(rim);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    // Build cake assembly
    const cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    // Plate
    const plate = createPlate(1.6);
    plate.position.y = 0.05 * 1.6; // sit on ground
    cakeGroup.add(plate);

    // Cake dimensions
    const baseRadius = 1.2;
    const baseHeight = 0.5;
    const midRadius = 0.9;
    const midHeight = 0.45;
    const topRadius = 0.6;
    const topHeight = 0.35;

    const loader = new THREE.TextureLoader();
    // Texture placeholders (replace with your assets). Suggested sources:
    // - Textures: ambientcg.com, polyhaven.com/textures
    // - HDRI (optional): polyhaven.com/hdris
    const cakeTextureUrl = undefined as unknown as string | undefined; // e.g., "/textures/cake-cream.jpg"
    const cakeMap = cakeTextureUrl ? loader.load(cakeTextureUrl) : undefined;

    const layer1 = createCakeLayer({
      radiusTop: baseRadius,
      radiusBottom: baseRadius,
      height: baseHeight,
      color: 0xfbe5e1,
      map: cakeMap,
    });
    layer1.position.y = plate.position.y + baseHeight / 2 + 0.01;
    cakeGroup.add(layer1);

    const layer2 = createCakeLayer({
      radiusTop: midRadius,
      radiusBottom: midRadius,
      height: midHeight,
      color: 0xfff1f3,
      map: cakeMap,
    });
    layer2.position.y =
      layer1.position.y + baseHeight / 2 + midHeight / 2 + 0.05;
    cakeGroup.add(layer2);

    const layer3 = createCakeLayer({
      radiusTop: topRadius,
      radiusBottom: topRadius,
      height: topHeight,
      color: 0xfdf6f0,
      map: cakeMap,
    });
    layer3.position.y =
      layer2.position.y + midHeight / 2 + topHeight / 2 + 0.05;
    cakeGroup.add(layer3);

    // Icing rims
    cakeGroup.add(
      createIcingRim(
        baseRadius * 1.02,
        layer1.position.y + baseHeight / 2 + 0.01,
        0xffffff
      )
    );
    cakeGroup.add(
      createIcingRim(
        midRadius * 1.02,
        layer2.position.y + midHeight / 2 + 0.01,
        0xffffff
      )
    );
    cakeGroup.add(
      createIcingRim(
        topRadius * 1.02,
        layer3.position.y + topHeight / 2 + 0.01,
        0xffffff
      )
    );

    // Sprinkles on top layer
    const sprinkles = createSprinkles({
      radius: topRadius * 0.95,
      y: layer3.position.y + topHeight / 2,
      count: 120,
    });
    cakeGroup.add(sprinkles);

    // Candles evenly placed on the top
    const candleCount = 8;
    const candleRadius = topRadius * 0.75;
    const candleUpdaters: Array<(t: number) => void> = [];
    for (let i = 0; i < candleCount; i++) {
      const angle = (i / candleCount) * Math.PI * 2;
      const cx = Math.cos(angle) * candleRadius;
      const cz = Math.sin(angle) * candleRadius;
      const { group, update } = createCandle({});
      group.position.set(cx, layer3.position.y + topHeight / 2 + 0.02, cz);
      group.lookAt(0, group.position.y, 0); // orient radially
      cakeGroup.add(group);
      candleUpdaters.push(update);
    }

    // Decorative elegance: borders, bands, swags, and drips
    // Bead borders (top and bottom of each layer)
    cakeGroup.add(
      createBeadBorder({
        radius: baseRadius * 1.01,
        y: layer1.position.y + baseHeight / 2 + 0.005,
        beadRadius: 0.02,
        count: 72,
      })
    );
    cakeGroup.add(
      createBeadBorder({
        radius: baseRadius * 1.01,
        y: layer1.position.y - baseHeight / 2 - 0.005,
        beadRadius: 0.02,
        count: 72,
      })
    );
    cakeGroup.add(
      createBeadBorder({
        radius: midRadius * 1.01,
        y: layer2.position.y + midHeight / 2 + 0.005,
        beadRadius: 0.018,
        count: 64,
      })
    );
    cakeGroup.add(
      createBeadBorder({
        radius: midRadius * 1.01,
        y: layer2.position.y - midHeight / 2 - 0.005,
        beadRadius: 0.018,
        count: 64,
      })
    );
    cakeGroup.add(
      createBeadBorder({
        radius: topRadius * 1.01,
        y: layer3.position.y + topHeight / 2 + 0.005,
        beadRadius: 0.016,
        count: 56,
      })
    );

    // Gold bands midway on each layer
    cakeGroup.add(
      createGoldBand(baseRadius * 1.005, layer1.position.y + 0.02, 0.006)
    );
    cakeGroup.add(
      createGoldBand(midRadius * 1.005, layer2.position.y + 0.015, 0.005)
    );
    cakeGroup.add(
      createGoldBand(topRadius * 1.005, layer3.position.y + 0.012, 0.0045)
    );

    // Icing swags on base and mid layers
    cakeGroup.add(
      createIcingSwags({
        radius: baseRadius * 0.98,
        y: layer1.position.y + baseHeight * 0.15,
        segments: 12,
        sag: 0.06,
        tubeRadius: 0.012,
      })
    );
    cakeGroup.add(
      createIcingSwags({
        radius: midRadius * 0.98,
        y: layer2.position.y + midHeight * 0.12,
        segments: 10,
        sag: 0.055,
        tubeRadius: 0.011,
      })
    );

    // Drip icing around top rim
    cakeGroup.add(
      createDripIcingRing({
        radius: topRadius * 0.99,
        yTop: layer3.position.y + topHeight / 2 + 0.002,
        avgLength: 0.085,
        variance: 0.04,
        count: 52,
        capsuleRadius: 0.008,
      })
    );

    // Flowers: helpers and placement
    const flowerPalette = [0xffc2d1, 0xffdede, 0xe5d4ff, 0xc8e7ff, 0xfff0b3];
    function createFlower({
      petalCount = 6,
      petalLength = 0.08,
      petalRadius = 0.012,
      petalWidthScale = 1.8,
      petalThicknessScale = 1.0,
      petalColor = 0xffdede,
      centerColor = 0xffd36e,
      tilt = 0.25,
    } = {}) {
      const flower = new THREE.Group();
      const petalGeo = new THREE.CapsuleGeometry(
        petalRadius,
        Math.max(0.001, petalLength - petalRadius * 2),
        6,
        8
      );
      const petalMat = new THREE.MeshStandardMaterial({
        color: petalColor,
        roughness: 0.5,
        metalness: 0.05,
      });
      for (let i = 0; i < petalCount; i++) {
        const a = (i / petalCount) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.castShadow = true;
        petal.receiveShadow = true;
        // Lay flat and rotate around center
        petal.rotation.x = -Math.PI / 2 + tilt * (0.6 + Math.random() * 0.4);
        petal.rotation.z = a;
        petal.scale.set(petalWidthScale, 1, petalThicknessScale);
        flower.add(petal);
      }
      // Center
      const center = new THREE.Mesh(
        new THREE.SphereGeometry(petalRadius * 1.05, 12, 10),
        new THREE.MeshStandardMaterial({
          color: centerColor,
          roughness: 0.35,
          metalness: 0.15,
        })
      );
      center.castShadow = true;
      center.receiveShadow = true;
      flower.add(center);
      return flower;
    }

    function addFlowerRing({
      radius,
      y,
      count,
      scale = 1,
      jitter = 0.015,
    }: {
      radius: number;
      y: number;
      count: number;
      scale?: number;
      jitter?: number;
    }) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
        const r = radius + (Math.random() - 0.5) * jitter;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const color = flowerPalette[(Math.random() * flowerPalette.length) | 0];
        const f = createFlower({
          petalCount: 5 + ((i % 2) as 0 | 1),
          petalLength: 0.07 * scale,
          petalRadius: 0.011 * scale,
          petalColor: color,
          centerColor: 0xffda8a,
        });
        f.position.set(x, y + 0.005, z);
        // Face outward slightly
        f.lookAt(new THREE.Vector3(x * 1.1, y + 0.02, z * 1.1));
        cakeGroup.add(f);
      }
    }

    // Place tasteful rings of flowers
    addFlowerRing({
      radius: topRadius * 0.52,
      y: layer3.position.y + topHeight / 2,
      count: 6,
      scale: 1.0,
    });
    addFlowerRing({
      radius: midRadius * 0.65,
      y: layer2.position.y + midHeight / 2,
      count: 8,
      scale: 1.05,
    });
    addFlowerRing({
      radius: baseRadius * 0.75,
      y: layer1.position.y + baseHeight / 2,
      count: 10,
      scale: 1.1,
    });

    // Central topper with elegant text on top layer
    const topper = createTextTopper({
      textTop: "Happy",
      textBottom: "Birthday",
      textEnd: "Darling!",
      radius: topRadius * 0.42,
      y: layer3.position.y + topHeight / 2 + 0.004,
    });
    cakeGroup.add(topper);

    // Responsive framing on first layout
    const initialLayout = () => {
      const { clientWidth, clientHeight } = el;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = Math.max(0.0001, clientWidth / Math.max(1, clientHeight));
      camera.updateProjectionMatrix();
      frameCake(1.25, true); // Pass true for initial camera animation
    };
    initialLayout();

    // Animate
    const clock = new THREE.Clock();
    let raf = 0;
    const renderLoop = () => {
      const t = clock.getElapsedTime();
      candleUpdaters.forEach((u) => u(t));
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === el) {
        el.removeChild(renderer.domElement);
      }
      scene.traverse((obj: THREE.Object3D) => {
        if ((obj as THREE.Mesh).geometry)
          (obj as THREE.Mesh).geometry.dispose?.();
        // Dispose materials and textures when possible
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mat = (obj as any).material as
          | THREE.Material
          | THREE.Material[]
          | undefined;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.());
          else mat.dispose?.();
        }
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
      aria-label="Interactive 3D birthday cake"
      role="img"
    />
  );
}
