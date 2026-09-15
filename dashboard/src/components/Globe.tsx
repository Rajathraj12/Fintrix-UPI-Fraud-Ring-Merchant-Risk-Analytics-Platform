import React from 'react';

export default function Globe(props: any) {
  return (
    <div style={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', border: '1px dashed #333', borderRadius: '50%', aspectRatio: '1/1', margin: '0 auto', maxWidth: 400 }}>
      <div style={{ color: '#aaff00', fontFamily: 'monospace', fontSize: 14 }}>
        [React Bits Pro Globe placeholder]
        <br/><br/>
        Run npx shadcn@latest add @reactbits-starter/globe-tw
      </div>
    </div>
  );
}
