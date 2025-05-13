import { useAtom } from 'jotai';
import { ReactElement, CSSProperties } from 'react';
import { FaBookmark, FaCog, FaImages, FaUserAlt } from 'react-icons/fa';
import { FaCamera } from 'react-icons/fa6';
import { ExplorerLocation, explorerLocation } from '../atoms/states.ts';

// 스타일 정의
const sidebarIconStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '3rem',
  width: '3rem',
  marginTop: '0.5rem',
  marginBottom: '0.5rem',
  marginLeft: 'auto',
  marginRight: 'auto',
  backgroundColor: '#1f2937', // bg-gray-800
  color: '#3b82f6', // text-blue-500
  borderRadius: '1.5rem', // rounded-3xl
  transition: 'all 300ms linear',
  cursor: 'pointer',
};

const activeIconStyle: CSSProperties = {
  backgroundColor: '#3b82f6', // 활성화 색상을 #3b82f6으로 변경
  color: 'white',
  borderRadius: '0.75rem', // rounded-xl
};

export const SideBar = () => {
  const [location, setLocation] = useAtom(explorerLocation);

  return (
    <div
      style={{
        height: '100vh',
        width: '6rem',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#111827', // bg-gray-900
        color: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // shadow-lg
      }}
    >
      <SideBarIcon
        icon={<FaImages size="24" />}
        onClick={() => setLocation(ExplorerLocation.EXPLORER)}
        active={location === ExplorerLocation.EXPLORER || !location}
      />
      <SideBarIcon
        icon={<FaCamera size="24" />}
        onClick={() => setLocation(ExplorerLocation.UPLOADER)}
        active={location === ExplorerLocation.UPLOADER}
      />
      <SideBarIcon
        icon={<FaUserAlt size="20" />}
        onClick={() => setLocation(ExplorerLocation.PATIENTS)}
        active={location === ExplorerLocation.PATIENTS}
      />
      <SideBarIcon icon={<FaBookmark size="20" />} />
      <SideBarIcon
        icon={<FaCog size="20" />}
        onClick={() => setLocation(ExplorerLocation.SETTINGS)}
        active={location === ExplorerLocation.SETTINGS}
      />
    </div>
  );
};

const SideBarIcon = ({
  icon,
  onClick,
  active = false,
}: {
  icon: ReactElement;
  onClick?: () => void;
  active?: boolean;
}) => {
  // 활성화 상태에 따라 스타일 선택
  const style = active 
    ? { ...sidebarIconStyle, ...activeIconStyle } 
    : sidebarIconStyle;

  // 원래 제공된 호버 이벤트 핸들러 사용
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#3b82f6';
    e.currentTarget.style.color = 'white';
    e.currentTarget.style.borderRadius = '0.75rem'; // rounded-xl
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!active) {
      e.currentTarget.style.backgroundColor = '#1f2937'; // bg-gray-800
      e.currentTarget.style.color = '#3b82f6'; // text-blue-500
      e.currentTarget.style.borderRadius = '1.5rem'; // rounded-3xl
    }
  };

  return (
    <div 
      style={style} 
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {icon}
    </div>
  );
};