import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export type UserRole =
  | 'FARM_ADMIN'
  | 'ECOLOGIST'
  | 'MICROBE_VALIDATOR'
  | 'SOIL_EXPERT'
  | 'CHIEF_SCIENTIST';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  passwordHash: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  lastLoginAt?: string;
}

export type SoilType = '黑土' | '红壤' | '黄壤' | '褐土' | '潮土' | '水稻土';

export interface SoilPhysicochemicalData {
  id: string;
  sampleId: string;
  soilType: SoilType;
  pH: number;
  organicMatter: number;
  temperature: number;
  moisture: number;
  totalNitrogen?: number;
  availableP?: number;
  clayRatio?: number;
  collectionDate: string;
  location?: { lat: number; lng: number };
  uploaderId: string;
}

export type MetagenomicsFileType = 'FASTQ' | 'FASTA' | 'BAM' | 'VCF';
export type SequencingPlatform = 'Illumina' | 'Nanopore' | 'PacBio';

export interface MetagenomicsFile {
  id: string;
  sampleId: string;
  fileName: string;
  fileSize: number;
  fileType: MetagenomicsFileType;
  uploadTime: string;
  sequencingPlatform?: SequencingPlatform;
  qualityScore?: number;
  readCount?: number;
  uploaderId: string;
}

export interface MicrobeSpecies {
  id: string;
  taxId: string;
  name: string;
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  relativeAbundance: number;
  functions: string[];
  simulationId?: string;
}

export type CarbonPoolName =
  | '活性碳库'
  | '慢性碳库'
  | '惰性碳库'
  | '微生物生物量碳'
  | 'DOC'
  | 'POC';

export interface CarbonPool {
  id: string;
  poolName: CarbonPoolName;
  initialAmount: number;
  currentAmount: number;
  decompositionRate: number;
  turnoverTime: number;
  simulationId?: string;
}

export interface ExtracellularEnzyme {
  id: string;
  enzymeName: string;
  ecNumber: string;
  substrate: string;
  product: string;
  activity: number;
  km: number;
  vmax: number;
  optimalPH: number;
  optimalTemp: number;
  encodingGenes: string[];
  simulationId?: string;
}

export interface MetabolicReaction {
  id: string;
  reactionId: string;
  name: string;
  substrates: { compoundId: string; stoichiometry: number }[];
  products: { compoundId: string; stoichiometry: number }[];
  catalyst?: string;
  deltaG?: number;
  flux: number;
  pathway?: string;
}

export type NetworkNodeType = 'microbe' | 'compound' | 'enzyme' | 'reaction';
export type NetworkEdgeType = 'metabolize' | 'catalyze' | 'produce' | 'inhibit';

export interface MetabolicNetworkNode {
  id: string;
  type: NetworkNodeType;
  label: string;
  abundance?: number;
  x?: number;
  y?: number;
}

export interface MetabolicNetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: NetworkEdgeType;
}

export interface MetabolicNetwork {
  id: string;
  simulationId: string;
  nodes: MetabolicNetworkNode[];
  edges: MetabolicNetworkEdge[];
}

export type SimulationStatus =
  | 'PENDING_VALIDATION'
  | 'NETWORK_BUILDING'
  | 'COMPONENT_INITIALIZING'
  | 'DECOMPOSITION_CALCULATING'
  | 'FLUX_ANALYZING'
  | 'COMPLETED'
  | 'EXCEPTION_FALLBACK';

export const SIMULATION_STATUS_LABELS: Record<SimulationStatus, string> = {
  PENDING_VALIDATION: '待校验',
  NETWORK_BUILDING: '网络构建',
  COMPONENT_INITIALIZING: '组分初始化',
  DECOMPOSITION_CALCULATING: '分解计算',
  FLUX_ANALYZING: '通量分析',
  COMPLETED: '已完成',
  EXCEPTION_FALLBACK: '异常回退',
};

export interface SimulationStatusHistoryItem {
  status: SimulationStatus;
  timestamp: string;
  operatorId?: string;
  remark?: string;
  durationMs?: number;
}

export type TemperatureModel = 'CONSTANT' | 'DIURNAL' | 'SEASONAL';
export type MoistureModel = 'CONSTANT' | 'RAINFALL';

export interface SubstrateAddition {
  type: string;
  amount: number;
  day: number;
}

export interface MicrobeInoculation {
  speciesId: string;
  ratio: number;
  day: number;
}

export interface SimulationParameters {
  simulationDays: number;
  timeStepHours: number;
  temperatureModel: TemperatureModel;
  moistureModel: MoistureModel;
  co2BaselineUpper: number;
  co2BaselineLower: number;
  enzymeDropThreshold: number;
  substrateAddition?: SubstrateAddition[];
  microbeInoculation?: MicrobeInoculation[];
}

