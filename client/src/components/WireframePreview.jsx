import React from 'react';

function getColorForType(type) {
  return {
    image: 'rgba(100, 150, 255, 0.4)',
    text: 'rgba(255, 200, 100, 0.5)',
    shape: 'rgba(255, 100, 100, 0.5)'
  }[type] || '#ddd';
}

export default function WireframePreview({ layout }) {
  if (!layout || !layout.rootNodes || !layout.nodes) return <div>Invalid Layout</div>;
  
  const rootId = layout.rootNodes[0];
  const artboard = layout.nodes[rootId];
  if (!artboard) return <div>No Artboard</div>;
  
  const aspectRatio = artboard.height / artboard.width;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-4">
      <div className="mb-2 text-sm text-gray-500 text-center">
        Artboard: {artboard.width}x{artboard.height}
      </div>
      <div className="relative w-full shadow-lg border border-gray-300" 
           style={{
             paddingBottom: `${aspectRatio * 100}%`,
             backgroundColor: artboard.data?.backgroundColor || '#f0f0f0',
             overflow: 'hidden'
           }}>
        {artboard.children.map((id, index) => {
          const node = layout.nodes[id];
          if (!node) return null;
          
          let content = node.data?.content || node.name;
          if (node.type === 'image' && !content) content = 'Image';
          
          let renderContent;
          if (node.type === 'image' && node.data?.sourceUrl) {
            renderContent = (
              <img
                src={node.data.sourceUrl}
                alt={node.name}
                className="w-full h-full object-cover"
              />
            );
          } else if (node.type === 'text') {
            renderContent = (
              <span style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word", width: '100%', textAlign: 'center' }}>
                {content}
              </span>
            );
          } else {
            renderContent = (
              <span className="truncate w-full text-center">{content}</span>
            );
          }

          return (
            <div
              key={id}
              title={node.name}
              className="absolute flex items-center justify-center overflow-hidden"
              style={{
                left: `${node.nx * 100}%`,
                top: `${node.ny * 100}%`,
                width: `${node.nw * 100}%`,
                height: `${node.nh * 100}%`,
                backgroundColor: (node.type === 'image' && node.data?.sourceUrl) ? 'transparent' : getColorForType(node.type),
                fontSize: node.type === 'text' && node.style?.visual?.fontSize ? `${Math.max(8, node.style.visual.fontSize * 0.3)}px` : '10px',
                color: node.style?.visual?.color?.value || '#000',
                padding: (node.type === 'image' && node.data?.sourceUrl) ? '0' : '2px',
                borderRadius: node.data?.shapeType === 'circle' ? '50%' : '0',
                zIndex: index,
                border: (node.type === 'image' && node.data?.sourceUrl) ? 'none' : '1px solid rgba(156, 163, 175, 0.5)'
              }}
            >
              {renderContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
