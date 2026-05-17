export function resizeArtboard(layout, newWidth, newHeight) {
  const updated = structuredClone(layout);
  const rootId = updated.rootNodes[0];
  const artboard = updated.nodes[rootId];

  artboard.width = newWidth;
  artboard.height = newHeight;

  // Recompute every child from normalized coordinates
  artboard.children.forEach((childId) => {
    const node = updated.nodes[childId];
    node.x = node.nx * newWidth;
    node.y = node.ny * newHeight;
    node.width = node.nw * newWidth;
    node.height = node.nh * newHeight;
  });

  return updated;
}

export function moveNode(layout, nodeId, newNx, newNy) {
  const updated = structuredClone(layout);
  const node = updated.nodes[nodeId];
  if (!node) return updated;
  
  const rootId = updated.rootNodes[0];
  const artboard = updated.nodes[rootId];
  
  node.nx = newNx;
  node.ny = newNy;
  node.x = node.nx * artboard.width;
  node.y = node.ny * artboard.height;
  
  return updated;
}

export function resizeNode(layout, nodeId, scale) {
  const updated = structuredClone(layout);
  const node = updated.nodes[nodeId];
  if (!node) return updated;
  
  const rootId = updated.rootNodes[0];
  const artboard = updated.nodes[rootId];
  
  node.nw = node.nw * scale;
  node.nh = node.nh * scale;
  node.width = node.nw * artboard.width;
  node.height = node.nh * artboard.height;
  
  if (node.type === 'text' && node.style.visual.fontSize) {
    node.style.visual.fontSize = Math.round(node.style.visual.fontSize * scale);
  }
  
  return updated;
}

export function changeColor(layout, nodeId, color) {
  const updated = structuredClone(layout);
  const node = updated.nodes[nodeId];
  if (!node) return updated;
  
  if (node.type === 'text') {
    node.style.visual.color = { type: 'solid', value: color };
  } else if (node.type === 'shape') {
    node.style.visual.fill = { type: 'solid', value: color };
  }
  
  return updated;
}
