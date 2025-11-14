import { useState, cloneElement } from "react";

const Tooltip = ({
  content,
  x,
  y,
  isVisible,
  chartContainerWidth,
  chartContainerHeight,
}) => {
  const [contentWidth, setContentWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const xOffset = 8;
  const yOffset = 8;

  if (!isVisible) return null;
  if (!content) return null;

  const cloned = cloneElement(content, {
    setContentWidth: setContentWidth,
    setContentHeight: setContentHeight,
  });

  return (
    <div
      id="tooltip"
      style={{
        left:
          x < chartContainerWidth / 2
            ? x + xOffset
            : x - contentWidth - xOffset,
        top:
          y < chartContainerHeight / 2
            ? y + yOffset
            : y - contentHeight - yOffset,
        direction: x < chartContainerWidth / 2 ? "ltr" : "rtl",
      }}
    >
      {cloned}
    </div>
  );
};

export default Tooltip;
