export const SegmentControl = (props) => {
  const { data, setActiveCategory, activeCategory } = props;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
      }}
    >
      {data.map((c, i) => {
        return (
          <button
            key={"button-" + i}
            className={
              (i === 0 ? "left" : i === data.length - 1 ? "right" : "middle") +
              (c === activeCategory ? " active" : "")
            }
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
};
