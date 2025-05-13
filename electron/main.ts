import { app, BrowserWindow, dialog, ipcMain, protocol } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conn, ensureAllTableExists, setConnection } from './database';
import {getCreationTime} from "./image-reader";
import axios from 'axios';
import FormData from 'form-data';
import ExcelJS from 'exceljs';

// 전역 변수로 토큰 저장
let accessToken = '';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'dermaview-icon.svg'),
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: false,
    },
  });

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline'; img-src 'self' data: file: local-image:",
        ],
      },
    });
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.key.toLowerCase() === 'r') {
      event.preventDefault();
    }
  });

  win.reload = () => {
    // console.log('reload 호출이 차단되었습니다.');
  };

  win.webContents.reload = () => {
    // console.log('webContents.reload 호출이 차단되었습니다.');
  };

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

ipcMain.on('console-log', (event, message) => {
  console.log('From Renderer:', message);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  ipcMain.handle('load-settings', (event, _) => {
    if (!fs.existsSync(settingsPath)) {
      return {};
    }

    const data = fs.readFileSync(settingsPath, 'utf-8');
    return JSON.parse(data);
  });

  ipcMain.handle('update-settings', (event, data) => {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
    console.log('Settings updated', data);

    if (data?.rootDirPath) {
      const databaseFilePath = path.join(data.rootDirPath, 'database.db');
      if (databaseFilePath) {
        setConnection(databaseFilePath);
        ensureAllTableExists();
      }
    }
  });

  protocol.handle('local-image', (request) => {
    const url = request.url.replace('local-image://', '');
    // 경로 앞에 '/' 추가 (필요한 경우)
    let filePath = decodeURIComponent(url);
    if (!filePath.startsWith('/')) {
      filePath = '/' + filePath;
    }
    
    // 썸네일 경로 처리 개선
    if (filePath.includes('/thumb_')) {
      // 중복된 경로 수정
      const parts = filePath.split('/');
      const fileName = parts[parts.length - 1];
      // 마지막 폴더명과 파일명이 같은 경우 중복 제거
      if (parts.length > 2 && parts[parts.length - 2].includes(fileName.split('.')[0])) {
        const parentDir = parts.slice(0, parts.length - 1).join('/');
        filePath = parentDir;
      }
    }
  
    try {
      // 이미지 형식에 따라 Content-Type 설정
      let contentType = 'image/jpeg';
      if (filePath.toLowerCase().endsWith('.png')) {
        contentType = 'image/png';
      } else if (filePath.toLowerCase().endsWith('.gif')) {
        contentType = 'image/gif';
      }
      
      return new Response(fs.readFileSync(filePath), {
        headers: {
          'Content-Type': contentType,
        },
      });
    } catch (error) {
      console.error('이미지 로딩 에러:', error, filePath);
      // 에러 발생 시 빈 이미지 반환 (흰색 1x1 픽셀)
      const emptyImage = Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
      return new Response(emptyImage, {
        headers: {
          'Content-Type': 'image/gif',
        },
      });
    }
  });
});

// HTTP 요청 처리를 위한 IPC 핸들러 추가
ipcMain.handle('http-request', async (event, options) => {
  try {
    console.log('메인 프로세스에서 HTTP 요청 시작:', options);
    const response = await axios(options);
    console.log('메인 프로세스 HTTP 응답:', response.status);
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    };
  } catch (error) {
    console.error('메인 프로세스 HTTP 요청 오류:', error);
    if (axios.isAxiosError(error)) {
      return {
        error: true,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      };
    }
    return {
      error: true,
      message: error instanceof Error ? error.message : String(error)
    };
  }
});

