import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import {
  ArrowLeft,
  ChevronRight,
  Search,
  Filter,
  Network,
  Info,
  CircleDot,
  Bug,
  FlaskConical,
  Activity,
  GitBranch,
  Beaker,
  ArrowRightLeft,
  Circle,
  Layers,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createAllMockData } from '@/mock/factory';
import type {
  SimulationTask,
  MetabolicNetworkNode,
  MetabolicNetworkEdge,
  NetworkNodeType,
  NetworkEdgeType,
} from '@shared/types';

const NODE_TYPE_CONFIG: Record<NetworkNodeType, { label: string; color: string; icon: React.ElementType }> = {
  microbe: { label: '微生物', color: '#10b981', icon: Bug },
  compound: { label: '化合物', color: '#3b82f6', icon: Layers },
  enzyme: { label: '酶', color: '#f59e0b', icon: FlaskConical },
  reaction: { label: '反应', color: '#8b5cf6', icon: GitBranch },
};

const EDGE_TYPE_CONFIG: Record<NetworkEdgeType, { label: string; color: string; dash?: string }> = {
  metabolize: { label: '代谢', color: '#10b981' },
  catalyze: { label: '催化', color: '#f59e0b' },
  produce: { label: '生成', color: '#3b82f6' },
  inhibit: { label: '抑制', color: '#ef4444', dash: '6,4' },
};

const mockData = createAllMockData();

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  type: NetworkNodeType;
  label: string;
  abundance?: number;
  size: number;
  color: string;
}

interface D3Edge {
  source: string | D3Node;
  target: string | D3Node;
  weight: number;
  type: NetworkEdgeType;
  color: string;
  width: number;
  dash?: string;
}

