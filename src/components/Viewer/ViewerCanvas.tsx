import classnames from 'classnames';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import Loading from './Loading';
import './style/index.css';

export interface ViewerCanvasProps {
  prefixCls: string;
  imgSrc: string;
  visible: boolean;
  width: number;
  height: number;
  top: number;
  left: number;
  rotate: number;
  onChangeImgState: (
    width: number,
    height: number,
    top: number,
    left: number
  ) => void;
  onResize: () => void;
  zIndex: number;
  scaleX: number;
  scaleY: number;
  loading: boolean;
  drag: boolean;
  container: HTMLElement;
  onCanvasMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export interface ViewerCanvasState {
  isMouseDown?: boolean;
  mouseX?: number;
  mouseY?: number;
}

export default function ViewerCanvas(props: ViewerCanvasProps) {
  const isMouseDown = useRef(false);
  const prePosition = useRef({
    x: 0,
    y: 0,
  });
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    return () => {
      bindEvent(true);
      bindWindowResizeEvent(true);
    };
  }, []);

  useEffect(() => {
    bindWindowResizeEvent();

    return () => {
      bindWindowResizeEvent(true);
    };
  });

  useEffect(() => {
    if (props.visible && props.drag) {
      bindEvent();
    }
    if (!props.visible && props.drag) {
      handleMouseUp({});
    }
    return () => {
      bindEvent(true);
    };
  }, [props.drag, props.visible]);

  useEffect(() => {
    const diffX = position.x - prePosition.current.x;
    const diffY = position.y - prePosition.current.y;
    prePosition.current = {
      x: position.x,
      y: position.y,
    };
    props.onChangeImgState(
      props.width,
      props.height,
      props.top + diffY,
      props.left + diffX
    );
  }, [position]);

  function handleResize(e) {
    props.onResize();
  }

  function handleCanvasMouseDown(e) {
    props.onCanvasMouseDown(e);
    handleMouseDown(e);
  }

  function handleMouseDown(e) {
    if (e.button !== 0) {
      return;
    }
    if (!props.visible || !props.drag) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    isMouseDown.current = true;
    prePosition.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
    };
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isMouseDown.current) {
      setPosition({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  function handleMouseUp(e: MouseEvent) {
    isMouseDown.current = false;
  }

  function bindWindowResizeEvent(remove?: boolean) {
    let funcName = 'addEventListener';
    if (remove) {
      funcName = 'removeEventListener';
    }
    window[funcName as 'addEventListener']('resize', handleResize, false);
  }

  function bindEvent(remove?: boolean) {
    let funcName = 'addEventListener';
    if (remove) {
      funcName = 'removeEventListener';
    }

    document[funcName as 'addEventListener']('click', handleMouseUp, false);
    document[funcName as 'addEventListener'](
      'mousemove',
      handleMouseMove,
      false
    );
  }

  const imgStyle: React.CSSProperties = {
    width: `${props.width}px`,
    height: `${props.height}px`,
    transform: `
translateX(${props.left !== null ? props.left + 'px' : 'aoto'}) translateY(${
      props.top
    }px)
    rotate(${props.rotate}deg) scaleX(${props.scaleX}) scaleY(${props.scaleY})`,
  };

  const imgClass = classnames(`${props.prefixCls}-image`, {
    drag: props.drag,
    [`${props.prefixCls}-image-transition`]: !isMouseDown.current,
  });

  const style = {
    zIndex: props.zIndex,
  };

  let imgNode = null;
  if (props.imgSrc !== '') {
    imgNode = (
      <img
        className={imgClass}
        src={props.imgSrc}
        style={imgStyle}
        onMouseDown={handleMouseDown}
      />
    );
  }
  if (props.loading) {
    imgNode = (
      <div
        style={{
          display: 'flex',
          height: `${window.innerHeight - 84}px`,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Loading />
      </div>
    );
  }

  return (
    <div
      className={`${props.prefixCls}-canvas`}
      onMouseDown={handleCanvasMouseDown}
      style={style}
    >
      {imgNode}
    </div>
  );
}
