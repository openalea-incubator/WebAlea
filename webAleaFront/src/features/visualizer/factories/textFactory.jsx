import * as THREE from "three";
import { applyTransform } from "../utils/transforms";

const textCache = new Map();

function normalizeColor(color, opacity = 1) {
    if (Array.isArray(color)) {
        const to255 = (value) => (value <= 1 ? Math.round(value * 255) : Math.round(value));
        const r = to255(color[0] ?? 0);
        const g = to255(color[1] ?? 0);
        const b = to255(color[2] ?? 0);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    if (typeof color === "string") {
        return color;
    }
    return `rgba(0, 0, 0, ${opacity})`;
}

function buildFont({ fontSize, fontFamily, fontWeight, fontStyle }) {
    return `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`.trim();
}

function getCacheKey({ text, font, color, background, padding, lineHeight }) {
    return JSON.stringify({ text, font, color, background, padding, lineHeight });
}

function createTextCanvas({ text, font, color, background, padding, lineHeight }) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.font = font;
    const lines = String(text).split("\n");
    let maxWidth = 0;
    lines.forEach(line => {
        const metrics = ctx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
    });

    const width = Math.ceil(maxWidth + padding * 2);
    const height = Math.ceil(lineHeight * lines.length + padding * 2);
    canvas.width = Math.max(width, 1);
    canvas.height = Math.max(height, 1);

    ctx.font = font;
    ctx.textBaseline = "top";

    if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = color;
    lines.forEach((line, index) => {
        const y = padding + index * lineHeight;
        ctx.fillText(line, padding, y);
    });

    return { canvas, width: canvas.width, height: canvas.height };
}

function getTextTexture(options) {
    const key = getCacheKey(options);
    if (textCache.has(key)) {
        return textCache.get(key);
    }

    const { canvas, width, height } = createTextCanvas(options);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;

    const entry = { texture, width, height };
    textCache.set(key, entry);
    return entry;
}

/**
 * Builds a Three.js sprite from a JSON description.
 * @param {object} textJSON
 * @returns {THREE.Sprite}
 */
export function textFromJSON(textJSON) {
    const text = textJSON?.text ?? "";
    const fontSize = Number(textJSON?.fontSize ?? textJSON?.font_size ?? 48);
    const fontFamily = textJSON?.fontFamily ?? textJSON?.font_family ?? "Arial";
    const fontWeight = textJSON?.fontWeight ?? textJSON?.font_weight ?? "normal";
    const fontStyle = textJSON?.fontStyle ?? textJSON?.font_style ?? "normal";
    const padding = Number(textJSON?.padding ?? 8);
    const opacity = textJSON?.opacity ?? textJSON?.material?.opacity ?? 1;
    const rawColor = textJSON?.color ?? textJSON?.material?.color ?? [0, 0, 0];
    const color = normalizeColor(rawColor, 1);
    const background = textJSON?.background ? normalizeColor(textJSON.background, 1) : null;
    const lineHeight = Number(textJSON?.lineHeight ?? Math.round(fontSize * 1.2));

    const font = buildFont({ fontSize, fontFamily, fontWeight, fontStyle });
    const { texture } = getTextTexture({ text, font, color, background, padding, lineHeight });

    const material = new THREE.SpriteMaterial({
        map: texture,
        opacity,
        transparent: opacity < 1
    });

    const sprite = new THREE.Sprite(material);

    if (textJSON?.transform) {
        applyTransform(sprite, textJSON.transform);
    } else {
        if (Array.isArray(textJSON?.position)) {
            sprite.position.set(...textJSON.position);
        }
        if (Array.isArray(textJSON?.scale)) {
            sprite.scale.set(...textJSON.scale);
        } else if (typeof textJSON?.size === "number") {
            sprite.scale.set(textJSON.size, textJSON.size * 0.5, 1);
        } else {
            sprite.scale.set(1, 0.5, 1);
        }
    }

    return sprite;
}
