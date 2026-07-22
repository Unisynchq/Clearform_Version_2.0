import { Fragment, useLayoutEffect, useState } from 'react';
import {
  getLogicPathPointAtLength,
  LOGIC_PATH_DISCONNECT_T,
  LOGIC_PATH_PILL_T,
} from '@/features/forms/utils/logicPathOverlay';

/**
 * HTML overlays (disconnect ×, kind pill) positioned on the actual SVG path.
 */
export default function LogicEdgeControls({
  pathD,
  edgeKey,
  connection,
  hasKind,
  kindMeta,
  isIfKind,
  onDisconnect,
  onClearLogic,
  onOpenIfThen,
  disconnectHoverHandlers,
  DisconnectButton,
  ControlPill,
}) {
  const [pill, setPill] = useState({ x: 0, y: 0 });
  const [disconnect, setDisconnect] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    setPill(getLogicPathPointAtLength(pathD, LOGIC_PATH_PILL_T));
    setDisconnect(getLogicPathPointAtLength(pathD, LOGIC_PATH_DISCONNECT_T));
  }, [pathD]);

  if (!hasKind) {
    return (
      <DisconnectButton
        key={`logic-edge-controls-${edgeKey}`}
        x={pill.x}
        y={pill.y}
        onDisconnect={onDisconnect}
        {...disconnectHoverHandlers}
      />
    );
  }

  return (
    <Fragment key={`logic-edge-controls-${edgeKey}`}>
      <DisconnectButton
        x={disconnect.x}
        y={disconnect.y}
        onDisconnect={onDisconnect}
        {...disconnectHoverHandlers}
      />
      <ControlPill
        pillX={pill.x}
        pillY={pill.y}
        meta={kindMeta}
        showClearLogic={isIfKind}
        onClearLogic={onClearLogic}
        onPillClick={isIfKind ? onOpenIfThen : undefined}
      />
    </Fragment>
  );
}
