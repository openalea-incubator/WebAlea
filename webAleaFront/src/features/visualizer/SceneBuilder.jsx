import { applyAnimation } from "./SceneFactory";
import { debugLog } from "./utils/debug";
import { createRenderLoop } from "./core/animation";
import { disposeSceneResources } from "./core/dispose";
import { frameCameraToScene } from "./core/framing";
import { addDefaultLights } from "./core/lighting";
import { buildSceneObjects } from "./core/objectPipeline";
import { attachResizeHandler } from "./core/resize";
import {
    createCamera,
    createControls,
    createRenderer,
    createScene
} from "./core/sceneSetup";

/**
 * Builds a Three.js scene from a JSON description.
 * @param {object} sceneJSON
 * @param {React.RefObject} mountRef
 * @returns {object | null}
 */
export function buildSceneFromJSON(sceneJSON, mountRef) {
    if (!mountRef.current || !sceneJSON) return null;

    debugLog("[Visualizer] Building scene from JSON", sceneJSON);

    const scene = createScene();
    const camera = createCamera(mountRef);
    const renderer = createRenderer(mountRef);
    const controls = createControls(camera, renderer);

    const { objects, hasAnimations } = buildSceneObjects(scene, sceneJSON);
    addDefaultLights(scene);
    frameCameraToScene(scene, camera, controls);

    const detachResize = attachResizeHandler(mountRef, renderer, camera);
    const { start, stop, renderOnce } = createRenderLoop({
        renderer,
        scene,
        camera,
        objects,
        applyAnimation
    });

    if (hasAnimations) {
        start();
    } else {
        controls.addEventListener("change", renderOnce);
        renderOnce();
    }

    function dispose() {
        stop();
        detachResize();
        controls.removeEventListener("change", renderOnce);
        disposeSceneResources(objects);
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) {
            renderer.domElement.remove();
        }
    }

    return { scene, camera, renderer, objects, dispose };
}
