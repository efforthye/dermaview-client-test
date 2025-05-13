import * as React from 'react';

export interface LoadingProps {
  style?: React.CSSProperties;
}

export default function Loading({ style }: LoadingProps) {
  return (
    <div className="loading-wrap" style={style}>
      <div className="circle-loading"></div>
    </div>
  );
}
