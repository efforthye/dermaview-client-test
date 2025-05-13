import { ipcRenderer } from 'electron';
import { useSetAtom } from 'jotai';
import { useCallback, useState, useRef, useEffect } from 'react';
import { FaFileUpload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { GridLoader } from 'react-spinners';
import { imagesAtom, selectedImageAtom } from '../atoms/filePath';
import useLoading from '../hooks/useLoading';

interface FileItem {
  path: string; // 파일 경로 (Electron에서 사용)
  name: string; // 파일 이름
  preview: string; // 미리보기 URL
  birthTime: Date; // 파일 생성 시간
}

interface GroupMetadata {
  date: string;        // 날짜
  diagnosis: string;   // 진단명
  imgCluster: string;  // 이미지 클러스터 번호 (1~3 랜덤)
}

interface ImageGroup {
  files: FileItem[];
  metadata: GroupMetadata;
}

interface UploaderProps {
  userContext?: any;
}

const BASE_URL = 'http://localhost:8080';

// 1부터 3까지의 랜덤한 숫자를 생성하는 함수
const getRandomCluster = (): string => {
  return (Math.floor(Math.random() * 3) + 1).toString();
};

export const Uploader = ({ userContext }: UploaderProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const { isLoading, withLoading } = useLoading();
  const [uploadDate, setUploadDate] = useState<string>(
    new Date().toISOString().split('T')[0]  // YYYY-MM-DD 형식으로 초기화
  );
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageGroups, setImageGroups] = useState<ImageGroup[]>([]);
  
  // 컴포넌트 마운트 시 토큰 확인 및 전달
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('업로더 마운트 시 토큰 확인:', token ? '토큰 있음' : '토큰 없음');
    
    if (token) {
      ipcRenderer.send('console-log', '업로더 마운트 시 토큰 감지: ' + token.substring(0, 10) + '...');
      ipcRenderer.send('set-access-token', { token });
    } else {
      ipcRenderer.send('console-log', '업로더 마운트 시 토큰 없음');
    }
  }, []);

  // 파일이 변경될 때 그룹을 다시 생성
  useEffect(() => {
    const groups = groupImages(files);
    
    // 기존 메타데이터 유지하되, 새 그룹은 랜덤 클러스터 부여
    const newGroups = groups.map((groupFiles, index) => {
      // 기존 그룹이 있으면 메타데이터 유지, 없으면 새 메타데이터 생성
      const existingGroup = imageGroups[index];
      return {
        files: groupFiles,
        metadata: existingGroup?.metadata || {
          date: uploadDate, // 이미 YYYY-MM-DD 형식으로 저장되어 있음
          diagnosis: '',
          imgCluster: getRandomCluster() // 1~3 사이의 랜덤 클러스터 번호 할당
        }
      };
    });
    
    setImageGroups(newGroups);
  }, [files, uploadDate]);

  // 이미지를 100x100으로 크롭하는 함수
  const cropImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Canvas not supported');

          const size = 100;
          canvas.width = size;
          canvas.height = size;

          ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size);
          resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = (err) => reject(err);
      };

      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // 파일 드래그 앤 드롭 핸들러
  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();

    if (!event.dataTransfer?.files) return;

    const droppedFiles = Array.from(event.dataTransfer.files);

    const newFiles = await withLoading(
      Promise.all(
        droppedFiles.map(async (file) => {
          const croppedPreview = await cropImage(file);
          const birthTime = await ipcRenderer.invoke(
            'get-creation-time',
            file.path
          );
          return {
            path: file.path,
            name: file.name,
            preview: croppedPreview,
            birthTime, // 생성 시간
          };
        })
      )
    );

    setFiles((prev) => [...prev, ...newFiles]); // 기존 목록에 추가
  }, [withLoading]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  // 파일 클릭 선택 처리
  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const selectedFiles = Array.from(event.target.files);

    const newFiles = await withLoading(
      Promise.all(
        selectedFiles.map(async (file) => {
          const croppedPreview = await cropImage(file);
          // 파일 생성 시간 가져오기
          const path = (file as any).path; // Electron에서 제공하는 전체 경로
          const birthTime = await ipcRenderer.invoke(
            'get-creation-time',
            path
          );
          
          return {
            path: path,
            name: file.name,
            preview: croppedPreview,
            birthTime, // 생성 시간
          };
        })
      )
    );

    setFiles((prev) => [...prev, ...newFiles]); // 기존 목록에 추가
    
    // 파일 선택 input 초기화 (다시 같은 파일 선택 가능하게)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 그룹 메타데이터 변경 처리 (진단명만 변경 가능하도록 수정)
  const handleMetadataChange = (groupIndex: number, field: keyof GroupMetadata, value: string) => {
    // imgCluster는 랜덤으로 할당되므로 사용자 입력에 의해 변경되지 않도록 함
    if (field === 'imgCluster') return;
    
    setImageGroups(prev => {
      const newGroups = [...prev];
      if (newGroups[groupIndex]) {
        newGroups[groupIndex] = {
          ...newGroups[groupIndex],
          metadata: {
            ...newGroups[groupIndex].metadata,
            [field]: value
          }
        };
      }
      return newGroups;
    });
  };

  // 파일 업로드 처리
  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadResult('업로드할 파일이 없습니다.');
      setUploadSuccess(false);
      return;
    }
  
    try {
      setUploadResult('파일 업로드 중...');
      setUploadSuccess(false);
  
      // 로컬 스토리지에서 토큰 가져오기
      const token = localStorage.getItem('access_token');
      
      // userContext에서 userId 가져오기
      const userId = userContext?.userId || 'system'; // userContext가 없으면 'system' 사용
      
      ipcRenderer.send('console-log', '토큰 정보: ' + (token ? '토큰 있음' : '토큰 없음'));
      
      if (token) {
        ipcRenderer.send('console-log', '업로드 전 토큰 확인: ' + token.substring(0, 10) + '...');
      }
      
      // 토큰 설정을 위한 IPC 핸들러 호출
      ipcRenderer.send('set-access-token', { token: token || '' });
      
      // 잠시 대기하여 토큰이 메인 프로세스에 설정될 시간 제공
      await new Promise(resolve => setTimeout(resolve, 100));
  
      // 파일 정보 구성
      const fileInfos = files.map(file => {
        return {
          name: file.name,
          path: file.path,
          type: 'image/jpeg'
        };
      });
      
      // 랜덤하게 할당된 클러스터 번호 사용
      const imgCluster = imageGroups[0]?.metadata.imgCluster || getRandomCluster();
      
      // 선택된 날짜 형식을 서버가 예상하는 형식으로 변환 (YYYYMMDD)
      const formattedUploadDate = uploadDate.replace(/-/g, '');
  
      // 메인 프로세스에 파일 업로드 요청
      const response = await ipcRenderer.invoke('file-upload', {
        url: `${BASE_URL}/file/upload`,
        files: fileInfos,
        uploadDate: formattedUploadDate, // 서버 전송용 형식으로 변환된 날짜
        imgUploadDate: formattedUploadDate, // 새로 추가된 필드
        token,
        imgCluster,
        regUserId: userId // userContext에서 가져온 userId 사용
      });
  
      console.log('업로드 응답:', response);
  
      if (!response.error && (response.status === 200 || response.status === 201)) {
        setUploadResult('업로드 성공! ' + (typeof response.data === 'string' ? response.data : JSON.stringify(response.data)));
        setUploadSuccess(true);
        
        // 업로드 후 파일 목록 초기화
        setFiles([]);
        setImageGroups([]);
      } else {
        setUploadResult('업로드 실패: ' + (response.message || '알 수 없는 오류'));
        setUploadSuccess(false);
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      setUploadResult('업로드 중 오류 발생: ' + (error instanceof Error ? error.message : String(error)));
      setUploadSuccess(false);
    }
  };

  // 이미지 그룹화 로직
  const groupImages = (files: FileItem[]) => {
    // 정렬된 파일들
    const sortedFiles = [...files].sort(
      (a, b) => new Date(a.birthTime).getTime() - new Date(b.birthTime).getTime()
    );
    
    // 모든 파일을 하나의 그룹으로 처리 (요청대로 수정)
    if (sortedFiles.length > 0) {
      return [sortedFiles];
    }
    
    return [];
  };

  // 파일 삭제 함수
  const handleRemoveFile = (filePath: string) => {
    setFiles(prev => prev.filter(file => file.path !== filePath));
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="w-full h-screen flex flex-col justify-start items-start border-2 border-dashed border-gray-400 p-5 overflow-y-auto"
    >
      <h2>여기로 이미지를 드래그 앤 드롭하세요!</h2>
      <div className="absolute bottom-8 right-8">
        {isLoading && <GridLoader color="#00e5ff" />}
      </div>
      
      {/* 숨겨진 파일 입력 엘리먼트 */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        onChange={handleFileSelection}
        style={{ display: 'none' }}
      />
      
      <div className="w-full flex flex-row justify-between items-center mb-4">
        <p className="text-gray-300 text-l">업로드된 사진: {files.length}장</p>
        <div className="flex flex-row justify-start items-center gap-2">
          <input
            type="date"
            value={uploadDate}
            onChange={(e) => setUploadDate(e.target.value)}
            className="p-2 border rounded bg-white text-black"
          />
          <button 
            onClick={handleUpload}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            업로드
          </button>
        </div>
      </div>
      
      {uploadResult && (
        <div className={`w-full p-3 mb-4 rounded ${uploadSuccess ? 'bg-green-500 bg-opacity-20 text-green-300' : 'bg-red-500 bg-opacity-20 text-red-300'}`}>
          {uploadResult}
        </div>
      )}
      
      <div className="w-full h-full overflow-y-auto">
        {imageGroups.length > 0 ? (
          <ImageGrid 
            imageGroups={imageGroups} 
            onMetadataChange={handleMetadataChange}
            onRemoveFile={handleRemoveFile}
          />
        ) : (
          <UploadGuide onUploadClick={() => fileInputRef.current?.click()} />
        )}
      </div>
    </div>
  );
};

