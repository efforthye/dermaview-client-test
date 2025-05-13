import { useEffect, useRef, useState } from 'react';
import { ViewerCore } from './ViewerCore';
import ViewerProps from './ViewerProps';

// eslint-disable-next-line react-refresh/only-export-components
export default (props: ViewerProps) => {
  const defaultContainer = useRef(
    typeof document !== 'undefined' ? document.createElement('div') : null
  );
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (defaultContainer.current) {
      document.body.appendChild(defaultContainer.current);
    }
  }, []);

  useEffect(() => {
    if (props.visible && !init) {
      setInit(true);
    }
  }, [props.visible, init]);

  if (!init) {
    return null;
  }
  return <ViewerCore {...props} />;
};
