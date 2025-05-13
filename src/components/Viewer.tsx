import { useAtom, useAtomValue } from 'jotai';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { imagesAtom, selectedImageAtom } from '../atoms/filePath';
import Viewer from './Viewer/index';
import { MultipleViewer } from './MultipleViewer';

const getDirectoryPath = (filePath: string | undefined) => {
  if (!filePath) {
    return '';
  }
  const lastSlashIndex = filePath.lastIndexOf('/');
  return filePath.slice(0, lastSlashIndex);
};

export const ViewerContainer = () => {
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
  const nav = useNavigate();
  const images = useAtomValue(imagesAtom);

  if (!selectedImage) {
    return null;
  }

  // 이미지가 여러 개일 때 MultipleViewer 사용
  if (images.length > 1) {
    return <MultipleViewer />;
  }

  // 이미지가 하나일 때 기존 Viewer 사용
  return (
    <div className="absolute top-0 left-0 z-10 w-[100vw] h-[100vh] bg-black bg-opacity-70">
      <Viewer
        visible={true}
        images={images.map((src) => ({
          src: `local-image:/${src}`,
          alt: `image-${src}`,
        }))}
        onClose={() => {
          setSelectedImage(null);
          nav('/');
        }}
        activeIndex={images.findIndex((image) => image === selectedImage)}
      />
      <NextButton />
      <BeforeButton />
    </div>
  );
};

const NextButton = () => {
  const images = useAtomValue(imagesAtom);
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);

  const searchIndex = images.findIndex((image) => image === selectedImage);
  const nextIndex = searchIndex + 1 > images.length - 1 ? 0 : searchIndex + 1;

  const handleNext = () => {
    setSelectedImage(images[nextIndex]);
  };

  return (
    <div
      className="absolute top-[50%] right-0 viewer-icon z-30"
      style={{ transform: `translate(-50%, -50%)` }}
      onClick={handleNext}
    >
      <MdNavigateNext />
    </div>
  );
};

const BeforeButton = () => {
  const images = useAtomValue(imagesAtom);
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);

  const searchIndex = images.findIndex((image) => image === selectedImage);
  const prevIndex = searchIndex - 1 < 0 ? images.length - 1 : searchIndex - 1;

  const handleBefore = () => {
    setSelectedImage(images[prevIndex]);
  };

  return (
    <div
      className="absolute top-[50%] left-0 viewer-icon z-30"
      style={{ transform: `translate(50%, -50%)` }}
      onClick={handleBefore}
    >
      <MdNavigateBefore />
    </div>
  );
};
