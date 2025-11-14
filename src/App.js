import { useState, useEffect, useRef, Suspense, lazy } from "react";
import "./App.css";
import { SegmentControl } from "./components/uiSegmentControl";
import { Select } from "./components/uiSelect";

const BubblesForce = lazy(() => import("./components/bubblesForce"));

const categories = [
  "Общественное питание",
  "Продовольствие",
  "Транспорт",
  "Маркетплейсы",
  "Здоровье",
  "Другие категории",
  "Все категории",
];

const measures = ["Рубли", "Проценты"];

// Format with compact notation (e.g., 123M)
const compactNumber = (n) =>
  new Intl.NumberFormat("ru-RU", { notation: "compact" }).format(n);

function App() {
  const containerRef = useRef();

  const [showPopup, setShowPopup] = useState(false);
  const [territoryMinValue, setTerritoryMinValue] = useState(0);
  const [territoryMaxValue, setTerritoryMaxValue] = useState(0);
  const [activeCategory, setActiveCategory] = useState("Общественное питание");
  const [measure, setMeasure] = useState("Рубли");
  const [chartContainerWidth, setChartContainerWidth] = useState(0);
  const [chartContainerHeight, setChartContainerHeight] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setChartContainerWidth(entry.contentRect.width);
        setChartContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(element);

    // Cleanup the observer when the component unmounts
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="App" ref={containerRef}>
      {showPopup ? (
        <div id="popup">
          <div
            style={{ position: "absolute", right: "16px", top: "16px" }}
            onClick={() => setShowPopup(false)}
          >
            <svg
              height="48px"
              viewBox="0 -960 960 960"
              width="48px"
              fill="rgba(0, 0, 0, .4)"
            >
              <path d="m252.85-230.85-22-22L458-480 230.85-707.15l22-22L480-502l227.15-227.15 22 22L502-480l227.15 227.15-22 22L480-458 252.85-230.85Z" />
            </svg>
          </div>
          <div className="paragraph">
            Круг&nbsp;&mdash; муниципальное образование. Его размер&nbsp;&mdash;
            это разница сумм средних месячных расходов за&nbsp;год (сумма
            средних месячных расходов за&nbsp;2024&nbsp;минус сумма
            за&nbsp;2023).
          </div>
          <div className="paragraph">
            Если круг белый с&nbsp;черной обводкой, значит разница положительная
            (расходы выросли). Если красный&nbsp;&mdash; отрицательная
            (сократились). В&nbsp;выборке участвуют только те&nbsp;МО,
            по&nbsp;которым есть полные данные (расходы за&nbsp;все месяцы
            в&nbsp;течение двух лет).
          </div>
          <div className="paragraph">
            <ol>
              В визуализации использованы данные:
              <li>
                <a href="https://sberindex.ru/ru/research/data-sense-opisanie-nabora-dannikh-khakatona-sberindeksa-po-munitsipalnim-dannim">
                  Потребительские безналичные расходы на&nbsp;уровне
                  муниципальных образований по&nbsp;категориям трат.
                </a>{" "}
                СберИндекс. Скачаны 01.11.2025.
              </li>
              <li>
                <a href="https://sberindex.ru/ru/news/dataset-borders-and-changes-of-municipalities">
                  Справочник МО.
                </a>
              </li>
            </ol>
          </div>
          <div className="paragraph">
            <a href="https://t.me/spacernamer">Контакт для обратной связи</a>
          </div>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          rowGap: "1em",
        }}
      >
        <header className="App-header">
          <span>
            Разница в&nbsp;расходах жителей&nbsp;МО в&nbsp;2023/24&nbsp;годах
            по&nbsp;категориям
          </span>
        </header>

        <div
          style={{
            display: "flex",
            columnGap: ".5em",
            rowGap: ".5em",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: "5%",
            paddingRight: "5%",
          }}
        >
          {chartContainerWidth < 1000 ? (
            <>
              <Select
                data={categories}
                setActiveCategory={setActiveCategory}
                activeCategory={activeCategory}
              />
              <Select
                data={measures}
                setActiveCategory={setMeasure}
                activeCategory={measure}
              />
            </>
          ) : (
            <>
              <SegmentControl
                data={categories}
                setActiveCategory={setActiveCategory}
                activeCategory={activeCategory}
              />
              <SegmentControl
                data={measures}
                setActiveCategory={setMeasure}
                activeCategory={measure}
              />
            </>
          )}
          <button onClick={() => setShowPopup(true)}>Описание</button>
        </div>

        <div className="caption">
          <p>
            Размер круга показывает разницу в&nbsp;расходах по&nbsp;сравнению
            с&nbsp;предыдущим годом:{" "}
            {compactNumber(territoryMinValue) +
              "–" +
              compactNumber(territoryMaxValue) +
              (measure === "Рубли" ? " ₽" : "%")}
            .{" "}
            {activeCategory !== "Маркетплейсы" ? (
              <>
                <svg
                  width="1.4em"
                  height="1.4em"
                  style={{ marginRight: "2em", marginLeft: "1.4em" }}
                >
                  <circle
                    cx=".7em"
                    cy=".7em"
                    r="1.4em"
                    fill="none"
                    stroke="black"
                    strokeWidth={1}
                  />
                </svg>
                Белый круг&nbsp;– положительная&nbsp;разница.
                <svg
                  width="1.4em"
                  height="1.4em"
                  style={{ marginRight: "2em", marginLeft: "1.4em" }}
                >
                  <circle cx=".7em" cy=".7em" r="1.4em" fill="#ee4444" />
                </svg>
                Красный&nbsp;–&nbsp;отрицательная.
              </>
            ) : null}
          </p>
        </div>
      </div>

      <Suspense fallback={<Loading />}>
        <BubblesForce
          measure={measure}
          setTerritoryMinValue={setTerritoryMinValue}
          setTerritoryMaxValue={setTerritoryMaxValue}
          activeCategory={activeCategory}
          chartContainerWidth={chartContainerWidth}
          chartContainerHeight={chartContainerHeight}
        />
      </Suspense>
    </div>
  );
}

const Loading = (props) => {
  return <div className="loading">загрузка...</div>;
};

export default App;
