import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { SudokuGraph, GraphNode } from "../engine/SudokuEngine";
import type { SudokuGrid } from "../engine/SudokuEngine";
import { COLOR_PALETTE, EMPTY_CELL, GRID_SIZE } from "../engine/constants";

interface Edge {
  source: number;
  target: number;
}

interface SameValueEdge extends Edge {
  value: number;
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

    // Pre-compute same-value edges: all pairs of nodes sharing the same digit
    const sameValueEdges: SameValueEdge[] = [];
    for (let val = 1; val <= GRID_SIZE; val++) {
      const group = graph.nodes.filter((n) => solution[n.row][n.col] === val);
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          sameValueEdges.push({
            source: group[i].index,
            target: group[j].index,
            value: val,
          });
        }
      }
    }

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

    // Layer 1 — constraint edges (must-be-different: row/col/box)
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

    // Layer 2 — same-value edges (dashed amber), hidden until a node is clicked
    const sameValueSel = root
      .append("g")
      .selectAll<SVGLineElement, SameValueEdge>("line")
      .data(sameValueEdges)
      .join("line")
      .attr("x1", (d) => nodeX(graph.nodes[d.source]))
      .attr("y1", (d) => nodeY(graph.nodes[d.source]))
      .attr("x2", (d) => nodeX(graph.nodes[d.target]))
      .attr("y2", (d) => nodeY(graph.nodes[d.target]))
      .attr("stroke", "#f59e0b")
      .attr("stroke-opacity", 0)
      .attr("stroke-width", 1.2)
      .attr("stroke-dasharray", "3 2");

    // Layer 3 — nodes
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

    // Layer 4 — labels (on top so they're always readable)
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
      sameValueSel.attr("stroke-opacity", 0);
    };

    nodeSel.on("click", (event, d) => {
      event.stopPropagation();

      if (selected === d.index) {
        selected = null;
        resetStyles();
        return;
      }

      selected = d.index;
      const selectedVal = solution[d.row][d.col];
      const neighborSet = new Set(graph.adjacency[d.index]);
      const sameValueSet = new Set(
        graph.nodes
          .filter(
            (n) =>
              solution[n.row][n.col] === selectedVal && n.index !== d.index,
          )
          .map((n) => n.index),
      );

      // Selected node → white ring
      // Constraint neighbors → normal ring, full opacity
      // Same-value nodes → amber ring, full opacity
      // Everything else → dimmed
      nodeSel
        .attr("opacity", (n) => {
          if (
            n.index === d.index ||
            neighborSet.has(n.index) ||
            sameValueSet.has(n.index)
          )
            return 1;
          return 0.12;
        })
        .attr("r", (n) => {
          if (n.index === d.index) return 11;
          if (neighborSet.has(n.index) || sameValueSet.has(n.index)) return 9;
          return 7;
        })
        .attr("stroke", (n) => {
          if (n.index === d.index) return "#ffffff";
          if (sameValueSet.has(n.index)) return "#f59e0b";
          return "#111827";
        })
        .attr("stroke-width", (n) => {
          if (n.index === d.index || sameValueSet.has(n.index)) return 2.5;
          return 1.5;
        });

      // Constraint edges for selected node → blue, rest → very dim
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

      // Same-value edges for selected node → amber dashed, rest hidden
      sameValueSel.attr("stroke-opacity", (e) =>
        e.source === d.index || e.target === d.index ? 0.85 : 0,
      );
    });

    d3.select(el).on("click", () => {
      selected = null;
      resetStyles();
    });

    return () => {
      d3.select(el).on(".zoom", null).on("click", null);
    };
  }, [graph, solution]);

  return (
    <div>
      <div className="flex gap-6 justify-center text-xs text-gray-400 mb-2">
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#60a5fa" strokeWidth="2" />
          </svg>
          Constraint
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8">
            <line x1="0" y1="4" x2="20" y2="4" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
          </svg>
          Same value
        </span>
      </div>
      <svg
        ref={svgRef}
        className="rounded-lg bg-gray-900 border border-gray-700 touch-none"
        style={{ width: "min(95vw, 450px)", height: "min(95vw, 450px)" }}
      />
    </div>
  );
}