export interface SimulationTimePoint {
  timeHour: number;
  co2Flux: number;
  microbialBiomass: number;
  dissolvedOrganicC: number;
  particulateOrganicC: number;
  enzymeActivities: Record<string, number>;
  microbeAbundances: Record<string, number>;
  carbonPoolAmounts: Record<string, number>;
  temperature: number;
  moisture: number;
}

export type WarningLevel = 'INFO' | 'WARNING' | 'CRITICAL';
export type WarningType =
  | 'CO2_DEVIATION'
  | 'ENZYME_DROP'
  | 'BIOMASS_COLLAPSE'
  | 'CONVERGENCE_FAIL';

export interface WarningEvent {
  id: string;
  simulationId: string;
  level: WarningLevel;
  type: WarningType;
  title: string;
  description: string;
  triggeredAt: string;
  hourPoint: number;
  metricName: string;
  baselineValue: number;
  actualValue: number;
  deviationPercent: number;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  reviewComment?: string;
  resolved: boolean;
}

export type AdjustmentType =
  | 'SUBSTRATE_ADD'
  | 'INOCULUM_RATIO'
  | 'PARAMETER_TWEAK'
  | 'NETWORK_REBUILD';

export interface AdjustmentLog {
  id: string;
  simulationId: string;
  warningId?: string;
  adjustmentType: AdjustmentType;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  operatorId: string;
  operatorName: string;
  comment?: string;
  appliedAt: string;
  reSimulationCount: number;
}

export type ApprovalStage = 'MICROBE_VALIDATION' | 'SOIL_HEALTH_EXPERT';
export type ApprovalResult = 'APPROVED' | 'REJECTED' | 'PENDING';

export interface ApprovalRecord {
  id: string;
  simulationId: string;
  stage: ApprovalStage;
  result: ApprovalResult;
  approverId: string;
  approverName: string;
  approverRole: string;
  comment?: string;
  submittedAt?: string;
  decidedAt?: string;
  attachments?: string[];
}

export interface RecommendationAmendment {
  name: string;
  ratio: number;
  unit: string;
}

export type TillageMethod = '免耕' | '少耕' | '深松' | '翻耕' | '旋耕';

export interface Recommendation {
  id: string;
  soilId: string;
  soilType: string;
  amendmentMix: RecommendationAmendment[];
  tillageMethod: TillageMethod;
  cropRotation?: string[];
  estimatedCarbonSequestration: number;
  estimatedCost?: number;
  evidenceSimulations: string[];
  confidenceScore: number;
  createdAt: string;
}

export interface SimulationReportSummary {
  totalCo2Released: number;
  averageDecompositionRate: number;
  finalCarbonStock: number;
  sequestrationPotential: number;
}

export interface SimulationReportFigures {
  carbonDecompositionCurve: string;
  communityCompositionStack: string;
  enzymeActivityHeatmap: string;
  carbonPoolTrend: string;
  [key: string]: string;
}

export interface SimulationReport {
  id: string;
  simulationId: string;
  generatedAt: string;
  summary: SimulationReportSummary;
  figures: SimulationReportFigures;
  adjustmentLogAppendix: AdjustmentLog[];
  approvalAppendix: ApprovalRecord[];
  pdfPath?: string;
}

export interface FunctionalRedundancyRadar {
  dimension: string;
  value: number;
}

export interface DailyDashboardStats {
  date: string;
  totalSimulations: number;
  completedSimulations: number;
  completionRate: number;
  failedSimulations: number;
  warningCount: number;
  criticalWarningCount: number;
  avgWarningResponseMinutes: number;
  totalCarbonGainKg: number;
  pendingApprovals: number;
  suspendedSoils: string[];
  functionalRedundancyRadar: FunctionalRedundancyRadar[];
}

export interface SimulationTask {
  id: string;
  taskNo: string;
  name: string;
  soilDataId: string;
  metagenomicsFileId?: string;
  status: SimulationStatus;
  statusHistory: SimulationStatusHistoryItem[];
  parameters: SimulationParameters;
  currentProgress: number;
  microbes: MicrobeSpecies[];
  carbonPools: CarbonPool[];
  enzymes: ExtracellularEnzyme[];
  network?: MetabolicNetwork;
  timeSeriesData: SimulationTimePoint[];
  warnings: WarningEvent[];
  adjustmentLogs: AdjustmentLog[];
  approvals: ApprovalRecord[];
  reportId?: string;
  farmPushedAt?: string;
  createdAt: string;
  createdBy: string;
  soilId?: string;
}

export interface SoilSuspensionRecord {
  id: string;
  soilId: string;
  simulationIds: string[];
  maxDeviation: number;
  triggeredAt: string;
  resolvedAt?: string;
  resolverId?: string;
  note?: string;
}
