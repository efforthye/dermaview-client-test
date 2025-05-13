import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom, useAtomValue } from 'jotai';
import { selectedImageAtom, imagesAtom } from '../atoms/filePath';
import Icon, { ActionType } from './Viewer/Icon';

export const MultipleViewer = () => {
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
  const images = useAtomValue(imagesAtom);
  const nav = useNavigate();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 드래그 관련 상태 추가
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 키보드 이벤트 바인딩
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowUp':
          handleZoomIn();
          break;
        case 'ArrowDown':
          handleZoomOut();
          break;
        case 'ArrowLeft':
          if (e.ctrlKey) {
            handleRotateLeft();
          }
          break;
        case 'ArrowRight':
          if (e.ctrlKey) {
            handleRotateRight();
          }
          break;
        case '1':
          if (e.ctrlKey) {
            handleReset();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 마우스 휠 확대/축소
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);
  
  // 드래그 종료 이벤트 처리
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        
        setPosition(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
        
        setDragStart({
          x: e.clientX,
          y: e.clientY
        });
      }
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, dragStart]);

  if (images.length === 0) {
    return null;
  }

  const handleClose = () => {
    setSelectedImage(null);
    nav('/');
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.1));
  };

  const handleRotateLeft = () => {
    setRotate(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotate(prev => prev + 90);
  };

  const handleReset = () => {
    setScale(1);
    setRotate(0);
    setScaleX(1);
    setScaleY(1);
    setPosition({ x: 0, y: 0 }); // 위치도 초기화
  };

  const handleFlipX = () => {
    setScaleX(prev => prev * -1);
  };

  const handleFlipY = () => {
    setScaleY(prev => prev * -1);
  };
  
  // 드래그 시작 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col">
      {/* 상단 툴바 */}
      <div className="flex items-center p-4 bg-gray-800 relative">
  {/* 툴바 버튼들을 가운데에 배치 */}
  <div className="flex flex-wrap gap-2 mx-auto">
    {/* 확대/축소 버튼 */}
    <button 
      onClick={handleZoomOut}
      className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
      title="축소"
    >
      <Icon type={ActionType.zoomOut} />
    </button>
    <span className="text-white px-2 py-2 min-w-[60px] text-center">
      {Math.round(scale * 100)}%
    </span>
    <button 
      onClick={handleZoomIn}
      className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
      title="확대"
    >
      <Icon type={ActionType.zoomIn} />
    </button>
    
    {/* 회전 버튼 */}
    <button 
      onClick={handleRotateLeft}
      className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
      title="왼쪽으로 회전"
    >
      <Icon type={ActionType.rotateLeft} />
    </button>
    <button 
      onClick={handleRotateRight}
      className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
      title="오른쪽으로 회전"
    >
      <Icon type={ActionType.rotateRight} />
    </button>
    
    {/* 반전 버튼 */}
    <button 
      onClick={handleFlipX}
      className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
      title="좌우 반전"
    >
      <Icon type={ActionType.scaleX} />
    </button>
    <button 
      onClick={handleFlipY}
      className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
      title="상하 반전"
    >
      <Icon type={ActionType.scaleY} />
    </button>
    
    {/* 초기화 버튼 */}
    <button 
      onClick={handleReset}
      className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
      title="초기화"
    >
      <Icon type={ActionType.reset} />
    </button>
  </div>
  
  {/* 닫기 버튼 - 오른쪽에 배치 */}
  <button 
    onClick={handleClose}
    className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white absolute right-4"
  >
    닫기
  </button>
</div>

      {/* 이미지 컨테이너 */}
      <div 
  ref={containerRef} 
  className="flex-1 overflow-hidden bg-gray-900"
  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
>
  <div className="flex h-full">
    {images.map((src, index) => (
      <div 
        key={index} 
        className="flex-1 h-full flex items-center justify-center overflow-hidden relative"
        style={{
          minWidth: `${100 / images.length}%`,
          maxWidth: `${100 / images.length}%`,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* 인덱스 표시를 이미지 영역의 왼쪽 위로 이동 */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-sm py-1 px-2 rounded z-10">
          {index + 1} / {images.length}
        </div>
        
        <div 
          className="relative max-h-full max-w-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease',
          }}
        >
          <img
            src={`local-image:/${src}`}
            alt={`이미지 ${index + 1}`}
            className="max-h-full max-w-full object-contain select-none"
            style={{
              transform: `scale(${scale * scaleX}, ${scale * scaleY}) rotate(${rotate}deg)`,
              transition: 'transform 0.2s ease',
            }}
            draggable="false"
          />
          
          {/* 이미지 내부의 인덱스 표시는 제거 */}
        </div>
      </div>
    ))}
  </div>
</div>
      
      {/* 하단 정보 및 썸네일 */}
      <div className="bg-gray-800 text-white p-2 text-center">
        <div className="flex justify-center gap-2 overflow-x-auto py-2">
          {images.map((src, index) => (
            <div 
              key={index} 
              className={`w-16 h-16 flex-shrink-0 cursor-pointer border-2 ${
                src === selectedImage ? 'border-blue-500' : 'border-transparent'
              }`}
              onClick={() => setSelectedImage(src)}
            >
              <img 
                src={`local-image:/${src}`} 
                alt={`썸네일 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};