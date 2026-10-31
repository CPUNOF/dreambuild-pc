import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

function disposeObjects(root) {
  const geometries = new Set(),
    materials = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : object.material
        ? [object.material]
        : [])
      materials.add(material);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export async function createProductViewer(
  container,
  { url, category, signal, onContextLost },
) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Não foi possível carregar o modelo.");
  const gltf = await new GLTFLoader().parseAsync(
    await response.arrayBuffer(),
    "/models/",
  );
  if (signal.aborted) {
    disposeObjects(gltf.scene);
    throw new DOMException("Visualização cancelada", "AbortError");
  }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
  } catch (error) {
    disposeObjects(gltf.scene);
    throw error;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f4f6f8");
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.85;
  room.dispose();
  pmrem.dispose();
  const model = gltf.scene;
  scene.add(model);
  let bounds = new THREE.Box3().setFromObject(model);
  const dimensions = bounds.getSize(new THREE.Vector3());
  model.scale.multiplyScalar(
    2 / Math.max(dimensions.x, dimensions.y, dimensions.z),
  );
  bounds = new THREE.Box3().setFromObject(model);
  model.position.sub(bounds.getCenter(new THREE.Vector3()));
  bounds = new THREE.Box3().setFromObject(model);
  const rgbMaterials = new Set();
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    for (const mat of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (mat.name.includes("RGB")) rgbMaterials.add(mat);
    }
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.14 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = bounds.min.y - 0.015;
  floor.receiveShadow = true;
  scene.add(floor);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-3, 5, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -3,
    right: 3,
    top: 3,
    bottom: -3,
    near: 0.1,
    far: 15,
  });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.025;
  scene.add(key, new THREE.HemisphereLight(0xe8f2ff, 0xb8aaa0, 0.55));
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  const direction =
    category === "case"
      ? new THREE.Vector3(-3, 1.7, 4)
      : category === "cpu"
        ? new THREE.Vector3(1.2, 2.7, 2.3)
        : new THREE.Vector3(2, 1.35, 4);
  camera.position.copy(direction.normalize().multiplyScalar(4.6));
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI * 0.88;
  controls.target.set(0, 0, 0);
  controls.update();
  controls.saveState();
  renderer.domElement.style.touchAction = "pan-y pinch-zoom";
  renderer.domElement.setAttribute(
    "aria-label",
    "Modelo 3D ilustrativo do componente",
  );
  container.appendChild(renderer.domElement);
  let frame = 0,
    remaining = 0,
    visible = true,
    disposed = false,
    automatic = false;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  function render() {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    controls.autoRotate = automatic && !motion.matches;
    controls.update();
    renderer.render(scene, camera);
    if (controls.autoRotate || remaining-- > 0)
      frame = requestAnimationFrame(render);
  }
  function invalidate() {
    remaining = 24;
    if (!frame && !disposed && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    invalidate();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
    if (!visible && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else invalidate();
  });
  observer.observe(container);
  const visibility = () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else invalidate();
  };
  document.addEventListener("visibilitychange", visibility);
  motion.addEventListener("change", invalidate);
  controls.addEventListener("change", invalidate);
  const contextLost = (event) => {
    event.preventDefault();
    if (!disposed) onContextLost();
  };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  resize();
  renderer.render(scene, camera);
  return {
    setColor(color) {
      rgbMaterials.forEach((material) => {
        material.color.set(color);
        material.emissive?.set(color);
        material.emissiveIntensity = 0.3;
      });
      invalidate();
    },
    setAutomatic(value) {
      automatic = value;
      invalidate();
    },
    rotate(amount) {
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += amount;
      camera.position
        .copy(controls.target)
        .add(new THREE.Vector3().setFromSpherical(spherical));
      controls.update();
      invalidate();
    },
    zoom(factor) {
      const offset = camera.position.clone().sub(controls.target);
      const length = THREE.MathUtils.clamp(offset.length() * factor, 2.5, 8);
      camera.position.copy(controls.target).add(offset.setLength(length));
      controls.update();
      invalidate();
    },
    reset() {
      automatic = false;
      controls.reset();
      invalidate();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", invalidate);
      controls.removeEventListener("change", invalidate);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      controls.dispose();
      disposeObjects(scene);
      key.shadow.map?.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