// 파일 업로드 처리 함수
ipcMain.handle('file-upload', async (event, options) => {
  try {
    console.log('메인 프로세스에서 파일 업로드 시작:', options.url);
    console.log('업로드할 파일 수:', options.files.length);
    console.log('업로드 날짜:', options.imgUploadDate);
    
    // form-data 패키지 인스턴스 생성
    const formData = new FormData();
    
    // 업로드 날짜 추가
    if (options.imgUploadDate) {
      formData.append('imgUploadDate', options.imgUploadDate);
    }
    // 이미지 클러스터 정보 추가
    if (options.imgCluster) {
      formData.append('imgCluster', options.imgCluster);
    }
    // 유저 정보 추가
    // if (options.regUserId) {
    //   formData.append('regUserId', options.regUserId);
    //   console.log('regUserId 추가됨:', options.regUserId);
    // } else {
    //   // 기본값 'system' 사용
    //   formData.append('regUserId', 'system');
    //   console.log('regUserId 기본값(system) 사용');
    // }
    
    if (options.regUserId) {
      formData.append('regUserId', options.regUserId);
      formData.append('reg_user_id', options.regUserId);
      formData.append('REG_USER_ID', options.regUserId);
      formData.append('userId', options.regUserId);
      formData.append('user_id', options.regUserId);
      console.log('사용자 ID 여러 형태로 추가됨:', options.regUserId);
    } else {
      // 기본값 'system' 사용
      formData.append('regUserId', 'system');
      formData.append('reg_user_id', 'system');
      formData.append('REG_USER_ID', 'system');
      formData.append('userId', 'system');
      formData.append('user_id', 'system');
      console.log('사용자 ID 기본값(system) 여러 형태로 추가됨');
    }

    // FormData에 파일 추가
    for (const fileInfo of options.files) {
      try {
        // 파일 읽기
        const fileBuffer = fs.readFileSync(fileInfo.path);
        
        // form-data 패키지에 버퍼 직접 추가
        formData.append('files', fileBuffer, {
          filename: fileInfo.name,
          contentType: fileInfo.type || 'application/octet-stream',
          knownLength: fileBuffer.length
        });
        
        console.log(`파일 '${fileInfo.name}' 추가 성공, 크기: ${fileBuffer.length} 바이트`);
      } catch (error) {
        console.error('파일 읽기 오류:', error);
        throw new Error(`파일 ${fileInfo?.name} 읽기 실패: ${error}`);
      }
    }
    
    // 토큰 확보 (1. 전역 변수, 2. 옵션에서 전달된 토큰, 3. 빈 문자열)
    const tokenToUse = accessToken || options.token || '';
    console.log('메인 프로세스의 토큰 확인:', tokenToUse ? '토큰 있음' : '토큰 없음');
    
    if (!tokenToUse) {
      throw new Error('액세스 토큰이 없습니다. 로그인 후 다시 시도하세요.');
    }
    
    console.log('토큰 사용 준비 완료, 업로드 요청 시작');
    
    // 서버 요청 전 로그 추가
    console.log('=== 서버 요청 시작 ===');
    console.log('요청 URL:', options.url);
    console.log('요청 메소드: POST');
    console.log('헤더 정보:', {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${tokenToUse.substring(0, 10)}...` // 토큰의 일부만 로그에 표시
    });
    console.log('FormData 크기:', formData.getLengthSync() + ' bytes');
    console.log('요청 시작 시간:', new Date().toISOString());
    
    // axios로 요청 보내기 (form-data 패키지의 getHeaders() 메서드 사용)
    const response = await axios.post(options.url, formData, {
      headers: {
        ...formData.getHeaders(), // form-data 패키지의 getHeaders 메서드
        'Authorization': `Bearer ${tokenToUse}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000 // 30초 타임아웃 추가
    });
    
    // 서버 요청 후 로그 추가
    console.log('=== 서버 응답 완료 ===');
    console.log('응답 상태 코드:', response.status);
    console.log('응답 상태 텍스트:', response.statusText);
    console.log('응답 헤더:', response.headers);
    console.log('응답 데이터:', response.data);
    console.log('응답 수신 시간:', new Date().toISOString());
    console.log('파일 업로드 완료');
    
    // 업로드 성공 후 클러스터 배정 요청 (선택적)
    if (options.imgUploadDate && response.status === 200) {
      try {
        console.log(`업로드 성공, 클러스터 배정 요청 시작 (날짜: ${options.imgUploadDate})`);
        
        // 클러스터 배정 API 호출
        const clusterResponse = await axios.post(
          `${options.url.split('/file/')[0]}/file/setRandomCluster?uploadDate=${options.imgUploadDate}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${tokenToUse}`
            }
          }
        );
        
        console.log('클러스터 배정 응답:', clusterResponse.data);
      } catch (clusterError) {
        console.error('클러스터 배정 요청 실패:', clusterError);
        // 클러스터 배정 실패는 전체 프로세스의 실패로 간주하지 않음
      }
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    console.error('=== 파일 업로드 오류 ===');
    console.error('오류 메시지:', error?.message);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios 오류 코드:', error?.code);
      console.error('Axios 오류 응답:', error?.response?.data);
      console.error('Axios 오류 상태:', error?.response?.status);
    }
    
    console.error('오류 발생 시간:', new Date().toISOString());
    console.error('스택 트레이스:', error?.stack);
    
    return {
      error: true,
      message: error?.message || '알 수 없는 오류'
    };
  }
});