interface ImageGridProps {
  imageGroups: ImageGroup[];
  onMetadataChange: (groupIndex: number, field: keyof GroupMetadata, value: string) => void;
  onRemoveFile: (filePath: string) => void;
}

const ImageGrid = ({ 
  imageGroups, 
  onMetadataChange,
  onRemoveFile
}: ImageGridProps) => {
  return (
    <div className="flex flex-col gap-4">
      {imageGroups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="flex flex-col justify-start items-start border-2 border-gray-400 rounded-lg p-4"
        >
          <div className="w-full flex flex-row justify-between items-center mb-2">
            <h3 className="text-lg font-bold">그룹 {groupIndex + 1}</h3>
          </div>
          
          <div className="flex flex-row flex-wrap p-2 gap-4">
            <div className="flex flex-col mb-4 min-w-[300px]">
              {/* 클러스터 번호 입력 필드를 제거하고 진단명만 표시 */}
              <div className="w-full mb-2">
                <InputField 
                  label="진단명" 
                  value={group.metadata.diagnosis}
                  onChange={(value) => onMetadataChange(groupIndex, 'diagnosis', value)} 
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {group.files.map((file, index) => (
                <ImageElement 
                  key={index} 
                  file={file} 
                  onRemove={() => onRemoveFile(file.path)}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const UploadGuide = ({ onUploadClick }: { onUploadClick: () => void }) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div 
        className="w-[300px] h-[300px] gap-4 border-dotted border-4 border-gray-400 rounded-lg p-4 flex flex-col justify-center items-center cursor-pointer hover:bg-gray-700"
        onClick={onUploadClick}
      >
        <FaFileUpload size={80} />
        <p>
          카메라 촬영 사진을 더마뷰에 업로드하기 위해서 위 아이콘을 클릭하거나
          드래그 & 드랍을 해주세요
        </p>
      </div>
    </div>
  );
};

interface ImageElementProps {
  file: FileItem;
  onRemove: () => void;
}

const ImageElement = ({ file, onRemove }: ImageElementProps) => {
  const selectImage = useSetAtom(selectedImageAtom);
  const setImages = useSetAtom(imagesAtom);
  const nav = useNavigate();
  
  const handleClick = () => {
    selectImage(file.path);
    setImages([file.path]);
    nav(`/view/${encodeURIComponent(file.path)}`);
  };

  return (
    <div className="relative">
      <img
        src={file.preview}
        alt={file.name}
        onClick={handleClick}
        style={{
          width: '100px',
          height: '100px',
          objectFit: 'cover',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      />
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const InputField = ({
  label,
  value,
  onChange,
  className = '',
  disabled = false
}: InputFieldProps) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-white text-sm">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-400 rounded-md p-1 bg-gray-800 text-white"
        disabled={disabled}
      />
    </div>
  );
};