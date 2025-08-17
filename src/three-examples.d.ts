declare module "three/examples/jsm/controls/OrbitControls.js" {
  import { Camera, EventDispatcher, MOUSE, TOUCH, Vector3 } from "three";
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    object: Camera;
    domElement: HTMLElement | undefined;
    enabled: boolean;
    target: Vector3;
    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
    mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
    touches: { ONE: TOUCH; TWO: TOUCH };
    update: () => boolean;
    reset: () => void;
    dispose: () => void;
    saveState: () => void;
    getPolarAngle: () => number;
    getAzimuthalAngle: () => number;
    listenToKeyEvents: (domElement: HTMLElement) => void;
  }
}

declare module "three/examples/jsm/loaders/FontLoader.js" {
  import { Loader, LoadingManager } from "three";
  export type FontData = unknown;
  export class Font {
    constructor(data: FontData);
    data: FontData;
  }
  export class FontLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad?: (font: Font) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: unknown) => void
    ): void;
    parse(json: FontData): Font;
  }
}

declare module "three/examples/jsm/geometries/TextGeometry.js" {
  import { BufferGeometry, ExtrudeGeometryOptions } from "three";
  import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
  export interface TextGeometryParameters extends ExtrudeGeometryOptions {
    font: Font;
    size?: number;
    height?: number;
    curveSegments?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelOffset?: number;
    bevelSegments?: number;
  }
  export class TextGeometry extends BufferGeometry {
    constructor(text: string, parameters?: TextGeometryParameters);
    parameters: {
      text: string;
      parameters: TextGeometryParameters;
    };
  }
}
