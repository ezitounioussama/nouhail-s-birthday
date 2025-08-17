import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
// Meshopt decoder speeds up geometry decode and can outperform Draco for many assets
// If not present, this is a no-op.
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export default function ModelHero() {
  const ref = useRef<HTMLDivElement | null>(null);
  // Local type augmentation for optional decoders on GLTFLoader
  type GLTFLoaderWithDecoders = GLTFLoader & {
    setMeshoptDecoder?: (decoder: unknown) => void;
  };

  useEffect(() => {
    const el = ref.current!;
    const scene = new THREE.Scene();
    // Transparent scene; parent provides pastel background
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const computeDPR = () => {
      const narrow = Math.min(window.innerWidth, window.innerHeight) < 768;
      return Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 2);
    };
    renderer.setPixelRatio(computeDPR());
    el.appendChild(renderer.domElement);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.set(0, 0.5, 4);
    scene.add(camera);

    const group = new THREE.Group();
    scene.add(group);

    // Warm, pastel lights similar to the screenshot
    const hemi = new THREE.HemisphereLight(0xfff5e8, 0xf6dcc6, 0.9);
    const dir = new THREE.DirectionalLight(0xffe2b0, 1.35);
    dir.position.set(2.2, 4.2, 3.2);
    const rim = new THREE.PointLight(0xff9bc2, 0.7, 8);
    rim.position.set(-2.2, 1.0, -1.6);
    const amb = new THREE.AmbientLight(0xffffff, 0.08);
    scene.add(hemi, dir, rim, amb);

    // Soft contact shadow under the model
    const makeContactShadow = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const grd = ctx.createRadialGradient(
        size / 2,
        size / 2,
        size * 0.1,
        size / 2,
        size / 2,
        size * 0.5
      );
      grd.addColorStop(0, "rgba(0,0,0,0.25)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      });
      const geo = new THREE.PlaneGeometry(1, 1);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = -1; // render before model
      return mesh;
    };
    let contactShadow: THREE.Mesh | null = null;

    // Placeholder spinner while loading
    const spinner = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.2, 0.06, 100, 16),
      new THREE.MeshStandardMaterial({
        color: 0x9be8ff,
        metalness: 0.4,
        roughness: 0.3,
      })
    );
    group.add(spinner);

    const params = new URLSearchParams(window.location.search);
    const modelUrl = params.get("model") || "/models/cute_bunny.glb";

    const loader = new GLTFLoader();
    try {
      const draco = new DRACOLoader();
      draco.setDecoderPath("/draco/");
      loader.setDRACOLoader(draco);
    } catch {
      // draco optional
    }
    try {
      // Meshopt is used when models are encoded with it; safe to set regardless.
      const ldr = loader as GLTFLoaderWithDecoders;
      if (MeshoptDecoder && typeof ldr.setMeshoptDecoder === "function") {
        ldr.setMeshoptDecoder(MeshoptDecoder);
      }
    } catch {
      // meshopt optional
    }

    try {
      // KTX2 compressed textures (BasisU) dramatically reduce texture size and improve upload.
      const ktx2 = new KTX2Loader();
      ktx2.setTranscoderPath("/ktx2/"); // Put BasisU transcoder files under public/ktx2/
      ktx2.detectSupport(renderer);
      loader.setKTX2Loader(ktx2);
    } catch {
      // ktx2 optional
    }

    let model: THREE.Object3D | null = null;

    const fitCameraToObject = (obj: THREE.Object3D) => {
      const { clientWidth: w, clientHeight: h } = el;
      const aspect = Math.max(0.0001, w / Math.max(1, h));
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      const box = new THREE.Box3().setFromObject(obj);
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      const fov = (camera.fov * Math.PI) / 180;
      const dist = (sphere.radius * 1.28) / Math.tan(fov / 2); // closer for bigger view
      camera.position.set(
        sphere.center.x,
        sphere.center.y + sphere.radius * 0.2,
        dist
      );
      camera.lookAt(sphere.center);
      // place/update contact shadow just below model base
      if (!contactShadow) {
        contactShadow = makeContactShadow();
        group.add(contactShadow);
      }
      const box2 = new THREE.Box3().setFromObject(obj);
      const groundY = box2.min.y + 0.01;
      contactShadow!.position.set(sphere.center.x, groundY, sphere.center.z);
      contactShadow!.scale.set(sphere.radius * 2.0, sphere.radius * 2.0, 1);
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      renderer.setPixelRatio(computeDPR());
      renderer.setSize(w, h, false);
      if (model) fitCameraToObject(model);
      else {
        camera.aspect = Math.max(0.0001, w / Math.max(1, h));
        camera.updateProjectionMatrix();
      }
    };
    resize();
    window.addEventListener("resize", resize);

    loader.load(
      modelUrl,
      (gltf) => {
        const base = gltf.scene;
        // Re-center horizontally and place on ground
        const box = new THREE.Box3().setFromObject(base);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        // Optional scale from units or explicit scale
        const units = (params.get("units") || "m").toLowerCase();
        const unitScale =
          units === "cm"
            ? 0.01
            : units === "mm"
            ? 0.001
            : units === "in"
            ? 0.0254
            : units === "ft"
            ? 0.3048
            : 1;
        const explicitScale = parseFloat(params.get("scale") || "1");
        const finalScale =
          (isFinite(explicitScale) && explicitScale > 0 ? explicitScale : 1) *
          unitScale;
        base.scale.setScalar(finalScale);
        // Place on ground: center XZ, align minY to 0
        base.position.x -= center.x;
        base.position.z -= center.z;
        // recompute after scale to get accurate minY
        const boxScaled = new THREE.Box3().setFromObject(base);
        base.position.y -= boxScaled.min.y;
        model = base;
        group.add(base);
        fitCameraToObject(base);
        // Remove spinner
        group.remove(spinner);
        spinner.geometry.dispose();
        (spinner.material as THREE.Material).dispose();
      },
      undefined,
      () => {
        // keep spinner; no-op on error
      }
    );

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      const t = clock.getElapsedTime();
      // Gentle motion
      if (model) {
        model.rotation.y += 0.08 * 0.016;
        model.position.y = Math.sin(t * 0.6) * 0.018;
      } else {
        spinner.rotation.x += 0.03;
        spinner.rotation.y += 0.04;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      if (renderer.domElement.parentElement === el)
        el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} style={{ position: "absolute", inset: 0 }} />;
}
