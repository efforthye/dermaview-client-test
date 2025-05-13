import Icon, { ActionType } from './Icon';
import { ToolbarConfig } from './ViewerProps';

export interface ViewerToolbarProps {
  prefixCls: string;
  onAction: (config: ToolbarConfig) => void;
  alt?: string;
  width?: number;
  height?: number;
  attribute?: boolean;
  zoomable?: boolean;
  rotatable?: boolean;
  scalable?: boolean;
  changeable?: boolean;
  downloadable: boolean;
  noImgDetails: boolean;
  toolbars: ToolbarConfig[];
  activeIndex?: number;
  count: number;
  showTotal: boolean;
  totalName: string;
  zIndex?: number;
}

export const defaultToolbars: ToolbarConfig[] = [
  {
    key: 'zoomIn',
    actionType: ActionType.zoomIn,
  },
  {
    key: 'zoomOut',
    actionType: ActionType.zoomOut,
  },
  {
    key: 'prev',
    actionType: ActionType.prev,
  },
  {
    key: 'reset',
    actionType: ActionType.reset,
  },
  {
    key: 'next',
    actionType: ActionType.next,
  },
  {
    key: 'rotateLeft',
    actionType: ActionType.rotateLeft,
  },
  {
    key: 'rotateRight',
    actionType: ActionType.rotateRight,
  },
  {
    key: 'scaleX',
    actionType: ActionType.scaleX,
  },
  {
    key: 'scaleY',
    actionType: ActionType.scaleY,
  },
  {
    key: 'download',
    actionType: ActionType.download,
  },
];

const deleteToolbarFromKey = (toolbars: ToolbarConfig[], keys: string[]) => {
  const targetToolbar = toolbars.filter((item) => keys.indexOf(item.key) < 0);
  return targetToolbar;
};

const ViewerToolbar = (props: ViewerToolbarProps) => {
  const handleAction = (config: ToolbarConfig) => {
    props.onAction(config);
  };

  const renderAction = (config: ToolbarConfig) => {
    let content = null;
    // default toolbar
    if (typeof ActionType[config.actionType!] !== 'undefined') {
      content = <Icon type={config.actionType!} />;
    }
    // extra toolbar
    if (config.render) {
      content = config.render;
    }
    return (
      <li
        key={config.key}
        className={`w-10 h-10 bg-white bg-opacity-20 rounded-lg text-gray-300 hover:bg-gray-800 flex flex-row justify-center items-center align-baseline text-center normal-case leading-none text-sm antialiased p-2 z-[${props.zIndex}]`}
        onClick={() => {
          handleAction(config);
        }}
        data-key={config.key}
      >
        {content}
      </li>
    );
  };

  let toolbars = props.toolbars;

  if (!props.zoomable) {
    toolbars = deleteToolbarFromKey(toolbars, ['zoomIn', 'zoomOut']);
  }
  if (!props.changeable) {
    toolbars = deleteToolbarFromKey(toolbars, ['prev', 'next']);
  }
  if (!props.rotatable) {
    toolbars = deleteToolbarFromKey(toolbars, ['rotateLeft', 'rotateRight']);
  }
  if (!props.scalable) {
    toolbars = deleteToolbarFromKey(toolbars, ['scaleX', 'scaleY']);
  }
  if (!props.downloadable) {
    toolbars = deleteToolbarFromKey(toolbars, ['download']);
  }

  return (
    <div className="absolute top-0 w-full h-20 flex flex-col justify-center items-center z-30">
      <div className="flex flex-row gap-2 h-20 justify-center items-center">
        {toolbars.map((item) => {
          return renderAction(item);
        })}
      </div>
    </div>
  );
};

export default ViewerToolbar;
