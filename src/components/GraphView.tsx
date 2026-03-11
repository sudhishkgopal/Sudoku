import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { SudokuGraph, GraphNode } from "../engine/SudokuEngine";
import type { SudokuGrid } from "../engine/SudokuEngine";
import { COLOR_PALETTE, EMPTY_CELL, GRID_SIZE } from "../engine/constants";

interface Edge {
  source: number;
  target: number;
}

interface Props {
  graph: SudokuGraph;
  solution: SudokuGrid;
}

export default function GraphView({ graph, solution }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !graph.nodes.length) return;

    const el = svgRef.current;
    const size = el.clientWidth || 450;
    const padding = 24;
    const step = (size - padding * 2) / (GRID_SIZE - 1);

    const nodeX = (n: GraphNode) => padding + n.col * step;
    const nodeY = (n: GraphNode) => padding + n.row * step;

    const nodeColor = (n: GraphNode): string => {
      const val = solution[n.row][n.col];
      return val !== EMPTY_CELL ? COLOR_PALETTE[val - 1] : "#4b5563";
    };

    d3.select(el).selectAll("*").remove();

    const root = d3.select(el).append("g");

    // Zoom / pinch-to-zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 6])
      .on("zoom", (event) => root.attr("transform", event.transform));
    d3.select(el).call(zoom);

    const edges: Edge[] = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    // Edges
    const linkSel = root
      .append("g")
      .selectAll<SVGLineElement, Edge>("line")
      .data(edges)
      .join("line")
      .attr("x1", (d) => nodeX(graph.nodes[d.source]))
      .attr("y1", (d) => nodeY(graph.nodes[d.source]))
      .attr("x2", (d) => nodeX(graph.nodes[d.target]))
      .attr("y2", (d) => nodeY(graph.nodes[d.target]))
      .attr("stroke", "#6b7280")
      .attr("stroke-opacity", 0.2)
      .attr("stroke-width", 0.6);

    // Nodes
    const nodeSel = root
      .append("g")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(graph.nodes)
      .join("circle")
      .attr("cx", nodeX)
      .attr("cy", nodeY)
      .attr("r", 8)
      .attr("fill", nodeColor)
      .attr("stroke", "#111827")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer");

    // Labels
    root
      .append("g")
      .selectAll<SVGTextElement, GraphNode>("text")
      .data(graph.nodes)
      .join("text")
      .attr("x", nodeX)
      .attr("y", nodeY)
      .text((n) => {
        const val = solution[n.row][n.col];
        return val !== EMPTY_CELL ? String(val) : "";
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", 7)
      .attr("font-weight", "bold")
      .attr("fill", "#111827")
      .attr("pointer-events", "none");

    let selected: number | null = null;

    const resetStyles = () => {
      nodeSel
        .attr("opacity", 1)
        .attr("r", 8)
        .attr("stroke", "#111827")
        .attr("stroke-width", 1.5);
      linkSel
        .attr("stroke", "#6b7280")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-width", 0.6);
    };

    nodeSel.on("click", (event, d) => {
      event.stopPropagation();

      // Clicking same node deselects
      if (selected === d.index) {
        selected = null;
        resetStyles();
        return;
      }

      selected = d.index;
      const neighborSet = new Set(graph.adjacency[d.index]);

      // Dim unrelated nodes, enlarge selected + neighbors
      nodeSel
        .attr("opacity", (n) =>
          n.index === d.index || neighborSet.has(n.index) ? 1 : 0.12,
        )
        .attr("r", (n) =>
          n.index === d.index ? 11 : neighborSet.has(n.index) ? 9 : 7,
        )
        .attr("stroke", (n) => (n.index === d.index ? "#ffffff" : "#111827"))
        .attr("stroke-width", (n) => (n.index === d.index ? 2.5 : 1.5));

      // Highlight connected edges, dim the rest
      linkSel
        .attr("stroke", (e) =>
          e.source === d.index || e.target === d.index ? "#60a5fa" : "#6b7280",
        )
        .attr("stroke-opacity", (e) =>
          e.source === d.index || e.target === d.index ? 0.75 : 0.04,
        )
        .attr("stroke-width", (e) =>
          e.source === d.index || e.target === d.index ? 1.5 : 0.5,
        );
    });

    // Click background to deselect
    d3.select(el).on("click", () => {
      selected = null;
      resetStyles();
    });

    return () => {
      d3.select(el).on(".zoom", null).on("click", null);
    };
  }, [graph, solution]);

  return (
    <svg
      ref={svgRef}
      className="rounded-lg bg-gray-900 border border-gray-700 touch-none"
      style={{ width: "min(95vw, 450px)", height: "min(95vw, 450px)" }}
    />
  );
}
