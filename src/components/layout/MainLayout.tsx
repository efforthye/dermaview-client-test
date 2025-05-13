import { FC, ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onSearch?: (query: string, field: string) => void;
}

export const MainLayout: FC<MainLayoutProps> = ({ 
  children, 
  activeTab, 
  onSearch 
}) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      <Header onSearch={onSearch} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};
