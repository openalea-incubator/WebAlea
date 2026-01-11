export const createCustomNode = ({
    id,
    inputs = [],
    outputs = [],
    next = [],
    packageName = "pkg",
    nodeName = "node",
    label = null
}) => ({
    id,
    type: "custom",
    inputs,
    outputs,
    next,
    packageName,
    nodeName,
    label
});

export const edge = (source, target, sourceHandle = "output_0", targetHandle = "input_0") => ({
    source,
    target,
    sourceHandle,
    targetHandle
});
