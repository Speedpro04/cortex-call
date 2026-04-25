'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  group: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
}

const data = {
  nodes: [
    { id: '1', name: 'Scripts de Venda', group: 1 },
    { id: '2', name: 'Tabela de Preços', group: 2 },
    { id: '3', name: 'Leads Ativos', group: 3 },
    { id: '4', name: 'Análise Polars', group: 4 },
    { id: '5', name: 'Protocolos de Resposta', group: 1 },
    { id: '6', name: 'Fluxo de Caixa', group: 2 },
    { id: '7', name: 'Solara Brain', group: 5 },
  ],
  links: [
    { source: '1', target: '7' },
    { source: '2', target: '7' },
    { source: '3', target: '7' },
    { source: '4', target: '7' },
    { source: '5', target: '1' },
    { source: '6', target: '2' },
    { source: '4', target: '3' },
  ]
};

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 300;
    const height = 300;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%');

    svg.selectAll('*').remove();

    // Definição de Gradientes para os Nodes
    const defs = svg.append('defs');
    
    // Gradiente para o Core (Solara Brain)
    const coreGradient = defs.append('linearGradient')
      .attr('id', 'coreNodeGradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    coreGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ff9f43');
    coreGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ee5253');

    const simulation = d3.forceSimulation<Node>(data.nodes as any)
      .force('link', d3.forceLink<Node, Link>(data.links as any).id(d => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20));

    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    const node = svg.append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Círculo principal dos Nodes
    node.append('circle')
      .attr('r', d => d.group === 5 ? 12 : 6)
      .attr('fill', d => {
        if (d.group === 5) return 'url(#coreNodeGradient)';
        switch(d.group) {
          case 1: return '#706fd3';
          case 2: return '#2ecc71';
          case 3: return '#3498db';
          case 4: return '#f1c40f';
          default: return '#95a5a6';
        }
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('class', d => d.group === 5 ? 'animate-pulse' : '');

    // Labels
    node.append('text')
      .text(d => d.name)
      .attr('x', 10)
      .attr('y', 4)
      .style('font-size', '8px')
      .style('font-weight', '700')
      .style('text-transform', 'uppercase')
      .style('pointer-events', 'none')
      .attr('fill', '#475569');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-50 relative overflow-hidden flex items-center justify-center">
      <svg ref={svgRef} className="w-full h-full"></svg>
      <div className="absolute bottom-2 right-2 px-3 py-1 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg text-[8px] font-bold text-slate-400 uppercase tracking-widest">
        Neural Map Active
      </div>
    </div>
  );
}