// 토큰 설정을 위한 IPC 핸들러
ipcMain.on('set-access-token', (event, data) => {
  accessToken = data?.token || '';
  console.log('액세스 토큰 설정됨');
});

// 토큰 가져오기를 위한 동기 IPC 핸들러
ipcMain.on('get-access-token', (event) => {
  event.returnValue = { token: accessToken };
});

// 폴더 선택 대화창 열기
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled) return null;

  const folderPath = result.filePaths[0];
  return folderPath;
});

// 폴더 내 이미지 파일 목록 불러오기
ipcMain.handle('get-images', (event, folderPath) => {
  const files = fs.readdirSync(folderPath);
  const images = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
  });

  // 전체 경로를 반환합니다.
  return images.map((file) => path.join(folderPath, file));
});

// 폴더 존재하는지 && 디렉토리 인지 확인
ipcMain.handle('validate-path', async (event, folderPath) => {
  try {
    const exists = fs.existsSync(folderPath);
    const isDirectory = fs.lstatSync(folderPath).isDirectory();
    return exists && isDirectory;
  } catch (error) {
    return false;
  }
});

// 폴더 내부에 필요한 파일이 있는지 확인
ipcMain.handle('file-exists', async (event, folderPath) => {
  try {
    const exists = fs.existsSync(folderPath);
    const isFile = fs.lstatSync(folderPath).isFile();
    return exists && isFile;
  } catch (error) {
    return false;
  }
});

// 데이터베이스 생성 및 연결
ipcMain.handle('fetch-database-root', (event, rootDirPath) => {
  // 루트 디렉토리가 존재하는지 확인하고 없으면 생성
  if (!fs.existsSync(rootDirPath)) {
    fs.mkdirSync(rootDirPath, { recursive: true });
  }

  const dbPath = path.join(rootDirPath, 'database.db');
  const isNewDatabase = !fs.existsSync(dbPath);

  // 데이터베이스 연결
  if (!conn) {
    setConnection(dbPath);
  }

  return [isNewDatabase, dbPath];
});

ipcMain.handle('get-creation-time', async (_, filePath: string) => {
  try {
    const creationTime = await getCreationTime(filePath);
    return creationTime || 'Unknown';
  } catch (error) {
    console.error('Error reading file metadata:', error);
    return 'Error';
  }
});

// 이미지 메타데이터 가져오는 핸들러
ipcMain.handle('get-image-metadata', async (_, imagePath) => {
  try {
    const stats = fs.statSync(imagePath);
    
    // getCreationTime 함수가 이미 있으므로 활용
    const creationTime = await getCreationTime(imagePath);
    
    return {
      creationTime: creationTime || stats.birthtime.toISOString(), // 파일 생성 시간
      modificationTime: stats.mtime.toISOString(), // 파일 수정 시간
      size: stats.size, // 파일 크기
    };
  } catch (error) {
    console.error(`Error getting metadata for ${imagePath}:`, error);
    // 에러가 발생해도 기본값 반환
    return {
      creationTime: new Date().toISOString(),
      modificationTime: new Date().toISOString(),
      size: 0
    };
  }
});