export default function MetabolicNetwork() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Edge> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const simIdFromState = (location.state as { simId?: string } | null)?.simId;

  const [nodeFilters, setNodeFilters] = useState<Record<NetworkNodeType, boolean>>({
    microbe: true,
    compound: true,
    enzyme: true,
    reaction: true,
  });
  const [abundanceThreshold, setAbundanceThreshold] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<D3Node | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: D3Node } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const task: SimulationTask | undefined = useMemo(() => {
    const targetId = id || simIdFromState;
    const found = mockData.simulations.find((s) => s.id === targetId);
    return found || mockData.simulations.find((s) => s.network) || mockData.simulations[0];
  }, [id, simIdFromState]);

  const networkData = useMemo(() => {
    const network = task?.network;
    if (!network || !network.nodes?.length) {
      const nodes: D3Node[] = [];
      const edges: D3Edge[] = [];
      const microbes = task?.microbes || [];
      const enzymes = task?.enzymes || [];
      const compounds = ['葡萄糖', '丙酮酸', '乙酰CoA', 'CO₂', 'NH₄⁺', 'PO₄³⁻', 'ATP', 'NADH', '纤维素', '木质素'];
      const reactions = ['糖酵解', '三羧酸循环', '氧化磷酸化', '固氮作用', '解磷作用', '纤维素分解'];

      microbes.slice(0, 6).forEach((m) => {
        nodes.push({
          id: m.id,
          type: 'microbe',
          label: m.genus,
          abundance: m.relativeAbundance,
          size: 12 + Math.sqrt(m.relativeAbundance) * 2,
          color: NODE_TYPE_CONFIG.microbe.color,
        });
      });
      compounds.forEach((c, i) => {
        nodes.push({
          id: `cmp_${i}`,
          type: 'compound',
          label: c,
          abundance: 30 + Math.random() * 70,
          size: 10 + Math.random() * 8,
          color: NODE_TYPE_CONFIG.compound.color,
        });
      });
      enzymes.slice(0, 4).forEach((e) => {
        nodes.push({
          id: e.id,
          type: 'enzyme',
          label: e.enzymeName,
          abundance: e.activity,
          size: 10 + Math.sqrt(e.activity) * 0.5,
          color: NODE_TYPE_CONFIG.enzyme.color,
        });
      });
      reactions.forEach((r, i) => {
        nodes.push({
          id: `rxn_${i}`,
          type: 'reaction',
          label: r,
          abundance: 40 + Math.random() * 60,
          size: 11 + Math.random() * 6,
          color: NODE_TYPE_CONFIG.reaction.color,
        });
      });

      for (let i = 0; i < 50; i++) {
        const src = nodes[Math.floor(Math.random() * nodes.length)];
        let tgt = nodes[Math.floor(Math.random() * nodes.length)];
        let attempts = 0;
        while (tgt.id === src.id && attempts < 10) {
          tgt = nodes[Math.floor(Math.random() * nodes.length)];
          attempts++;
        }
        if (tgt.id !== src.id) {
          const types = [src.type, tgt.type].sort().join('-');
          let edgeType: NetworkEdgeType = 'metabolize';
          if (types.includes('enzyme')) edgeType = 'catalyze';
          else if (types.includes('reaction')) edgeType = Math.random() > 0.3 ? 'produce' : 'inhibit';
          else if (types.includes('microbe')) edgeType = 'metabolize';
          const cfg = EDGE_TYPE_CONFIG[edgeType];
          edges.push({
            source: src.id,
            target: tgt.id,
            weight: 0.3 + Math.random() * 0.9,
            type: edgeType,
            color: cfg.color,
            width: 1 + Math.random() * 2.5,
            dash: cfg.dash,
          });
        }
      }
      return { nodes, edges };
    }

    const d3nodes: D3Node[] = network.nodes.map((n: MetabolicNetworkNode) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      abundance: n.abundance || 50,
      size: 10 + Math.sqrt(n.abundance || 50) * 0.8,
      color: NODE_TYPE_CONFIG[n.type].color,
    }));

    const d3edges: D3Edge[] = (network.edges || []).map((e: MetabolicNetworkEdge) => {
      const cfg = EDGE_TYPE_CONFIG[e.type];
      return {
        source: e.source,
        target: e.target,
        weight: e.weight,
        type: e.type,
        color: cfg.color,
        width: 1 + e.weight * 2,
        dash: cfg.dash,
      };
    });

    return { nodes: d3nodes, edges: d3edges };
  }, [task]);

  const filteredData = useMemo(() => {
    const minAbundance = abundanceThreshold;
    const query = searchQuery.trim().toLowerCase();

    const filteredNodes = networkData.nodes.filter((n) => {
      if (!nodeFilters[n.type]) return false;
      if ((n.abundance || 0) < minAbundance) return false;
      if (query && !n.label.toLowerCase().includes(query) && !n.id.toLowerCase().includes(query)) return false;
      return true;
    });

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = networkData.edges.filter((e) => {
      const srcId = typeof e.source === 'string' ? e.source : e.source.id;
      const tgtId = typeof e.target === 'string' ? e.target : e.target.id;
      return nodeIds.has(srcId) && nodeIds.has(tgtId);
    });

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [networkData, nodeFilters, abundanceThreshold, searchQuery]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: isFullscreen ? window.innerHeight - 180 : rect.height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen]);

  useEffect(() => {
    if (!svgRef.current || filteredData.nodes.length === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerG = svg.append('g').attr('class', 'container-g');
    const linksG = containerG.append('g').attr('class', 'links');
    const nodesG = containerG.append('g').attr('class', 'nodes');

    const defs = svg.append('defs');
    Object.entries(EDGE_TYPE_CONFIG).forEach(([type, cfg]) => {
      if (cfg.dash) {
        defs.append('marker')
          .attr('id', `arrow-${type}`)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 20)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', cfg.color);
      }
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        containerG.attr('transform', event.transform);
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    const nodes: D3Node[] = filteredData.nodes.map((d) => ({ ...d }));
    const edges: D3Edge[] = filteredData.edges.map((d) => ({ ...d }));

    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('link', d3.forceLink<D3Node, D3Edge>(edges)
        .id((d) => d.id)
        .distance((d) => 60 + (1 - (d.weight || 0.5)) * 60)
        .strength((d) => 0.3 + (d.weight || 0.5) * 0.4))
      .force('charge', d3.forceManyBody().strength((d) => -80 - ((d as D3Node).size || 10) * 3))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<D3Node>().radius((d) => (d.size || 10) + 4))
      .force('x', d3.forceX<D3Node>(width / 2).strength(0.05))
      .force('y', d3.forceY<D3Node>(height / 2).strength(0.05));

    simulationRef.current = simulation;

    const link = linksG.selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', (d) => d.color)
      .attr('stroke-opacity', 0.45)
      .attr('stroke-width', (d) => d.width)
      .attr('stroke-dasharray', (d) => d.dash || null);

    const node = nodesG.selectAll<SVGGElement, D3Node>('g.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('cursor', 'grab')
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append('circle')
      .attr('r', (d) => d.size || 10)
      .attr('fill', (d) => d.color)
      .attr('fill-opacity', 0.85)
      .attr('stroke', (d) => d3.color(d.color)?.darker(0.4).toString() || '#000')
      .attr('stroke-width', 1.5);

    node.append('text')
      .text((d) => (d.size || 10) > 12 ? d.label : '')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => -(d.size || 10) - 4)
      .attr('font-size', 10)
      .attr('fill', '#475569')
      .attr('font-weight', 500)
      .attr('pointer-events', 'none');

    const linkedByIndex = new Map<string, Set<string>>();
    edges.forEach((e) => {
      const s = typeof e.source === 'string' ? e.source : e.source.id;
      const t = typeof e.target === 'string' ? e.target : e.target.id;
      if (!linkedByIndex.has(s)) linkedByIndex.set(s, new Set());
      if (!linkedByIndex.has(t)) linkedByIndex.set(t, new Set());
      linkedByIndex.get(s)!.add(t);
      linkedByIndex.get(t)!.add(s);
    });

    node.on('mouseover', function(event, d) {
        d3.select(this).select('circle')
          .attr('stroke-width', 3)
          .attr('stroke', '#1e293b');

        setHoveredNode(d);
        const [x, y] = d3.pointer(event, containerRef.current);
        setTooltip({ x: x + 15, y: y - 10, node: d });

        node.style('opacity', (n) => {
          if (n.id === d.id) return 1;
          const conn = linkedByIndex.get(d.id);
          return conn?.has(n.id) ? 0.85 : 0.2;
        });
        link.style('opacity', (l) => {
          const sid = typeof l.source === 'string' ? l.source : (l.source as D3Node).id;
          const tid = typeof l.target === 'string' ? l.target : (l.target as D3Node).id;
          return sid === d.id || tid === d.id ? 1 : 0.08;
        });
      })
      .on('mouseout', function() {
        d3.select(this).select('circle')
          .attr('stroke-width', 1.5)
          .attr('stroke', (d: unknown) => {
            const dd = d as D3Node;
            return d3.color(dd.color)?.darker(0.4).toString() || '#000';
          });
        setHoveredNode(null);
        setTooltip(null);
        node.style('opacity', 1);
        link.style('opacity', 0.45);
      })
      .on('click', function(_, d) {
        setSelectedNode(d);
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as D3Node).x!)
        .attr('y1', (d) => (d.source as D3Node).y!)
        .attr('x2', (d) => (d.target as D3Node).x!)
        .attr('y2', (d) => (d.target as D3Node).y!);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredData, dimensions]);

  const resetView = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(
        zoomRef.current.transform,
        d3.zoomIdentity
      );
    }
  };

  const relatedReactions = useMemo(() => {
    if (!selectedNode) return [];
    return filteredData.edges.filter((e) => {
      const sid = typeof e.source === 'string' ? e.source : e.source.id;
      const tid = typeof e.target === 'string' ? e.target : e.target.id;
      return sid === selectedNode.id || tid === selectedNode.id;
    }).map((e) => {
      const otherId = (() => {
        const sid = typeof e.source === 'string' ? e.source : e.source.id;
        const tid = typeof e.target === 'string' ? e.target : e.target.id;
        return sid === selectedNode.id ? tid : sid;
      })();
      const otherNode = filteredData.nodes.find((n) => n.id === otherId);
      return {
        edge: e,
        other: otherNode,
        direction: (typeof e.source === 'string' ? e.source : e.source.id) === selectedNode.id ? '→' : '←',
      };
    });
  }, [selectedNode, filteredData]);

  const relatedCount = relatedReactions.length;

  return (
      <div className={cn(
        'min-h-[calc(100vh-8rem)]',
        isFullscreen && 'fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 p-4'
      )}>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('mb-4', isFullscreen && 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-3 border border-slate-200 dark:border-slate-700')}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isFullscreen) {
                    setIsFullscreen(false);
                  } else if (task?.id) {
                    navigate(`/simulations/${task.id}`);
                  } else {
                    navigate(-1);
                  }
                }}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <Link to="/simulations" className="hover:text-slate-700 flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    模拟任务
                  </Link>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-700 font-medium">代谢网络可视化</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-violet-600" />
                  代谢互作网络
                  {task && <span className="text-xs font-normal text-slate-400 ml-2">({task.taskNo})</span>}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={task?.id ? `/simulations/${task.id}` : '/simulations'}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Activity className="w-4 h-4" />
                返回模拟详情
              </Link>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title={isFullscreen ? '退出全屏' : '全屏'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col xl:flex-row gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-w-0 space-y-4"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索节点名称/ID..."
                      className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs text-slate-500">节点类型</span>
                    <div className="flex items-center gap-1 ml-1">
                      {(Object.keys(NODE_TYPE_CONFIG) as NetworkNodeType[]).map((type) => {
                        const cfg = NODE_TYPE_CONFIG[type];
                        const Icon = cfg.icon;
                        const active = nodeFilters[type];
                        return (
                          <button
                            key={type}
                            onClick={() => setNodeFilters((p) => ({ ...p, [type]: !p[type] }))}
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                              active
                                ? 'shadow-sm'
                                : 'opacity-30 hover:opacity-60'
                            )}
                            style={{ backgroundColor: active ? cfg.color + '20' : 'transparent' }}
                            title={cfg.label}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                    <CircleDot className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs text-slate-500 whitespace-nowrap">最小丰度</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={abundanceThreshold}
                      onChange={(e) => setAbundanceThreshold(+e.target.value)}
                      className="w-28 accent-violet-500"
                    />
                    <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 w-7 text-right">{abundanceThreshold}</span>
                  </div>

                  <button
                    onClick={resetView}
                    className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    title="重置视图"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={containerRef}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative"
              style={{ height: isFullscreen ? 'calc(100vh - 260px)' : '560px' }}
            >
              <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full"
              />

              {tooltip && (
                <div
                  className="absolute z-20 pointer-events-none bg-slate-900 text-white rounded-lg shadow-xl px-3 py-2 text-xs max-w-[200px]"
                  style={{ left: tooltip.x, top: tooltip.y }}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-semibold">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tooltip.node.color }}
                    />
                    {tooltip.node.label}
                  </div>
                  <div className="space-y-0.5 text-slate-300">
                    <div>类型：<span className="text-white">{NODE_TYPE_CONFIG[tooltip.node.type].label}</span></div>
                    <div>丰度/通量：<span className="text-white font-mono">{tooltip.node.abundance?.toFixed(1)}</span></div>
                    <div>ID：<span className="font-mono opacity-80">{tooltip.node.id.slice(0, 14)}</span></div>
                  </div>
                </div>
              )}

              {filteredData.nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-slate-800/50">
                  <Network className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm font-medium">没有匹配的节点</p>
                  <p className="text-xs mt-1">请调整筛选条件或搜索关键词</p>
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-sm">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">边类型</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {(Object.entries(EDGE_TYPE_CONFIG) as [NetworkEdgeType, typeof EDGE_TYPE_CONFIG[NetworkEdgeType]][]).map(([type, cfg]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <svg width="24" height="8">
                        <line
                          x1="0" y1="4" x2="24" y2="4"
                          stroke={cfg.color}
                          strokeWidth="2"
                          strokeDasharray={cfg.dash || null}
                        />
                      </svg>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">{cfg.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-sm">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">节点类型</div>
                <div className="space-y-1">
                  {(Object.entries(NODE_TYPE_CONFIG) as [NetworkNodeType, typeof NODE_TYPE_CONFIG[NetworkNodeType]][]).map(([type, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <div key={type} className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                        <span className="text-[11px] text-slate-600 dark:text-slate-300">{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 shadow-sm text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <CircleDot className="w-3 h-3 text-violet-500" />
                节点: <b className="text-slate-800 dark:text-slate-200">{filteredData.nodes.length}</b>
                <span className="text-slate-300">|</span>
                边: <b className="text-slate-800 dark:text-slate-200">{filteredData.edges.length}</b>
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full xl:w-[320px] shrink-0"
          >
            <div className="sticky top-24 space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    节点详情
                  </h3>
                  {selectedNode && (
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: selectedNode.color + '20' }}
                      >
                        <Circle
                          className="w-6 h-6"
                          style={{ color: selectedNode.color }}
                          fill={selectedNode.color}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: selectedNode.color }}
                          />
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: selectedNode.color + '15', color: selectedNode.color }}>
                            {NODE_TYPE_CONFIG[selectedNode.type].label}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">
                          {selectedNode.label}
                        </h4>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          {selectedNode.id}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-2.5">
                        <div className="text-[10px] text-slate-500 mb-0.5">丰度 / 通量</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                          {selectedNode.abundance?.toFixed(1)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-2.5">
                        <div className="text-[10px] text-slate-500 mb-0.5">关联连接</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                          {relatedCount}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-violet-500" />
                          相关反应
                          <span className="text-[10px] font-normal text-slate-400">({relatedCount})</span>
                        </h5>
                      </div>
                      <div className={cn(
                        'space-y-2',
                        relatedCount > 5 ? 'max-h-[280px] overflow-y-auto pr-1' : ''
                      )}>
                        {relatedReactions.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400">
                            暂无相关反应记录
                          </div>
                        ) : (
                          relatedReactions.map((r, i) => {
                            const cfg = EDGE_TYPE_CONFIG[r.edge.type];
                            return (
                              <div
                                key={i}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: cfg.color + '15', color: cfg.color }}>
                                    {cfg.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    w={r.edge.weight.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-200">
                                  <span className="font-medium truncate">{selectedNode.label}</span>
                                  <span className="text-slate-400">{r.direction}</span>
                                  {r.other ? (
                                    <span
                                      className="font-medium truncate"
                                      style={{ color: r.other.color }}
                                    >
                                      {r.other.label}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 truncate">未知节点</span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                      <Beaker className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">未选择节点</p>
                    <p className="text-xs text-slate-400 mt-1">
                      点击网络图中的节点查看详细信息
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-violet-50 to-indigo-50/70 dark:from-violet-500/10 dark:to-indigo-500/5 rounded-2xl border border-violet-200/50 dark:border-violet-500/20 p-4">
                <h3 className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5" />
                  操作说明
                </h3>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    <span>拖拽节点可调整位置，松开后保持平衡</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    <span>鼠标滚轮缩放画布，空白处拖动平移视图</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    <span>悬浮节点高亮关联连接，点击显示详情</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    <span>节点大小映射丰度/通量值，边粗细映射权重</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
  );
}
