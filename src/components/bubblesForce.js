import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import d3ForceLimit from "d3-force-limit";
import { dataConsumptionByYears } from "../data/dataConsumptionByYears";
import Tooltip from "./tooltip";

const circle = d3
  .arc()
  .innerRadius(0)
  .outerRadius((d) => d)
  .startAngle(-Math.PI)
  .endAngle(Math.PI);

var count = 0;

export function uid(name) {
  return new Id("O-" + (name == null ? "" : name + "-") + ++count);
}

function Id(id) {
  this.id = id;
  this.href = new URL(`#${id}`, window.location) + "";
}

Id.prototype.toString = function () {
  return "url(" + this.href + ")";
};

const BubblesForce = (props) => {
  const {
    measure,
    setTerritoryMinValue,
    setTerritoryMaxValue,
    activeCategory,
    chartContainerWidth,
    chartContainerHeight,
  } = props;

  const [tooltipState, setTooltipState] = useState({
    isVisible: false,
    content: "",
    x: 0,
    y: 0,
  });

  const chartRef = useRef();

  const t = d3.transition().duration(750).ease(d3.easeLinear);

  useEffect(() => {
    if (
      chartRef.current &&
      chartContainerWidth > 0 &&
      chartContainerHeight > 0
    ) {
      let values = [];

      const dataByRegions = Array.from(
        d3.group(
          dataConsumptionByYears
            .map((elem) => {
              const category = elem.categories.filter(
                (c) => c.category === activeCategory
              )[0];
              const valueRubles = Math.abs(category.diff);
              const valuePercent = Math.abs(category.diffPercent);
              values.push(measure === "Рубли" ? valueRubles : valuePercent);
              return {
                territory_name: elem.territory_name,
                territory_id: elem.territory_id,
                region_name: elem.region_name,
                region_id: elem.region_id,
                value: measure === "Рубли" ? valueRubles : valuePercent,
                valueRubles: valueRubles,
                valuePercent: valuePercent,
                isPositive: category.diff > 0,
                data: elem,
                activeCategory: activeCategory,
              };
            })
            .sort((a, b) => b.value - a.value),
          (d) => d.region_id
        ),
        ([, children]) => ({ children })
      );

      setTerritoryMinValue(Math.min(...values));
      setTerritoryMaxValue(Math.max(...values));

      const data = { children: [...dataByRegions] };
      const quad = Math.max(chartContainerWidth, chartContainerHeight) * 0.7;

      const root = d3
        .pack()
        .size([quad, quad])
        .padding((d) => (d.depth === 0 ? 24 : 4))(
        d3.hierarchy(data).sum((d) => d.value)
      );

      const nodes = root.descendants().filter((n) => n.height === 1);

      const maxValue = Math.max(...nodes.map((elem) => elem.value));

      const scale = d3.scaleLinear([0, maxValue], [8, 21]);
      const scaleFont = d3.scaleLinear([0, maxValue], [0.6, 3]);
      const scalePadding = d3.scaleLinear([320, 2500], [9, 12]);

      const wallForce = d3ForceLimit()
        .radius((node) => node.r)
        .x0(0)
        .x1(chartContainerWidth)
        .y0(0)
        .y1(chartContainerHeight);

      wallForce.cushionWidth(24).cushionStrength(0.1);

      const simulation = d3
        .forceSimulation(nodes)
        .alphaDecay(0)
        .velocityDecay(0)
        .force(
          "collision",
          d3.forceCollide((d) => d.r + scalePadding(chartContainerWidth))
        )
        .force("y", d3.forceY(chartContainerHeight).strength(0.0001))
        .force("walls", wallForce);

      const xOffset = (chartContainerWidth - quad) / 2;
      const yOffset = (chartContainerHeight - quad) / 2;

      nodes.forEach((elem) => {
        elem.x += xOffset;
        elem.y += yOffset;
      });

      const svg = d3.select(chartRef.current.firstChild);
      svg.selectAll("g").remove();

      svg
        .attr("width", chartContainerWidth)
        .attr("height", chartContainerHeight)
        .attr("viewBox", [0, -0, chartContainerWidth, chartContainerHeight])
        .attr("style", "overflow: visible")
        .attr("text-anchor", "middle");

      const node = svg
        .append("g")
        .attr("pointer-events", "all")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .on("click", (event) => {
          const maxVelocity = 10;
          const boostFactor = 3;
          nodes.forEach((node) => {
            node.vx = Math.min(node.vx * boostFactor, maxVelocity);
            node.vy = Math.min(node.vy * boostFactor, maxVelocity);
          });
        })
        .call(
          d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

      node
        .append("path")
        .attr("id", (d) => (d.circleUid = uid("circle")).id)
        .attr("stroke", "none")
        .attr("fill", "none")
        .attr("d", (d) => circle(d.r + scale(d.value) / 2));

      node.append("text").call((text) =>
        text
          .append("textPath")
          .attr("xlink:href", (d) => d.circleUid.href)
          .attr("startOffset", "50%")
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "middle")
          .attr("side", "right")
          .attr("font-size", (d) => scaleFont(d.value) + "em")
          .attr("font-family", "sans-serif")
          .text((d) => d.children[0].data.region_name)
      );

      node
        .selectAll("circle")
        .data((d) =>
          root
            .leaves()
            .filter((elem) => elem.parent.circleUid.id === d.circleUid.id)
        )
        .join("circle")
        .attr("cx", (d) => d.x - d.parent.x + xOffset)
        .attr("cy", (d) => d.y - d.parent.y + yOffset)
        .attr("r", (d) => d.r)
        .style("stroke", (d) =>
          d.data.isPositive ? "rgba(0, 0, 0, .8)" : "#ee4444"
        )
        .style("fill", (d) =>
          d.data.isPositive ? "rgba(255, 255, 255, 0)" : "#ee4444"
        )
        .transition(t)
        .style("stroke", (d) =>
          d.data.isPositive ? "rgba(0, 0, 0, .8)" : "#ee4444"
        )
        .style("fill", (d) =>
          d.data.isPositive ? "rgba(255, 255, 255, 0)" : "#ee4444"
        );

      node
        .selectAll("circle")
        .on("mouseover", (event, d) => {
          d3.select(event.target)
            .style("fill", (d) =>
              d.data.isPositive ? "rgba(0, 0, 0, .8)" : "rgba(255, 255, 255, 0)"
            )
            .style("stroke", (d) =>
              d.data.isPositive ? "rgba(0, 0, 0, .8)" : "#ee4444"
            );

          setTooltipState({
            isVisible: true,
            content: (
              <TooltipContent
                region_name={d.data.region_name}
                territory_name={d.data.territory_name}
                value={d.data.valueRubles}
                valuePercent={d.data.valuePercent}
                valuePrev={
                  d.data.data.categories.filter(
                    (c) => c.category === d.data.activeCategory
                  )[0].years[0][1]
                }
                valueNext={
                  d.data.data.categories.filter(
                    (c) => c.category === d.data.activeCategory
                  )[0].years[1][1]
                }
                isPositive={d.data.isPositive}
              />
            ),
            x: event.pageX, // Adjust position as needed
            y: event.pageY,
          });
        })
        .on("mousemove", (event) => {
          setTooltipState((prevState) => ({
            ...prevState,
            x: event.pageX,
            y: event.pageY,
          }));
        })
        .on("mouseout", (event) => {
          d3.select(event.target)
            .transition()
            .delay(1000)
            .duration(3000)
            .style("fill", (d) =>
              d.data.isPositive ? "rgba(255, 255, 255, 0)" : "#ee4444"
            );

          setTooltipState((prevState) => ({ ...prevState, isVisible: false }));
        });

      simulation.on("tick", () => {
        {
          node.attr("transform", (d) => `translate(${d.x},${d.y})`);
        }
      });

      // Reheat the simulation when drag starts, and fix the subject position.
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      // Update the subject (dragged node) position during drag.
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      // Restore the target alpha so the simulation cools after dragging ends.
      // Unfix the subject position now that it’s no longer being dragged.
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }
  }, [activeCategory, measure, chartContainerHeight, chartContainerWidth]);

  return (
    <div ref={chartRef}>
      <svg></svg>
      <Tooltip
        isVisible={tooltipState.isVisible}
        content={tooltipState.content}
        x={tooltipState.x}
        y={tooltipState.y}
        chartContainerWidth={chartContainerWidth}
        chartContainerHeight={chartContainerHeight}
      />
    </div>
  );
};