// 이미지 검색 핸들러
ipcMain.handle('search-images-by-criteria', async (_, field, query) => {
  try {
    // 설정에서 루트 경로 가져오기
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const settingsData = fs.readFileSync(settingsPath, 'utf-8');
    const settings = JSON.parse(settingsData);
    
    const baseDir = `${settings?.rootDirPath}/dermaview-server/upload` || '';
    
    // 기본 디렉토리의 모든 이미지 가져오기
    const files = fs.readdirSync(baseDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });
    
    const allImages = imageFiles.map(file => path.join(baseDir, file));
    
    if (!query || query.trim() === '') {
      return allImages; // 검색어가 없으면 모든 이미지 반환
    }
    
    // 검색 필드에 따른 필터링 로직
    if (field === '등록번호') {
      // 등록번호로 필터링 (파일명에 검색어가 포함된 이미지)
      return allImages.filter(imagePath => 
        path.basename(imagePath).toLowerCase().includes(query.toLowerCase())
      );
    } else if (field === '날짜') {
      // 날짜로 필터링
      const imagesWithMetadata = await Promise.all(
        allImages.map(async (imagePath) => {
          const metadata = await getCreationTime(imagePath);
          return { path: imagePath, creationTime: metadata };
        })
      );
      
      return imagesWithMetadata
        .filter(item => {
          if (!item.creationTime) return false;
          const date = new Date(item.creationTime);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
          return dateStr.includes(query);
        })
        .map(item => item.path);
    }
    
    return allImages; // 기본적으로 모든 이미지 반환
  } catch (error) {
    console.error('Error searching images:', error);
    return [];
  }
});

