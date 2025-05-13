import { BiRotateLeft, BiRotateRight } from 'react-icons/bi';
import {
  BsArrowLeft,
  BsArrowRepeat,
  BsArrowRight,
  BsArrowsFullscreen,
  BsDownload,
  BsX,
  BsZoomIn,
  BsZoomOut,
} from 'react-icons/bs';
import { match } from 'ts-pattern';

export enum ActionType {
  zoomIn = 1,
  zoomOut = 2,
  prev = 3,
  next = 4,
  rotateLeft = 5,
  rotateRight = 6,
  reset = 7,
  close = 8,
  scaleX = 9,
  scaleY = 10,
  download = 11,
}

export interface IconProps {
  type: ActionType;
}

const ICON_SIZE = 24;

export default function Icon(props: IconProps) {
  const commonProps = {
    size: ICON_SIZE,
  };

  return match(props.type)
    .with(ActionType.zoomIn, () => <BsZoomIn {...commonProps} />)
    .with(ActionType.zoomOut, () => <BsZoomOut {...commonProps} />)
    .with(ActionType.prev, () => <BsArrowLeft {...commonProps} />)
    .with(ActionType.next, () => <BsArrowRight {...commonProps} />)
    .with(ActionType.close, () => <BsX {...commonProps} />)
    .with(ActionType.reset, () => <BsArrowRepeat {...commonProps} />)
    .with(ActionType.rotateLeft, () => <BiRotateLeft {...commonProps} />)
    .with(ActionType.rotateRight, () => <BiRotateRight {...commonProps} />)
    .with(ActionType.scaleX, () => <BsArrowsFullscreen {...commonProps} />)
    .with(ActionType.scaleY, () => {
      return <BsArrowsFullscreen {...commonProps} />;
    })
    .with(ActionType.download, () => <BsDownload {...commonProps} />)
    .otherwise(() => null);
}