const TooltipContent = (props) => {
  const {
    territory_name,
    region_name,
    value,
    valuePercent,
    isPositive,
    valuePrev,
    valueNext,
    setContentWidth,
    setContentHeight,
  } = props;

  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef) {
      setContentWidth(contentRef.current.offsetWidth);
      setContentHeight(contentRef.current.offsetHeight);
    }
  }, [territory_name]);

  return (
    <div
      ref={contentRef}
      className={isPositive ? "positive" : "negative"}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        justifyContent: "start",
      }}
    >
      <div>
        <span>
          <b>Регион:</b>{" "}
        </span>
        <span>{region_name}</span>
      </div>
      <div>
        <span>
          <b>Муниципалитет:</b>{" "}
        </span>
        <span>{territory_name}</span>
      </div>
      <div>
        <span>
          <b>Разница:</b>{" "}
        </span>
        <span>
          {(isPositive ? "" : "-") + value.toLocaleString("ru-RU") + " ₽"} (
          {(isPositive ? "" : "-") +
            (Math.round(valuePercent * 10) / 10).toLocaleString("ru-RU")}
          %)
        </span>
      </div>
      <div>
        <span>
          <b>&lrm;2023:&lrm;</b>{" "}
        </span>
        <span>&lrm;{valuePrev.toLocaleString("ru-RU") + " ₽"}&lrm;</span>
      </div>
      <div>
        <span>
          <b>&lrm;2024:&lrm;</b>{" "}
        </span>
        <span>&lrm;{valueNext.toLocaleString("ru-RU") + " ₽"}&lrm;</span>
      </div>
    </div>
  );
};

export default BubblesForce;