// 다운로드 폴더 선택 대화상자
ipcMain.handle('select-download-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '다운로드 위치 선택',
    buttonLabel: '선택'
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

// 이미지 다운로드(복사) 처리 핸들러
ipcMain.handle('download-image', async (_, options: { sourcePath: string, targetDir: string, fileName: string }) => {
  try {
    const { sourcePath, targetDir, fileName } = options;
    
    // 파일 복사 경로 설정
    const targetPath = path.join(targetDir, fileName);
    
    // 파일 복사
    fs.copyFileSync(sourcePath, targetPath);
    
    return { success: true, path: targetPath };
  } catch (error) {
    console.error('이미지 다운로드(복사) 중 오류 발생:', error);
    throw error;
  }
});

// 이미지 정보 수정 API 핸들러 추가
ipcMain.handle('update-image-info', async (_, options) => {
  try {
    console.log('이미지 정보 수정 요청:', options);
    
    // 토큰 확인
    const tokenToUse = accessToken || options.token || '';
    if (!tokenToUse) {
      throw new Error('액세스 토큰이 없습니다. 로그인 후 다시 시도하세요.');
    }
    
    // 이미지 정보 수정 API 호출
    const response = await axios.post(
      `${options.url || 'http://localhost:8080'}/file/updateImageInfo`,
      {
        imgId: options.imgId,
        imgRemark: options.imgRemark || '',
        imgModality: options.imgModality || '',
        imgBodyPart: options.imgBodyPart || '',
        imgCluster: options.imgCluster || '',
        modUserId: options.modUserId || 'system'
      },
      {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('이미지 정보 수정 중 오류 발생:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
});

// 이미지 다운로드 핸들러
ipcMain.handle('patient-image-download', async (_, options) => {
  try {
    console.log('환자 이미지 다운로드 요청:', options);
    const { imagePath, fileName } = options;
    
    if (!imagePath) {
      throw new Error('다운로드할 이미지 경로가 지정되지 않았습니다.');
    }
    
    // 다운로드 디렉토리 선택 대화상자 열기
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '이미지 저장 위치 선택',
      buttonLabel: '저장'
    });
    
    if (result.canceled) {
      console.log('다운로드 폴더 선택이 취소되었습니다.');
      return { cancelled: true };
    }
    
    const downloadDir = result.filePaths[0];
    const saveFileName = fileName || path.basename(imagePath);
    const savePath = path.join(downloadDir, saveFileName);
    
    // 이미지 파일 복사
    fs.copyFileSync(imagePath, savePath);
    
    console.log(`이미지가 성공적으로 다운로드되었습니다. 저장 경로: ${savePath}`);
    return {
      success: true,
      path: savePath
    };
  } catch (error) {
    console.error('이미지 다운로드 중 오류 발생:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
});

// 대표 이미지 설정 핸들러
ipcMain.handle('set-representative-image', async (_, options) => {
  try {
    console.log('대표 이미지 설정 요청:', options);
    const { patientInfoId, imageId } = options;
    
    if (!patientInfoId || !imageId) {
      throw new Error('환자 ID 또는 이미지 ID가 지정되지 않았습니다.');
    }
    
    // 토큰 확인
    const tokenToUse = accessToken || options.token || '';
    if (!tokenToUse) {
      throw new Error('액세스 토큰이 없습니다. 로그인 후 다시 시도하세요.');
    }
    
    // 대표 이미지 설정 API 호출 (서버 API가 구현되어 있지 않으면 임시로 성공 응답 반환)
    // 실제 구현에서는 아래 주석을 해제하고 서버 API를 호출해야 합니다.
    /*
    const response = await axios.post(
      `${options.url || 'http://localhost:8080'}/file/setRepresentativeImage`,
      {
        patientInfoId,
        imageId
      },
      {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
    */
    
    // 임시 성공 응답 (서버 API 구현 전까지 사용)
    return {
      success: true,
      message: '대표 이미지로 설정되었습니다.'
    };
  } catch (error) {
    console.error('대표 이미지 설정 중 오류 발생:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
});

// 엑셀 데이터 내보내기 핸들러
ipcMain.handle('export-excel', async (_, options) => {
  try {
    console.log('엑셀 데이터 내보내기 요청:', options);
    const { data } = options;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('내보낼 데이터가 없습니다.');
    }
    
    // 데이터 정제: NaN, undefined, null 값 정리
    const cleanedData = data.map(row => {
      const cleanRow = { ...row };
      Object.keys(cleanRow).forEach(key => {
        // NaN, undefined, null 값 처리
        if (cleanRow[key] === undefined || cleanRow[key] === null || 
            (typeof cleanRow[key] === 'string' && 
             (cleanRow[key].includes('NaN') || 
              cleanRow[key].includes('undefined')))) {
          cleanRow[key] = '-';
        }
      });
      return cleanRow;
    });
    
    // 사용자가 파일명을 직접 지정할 수 있는 저장 대화상자
    const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const defaultFileName = `환자목록_${currentDate}.xlsx`;
    
    const saveResult = await dialog.showSaveDialog({
      title: '환자 목록 저장',
      defaultPath: defaultFileName,
      filters: [
        { name: 'Excel 파일', extensions: ['xlsx'] },
        { name: 'CSV 파일', extensions: ['csv'] },
        { name: '모든 파일', extensions: ['*'] }
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    });
    
    if (saveResult.canceled || !saveResult.filePath) {
      console.log('파일 저장이 취소되었습니다.');
      return { cancelled: true };
    }
    
    const savePath = saveResult.filePath;
    const isExcel = savePath.toLowerCase().endsWith('.xlsx');
    
    if (isExcel) {
      // ExcelJS를 사용하여 Excel 파일 생성
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Dermaview';
      workbook.lastModifiedBy = 'Dermaview Application';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // 워크시트 추가
      const worksheet = workbook.addWorksheet('환자목록');
      
      // 컬럼 헤더 설정
      const headers = Object.keys(cleanedData[0]);
      worksheet.addRow(headers);
      
      // 헤더 스타일 설정
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // 테두리 설정
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // 데이터 행 추가
      cleanedData.forEach(item => {
        const values = Object.values(item);
        worksheet.addRow(values);
      });
      
      // 모든 셀에 테두리 추가
      for (let i = 2; i <= cleanedData.length + 1; i++) {
        const row = worksheet.getRow(i);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
      
      // 컬럼 너비 자동 조정
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });
      
      try {
        // 파일 저장
        await workbook.xlsx.writeFile(savePath);
        console.log(`Excel 데이터가 성공적으로 내보내졌습니다. 저장 경로: ${savePath}`);
        
        // 완료 메시지 표시
        dialog.showMessageBox({
          type: 'info',
          title: '데이터 내보내기 완료',
          message: `환자 목록이 Excel 형식으로 저장되었습니다.\n저장 경로: ${savePath}`
        });
        
        return {
          success: true,
          path: savePath,
          format: 'excel'
        };
      } catch (error) {
        console.error('Excel 파일 저장 중 오류:', error);
        throw error; // CSV 대체 저장을 위해 오류 전파
      }
    } else {
      // CSV 형식으로 저장
      const headers = Object.keys(cleanedData[0]).join(',');
      const rows = cleanedData.map(row => 
        Object.values(row)
          .map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val)
          .join(',')
      );
      const csvContent = [headers, ...rows].join('\n');
      
      // CSV 파일 저장
      fs.writeFileSync(savePath, csvContent, 'utf8');
      
      console.log(`CSV 데이터가 성공적으로 내보내졌습니다. 저장 경로: ${savePath}`);
      
      // 완료 메시지 표시
      dialog.showMessageBox({
        type: 'info',
        title: '데이터 내보내기 완료',
        message: `환자 목록이 CSV 형식으로 저장되었습니다.\n저장 경로: ${savePath}`
      });
      
      return {
        success: true,
        path: savePath,
        format: 'csv'
      };
    }
  } catch (error) {
    console.error('데이터 내보내기 중 오류 발생:', error);
    
    // 오류 발생 시 CSV로 대체 시도
    try {
      const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const csvPath = path.join(app.getPath('downloads'), `환자목록_${currentDate}.csv`);
      
      // 데이터 정제: NaN, undefined, null 값 정리
      const cleanedData = data.map(row => {
        const cleanRow = { ...row };
        Object.keys(cleanRow).forEach(key => {
          // NaN, undefined, null 값 처리
          if (cleanRow[key] === undefined || cleanRow[key] === null || 
              (typeof cleanRow[key] === 'string' && 
               (cleanRow[key].includes('NaN') || 
                cleanRow[key].includes('undefined')))) {
            cleanRow[key] = '-';
          }
        });
        return cleanRow;
      });
      
      const headers = Object.keys(cleanedData[0]).join(',');
      const rows = cleanedData.map(row => 
        Object.values(row)
          .map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val)
          .join(',')
      );
      const csvContent = [headers, ...rows].join('\n');
      
      // CSV 파일 저장
      fs.writeFileSync(csvPath, csvContent, 'utf8');
      
      console.log(`오류 복구: CSV 형식으로 데이터가 저장되었습니다. 저장 경로: ${csvPath}`);
      
      // 완료 메시지 표시
      dialog.showMessageBox({
        type: 'info',
        title: '데이터 내보내기 완료 (CSV 형식)',
        message: `원본 형식 저장 중 오류가 발생하여 CSV 형식으로 저장되었습니다.\n저장 경로: ${csvPath}`
      });
      
      return {
        success: true,
        path: csvPath,
        format: 'csv',
        recovered: true
      };
    } catch (csvError) {
      // CSV 대체 저장도 실패한 경우
      console.error('CSV 대체 저장 중 오류 발생:', csvError);
      
      dialog.showMessageBox({
        type: 'error',
        title: '오류',
        message: `데이터 내보내기 중 오류가 발생했습니다.\n${error instanceof Error ? error.message : '알 수 없는 오류'}`
      });
      
      return {
        error: true,
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }
});