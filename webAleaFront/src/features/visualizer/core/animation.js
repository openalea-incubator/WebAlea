export function createRenderLoop({ renderer, scene, camera, objects, applyAnimation }) {
    let animationId;

    function renderOnce() {
        renderer.render(scene, camera);
    }

    function animate() {
        animationId = requestAnimationFrame(animate);

        objects.forEach(({ object3D, animation }) => {
            if (animation) applyAnimation(object3D, animation);
        });

        renderer.render(scene, camera);
    }

    function start() {
        if (!animationId) {
            animate();
        }
    }

    function stop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    return {
        start,
        stop,
        renderOnce
    };
}
