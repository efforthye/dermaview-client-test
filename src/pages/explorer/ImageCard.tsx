// src/pages/explorer/ImageCard.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { selectedImageAtom } from '../../atoms/filePath';
import { ImageInfo } from './types';

interface ImageCardProps { 
  image: ImageInfo;
  width: number;
  height: number;
  isSelected: boolean;
  onToggleSelect: (path: string) => void;
  onInfoClick: (e: React.MouseEvent) => void;
}

export const ImageCard = ({ 
  image, 
  width, 
  height, 
  isSelected, 
  onToggleSelect, 
  onInfoClick 
}: ImageCardProps) => {
  const selectImage = useSetAtom(selectedImageAtom);
  const nav = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 이미지 클릭 시 선택 상태 토글
  const handleImageClick = () => {
    onToggleSelect(image.path);
  };

  // 정보 버튼 클릭 시 이미지 뷰어로 이동
  const handleViewerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectImage(image.path);
    nav(`/view/${encodeURIComponent(image.path)}`);
  };

  // 이미지 로드 완료 시 호출
  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // 이미지 로드 실패 시 호출
  const handleImageError = () => {
    setLoadError(true);
  };

  // 이미지 URL 수정 (경로 수정)
  const imageUrl = `local-image:/${image.path}`;

  return (
    <div
      className={`relative rounded-lg overflow-hidden cursor-pointer`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        transition: 'all 0.2s ease',
        border: isSelected ? '4px solid white' : 'none',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleImageClick}
      data-image-path={image.path}
    >
      {/* 이미지 로딩 중 상태 표시 */}
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* 실제 이미지 */}
      <img
        src={imageUrl}
        alt={image.imgOrgName || "이미지"}
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ opacity: isLoaded ? 1 : 0 }}
      />

      {/* 로딩 실패 시 오류 표시 */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-50">
          <span className="text-white text-sm">이미지 로드 실패</span>
        </div>
      )}

      {/* 호버 오버레이 */}
      {(isHovering || isSelected) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent">
          {/* 선택 체크박스 아이콘 - 우측 상단 */}
          <div 
            className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(image.path);
            }}
          >
            {isSelected ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="w-3 h-3 rounded-sm border border-white/60"></div>
            )}
          </div>

          {/* 정보 버튼 - 우측 하단 */}
          <div
            onClick={onInfoClick}
            className="absolute bottom-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
