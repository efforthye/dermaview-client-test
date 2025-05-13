export const IPC_CALLS = {
  INITIALIZE_DATABASE: 'initialize-database',
  CHECK_DB_HEALTH: 'check-db-health',

  CREATE_USER: 'create-user',
  LIST_USERS: 'list-users',

  UPLOAD_IMAGES: 'upload-images',
  LIST_IMAGES: 'list-images',

  SIGN_IN: 'signIn',
  SIGN_UP: 'signUp',
  
  // 환자 목록 관련 IPC 호출
  PATIENT_IMAGE_DOWNLOAD: 'patient-image-download',
  PATIENT_IMAGES_DOWNLOAD: 'patient-images-download',
  EXPORT_EXCEL: 'export-excel',
  UPDATE_IMAGE_INFO: 'update-image-info',
  SET_REPRESENTATIVE_IMAGE: 'set-representative-image',
};
