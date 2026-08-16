export type * from "./contracts.js";

import type {
  ConsensusState,
  DeliberationThread,
  GovernanceAlternative,
  GovernanceEngineEvent,
  GovernanceEngineRepository,
  GovernanceEngineService,
  GovernanceProcess,
  ImpactSimulation,
  ParticipationRecord,
  PolicyObject,
  TransparencyRecord
} from "./contracts.js";

export class LocalGovernanceEngineRepository implements GovernanceEngineRepository {
  private readonly processes = new Map<string, GovernanceProcess>();
  private readonly policies = new Map<string, PolicyObject>();
  private readonly deliberations = new Map<string, DeliberationThread>();
  private readonly alternatives: GovernanceAlternative[] = [];
  private readonly simulations = new Map<string, ImpactSimulation>();
  private readonly consensus = new Map<string, ConsensusState>();
  private readonly participation = new Map<string, ParticipationRecord>();
  private readonly transparency = new Map<string, TransparencyRecord>();
  private readonly events: GovernanceEngineEvent[] = [];

  async saveProcess(process: GovernanceProcess): Promise<void> {
    this.processes.set(process.id, process);
  }

  async getProcess(processId: string): Promise<GovernanceProcess | undefined> {
    return this.processes.get(processId);
  }

  async savePolicy(policy: PolicyObject): Promise<void> {
    this.policies.set(policy.id, policy);
  }

  async saveDeliberation(thread: DeliberationThread): Promise<void> {
    this.deliberations.set(thread.id, thread);
  }

  async saveAlternative(alternative: GovernanceAlternative): Promise<void> {
    this.alternatives.push(Object.freeze(alternative));
  }

  async saveSimulation(simulation: ImpactSimulation): Promise<void> {
    this.simulations.set(simulation.id, simulation);
  }

  async saveConsensus(consensus: ConsensusState): Promise<void> {
    this.consensus.set(consensus.id, consensus);
  }

  async saveParticipation(record: ParticipationRecord): Promise<void> {
    this.participation.set(record.id, record);
  }

  async saveTransparency(record: TransparencyRecord): Promise<void> {
    this.transparency.set(record.id, record);
  }

  async publishEvent(event: GovernanceEngineEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }
}

export class LocalGovernanceEngineService implements GovernanceEngineService {
  constructor(
    private readonly repository: LocalGovernanceEngineRepository = new LocalGovernanceEngineRepository()
  ) {}

  async createGovernanceProcess(process: GovernanceProcess): Promise<void> {
    if (!process.questionId) {
      throw new Error("Governance must begin with a question");
    }
    await this.repository.saveProcess(process);
    await this.emit(
      "GovernanceStarted",
      { type: process.type, purpose: process.purpose },
      process.id
    );
  }

  async createPolicy(policy: PolicyObject): Promise<void> {
    if (policy.evidenceIds.length === 0) {
      throw new Error("Policies require evidence");
    }
    await this.repository.savePolicy(policy);
    await this.emit("PolicyUpdated", { status: policy.implementationStatus }, undefined, policy.id);
  }

  async collectEvidence(processId: string, evidenceIds: readonly string[]): Promise<void> {
    await this.requireProcess(processId);
    if (evidenceIds.length === 0) {
      throw new Error("Evidence collection requires evidence ids");
    }
    await this.emit("EvidenceCollected", { evidenceIds }, processId);
  }

  async generateAlternatives(processId: string): Promise<readonly GovernanceAlternative[]> {
    await this.requireProcess(processId);
    const alternative: GovernanceAlternative = {
      id: `${processId}:alternative:${Date.now()}`,
      processId,
      title: "Evidence-preserving alternative",
      description: "Generated placeholder alternative for structured comparison.",
      evidenceIds: [],
      riskIds: [],
      tradeoffIds: [],
      simulationIds: []
    };
    await this.repository.saveAlternative(alternative);
    await this.emit("AlternativeGenerated", { alternativeId: alternative.id }, processId);
    return [alternative];
  }

  async simulateImpact(simulation: ImpactSimulation): Promise<void> {
    await this.requireProcess(simulation.processId);
    if (!simulation.reproducible) {
      throw new Error("Impact simulations must be reproducible");
    }
    await this.repository.saveSimulation(simulation);
    await this.emit("SimulationCompleted", { simulationId: simulation.id }, simulation.processId);
  }

  async facilitateDialogue(thread: DeliberationThread): Promise<void> {
    await this.requireProcess(thread.processId);
    await this.repository.saveDeliberation(thread);
    await this.emit("DialogueOpened", { threadId: thread.id }, thread.processId);
  }

  async measureConsensus(consensus: ConsensusState): Promise<void> {
    await this.requireProcess(consensus.processId);
    await this.repository.saveConsensus(consensus);
    await this.emit(
      "ConsensusUpdated",
      { level: consensus.level, uncertaintyLevel: consensus.uncertaintyLevel },
      consensus.processId
    );
  }

  async publishDecision(processId: string, transparency: TransparencyRecord): Promise<void> {
    await this.requireProcess(processId);
    if (transparency.evidenceIds.length === 0 || transparency.decisionRationale.length === 0) {
      throw new Error("Published decisions require evidence and rationale");
    }
    await this.repository.saveTransparency(transparency);
    await this.emit("DecisionPublished", { transparencyId: transparency.id }, processId);
  }

  async reviewDecision(processId: string): Promise<void> {
    await this.requireProcess(processId);
    await this.emit("GovernanceReviewed", { futureQuestions: true }, processId);
  }

  async measureImpact(processId: string): Promise<readonly string[]> {
    const process = await this.requireProcess(processId);
    await this.emit("ImpactMeasured", { impactReportIds: process.impactReportIds }, processId);
    return process.impactReportIds;
  }

  private async requireProcess(processId: string): Promise<GovernanceProcess> {
    const process = await this.repository.getProcess(processId);
    if (!process) {
      throw new Error(`Governance process not found: ${processId}`);
    }
    return process;
  }

  private async emit(
    type: GovernanceEngineEvent["type"],
    payload: unknown,
    processId?: string,
    policyId?: string
  ): Promise<void> {
    const event: GovernanceEngineEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withProcess = processId ? { ...event, processId } : event;
    const withPolicy = policyId ? { ...withProcess, policyId } : withProcess;
    await this.repository.publishEvent(withPolicy);
  }
}
