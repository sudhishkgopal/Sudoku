import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { SudokuGraph } from "../engine/SudokuEngine";
import type { SudokuGrid } from "../engine/SudokuEngine";
import { COLOR_PALETTE, EMPTY_CELL, GRID_SIZE } from "../engine/constants";

interface Props {
  graph: SudokuGraph;
  solution: SudokuGrid;
}

export default function GraphView({ graph, solution }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graph.nodes.length) return;

    const el = svgRef.current!;
    const width = el.clientWidth;
    const height = el.clientHeight;

    // Clear previous graph
    const svg = d3.select(el);
    svg.selectAll("*").remove();

    const root = d3.select(el).append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => {
        root.attr("transform", event.transform);
      });
    d3.select(el).call(zoom);

    const links = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    const nodeColor = (index: number): string => {
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;
      const value = solution[row][col];
      return value !== EMPTY_CELL ? COLOR_PALETTE[value - 1] : COLOR_PALETTE[0];
    };

    // Force simulation
    const sim = d3
      .forceSimulation(
        graph.nodes.map((n) => ({ ...n })) as d3.SimulationNodeDatum[],
      )
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: d3.SimulationNodeDatum & { index?: number }) => d.index ?? 0)
          .distance(28)
          .strength(0.4),
      )
      .force("charge", d3.forceManyBody().strength(-60))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(10));

    // Edges
    const link = root
      .append("g")
      .attr("stroke", "#374151")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 0.8);

    // Nodes
    const node = root
      .append("g")
      .selectAll("g")
      .data(sim.nodes())
      .join("g")
      .call(
        d3
          .drag<SVGGElement, d3.SimulationNodeDatum>()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    node
      .append("circle")
      .attr("r", 9)
      .attr("fill", (_, i) => nodeColor(i))
      .attr("stroke", "#111827")
      .attr("stroke-width", 1);

    node
      .append("text")
      .text((_, i) => {
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;
        const val = solution[row][col];
        return val !== EMPTY_CELL ? String(val) : "";
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", 7)
      .attr("font-weight", "bold")
      .attr("fill", "#111827")
      .attr("pointer-events", "none");

    // Tick — update positions each frame
    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as d3.SimulationNodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as d3.SimulationNodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as d3.SimulationNodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as d3.SimulationNodeDatum).y ?? 0);
      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      sim.stop();
    };
  }, [graph, solution]);

  return (
    <svg
      ref={svgRef}
      className="w-full rounded-lg bg-gray-900 border border-gray-700 touch-none"
      style={{ width: "min(95vw, 450px)", height: "min(95vw, 450px)" }}
    />
  );
}
