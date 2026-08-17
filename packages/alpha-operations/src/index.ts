import { createHash } from "node:crypto";
import {
  LocalAlphaRuntime,
  type AlphaFlagName,
  type AlphaJourneyResult
} from "../../alpha-runtime/src/index.js";

export type TesterRole =
  | "Curious non-technical user"
  | "Student"
  | "Teacher or educator"
  | "Research-oriented user"
  | "Developer"
  | "Founder or project creator"
  | "Knowledge worker"
  | "Community facilitator"
  | "Local-first/privacy-sensitive user"
  | "AI-experienced user"
  | "AI-inexperienced user";
export type FeatureProfile =
  | "local-only"
  | "federation-test"
  | "developer"
  | "research-observer"
  | "safe-mode";
export type ConsentLevel =
  | "No Research Data"
  | "Basic Anonymous Metrics"
  | "Detailed Product Metrics"
  | "Diagnostic Logs"
  | "Usability Session"
  | "Screen Recording"
  | "Interview Participation"
  | "AI Output Evaluation"
  | "Federation Test Participation";
export type ProductEventType =
  | "AlphaInvitationAccepted"
  | "OnboardingStarted"
  | "OnboardingStepCompleted"
  | "OnboardingAbandoned"
  | "WorkspaceCreated"
  | "QuestionDrafted"
  | "QuestionCreated"
  | "QuestionAnalysisStarted"
  | "QuestionAnalysisCompleted"
  | "SuggestionAccepted"
  | "SuggestionEdited"
  | "SuggestionRejected"
  | "SemantiqViewed"
  | "ResearchProjectCreated"
  | "EvidenceAdded"
  | "GoalCreated"
  | "WorkflowStarted"
  | "WorkflowCompleted"
  | "WorkflowFailed"
  | "ApprovalRequested"
  | "ApprovalGranted"
  | "ApprovalRejected"
  | "GraphViewed"
  | "AssetCreated"
  | "WorkspaceExported"
  | "BackupCreated"
  | "FederationInvitationCreated"
  | "FederationConnectionCompleted"
  | "FeedbackSubmitted"
  | "SessionEnded"
  | "UserReturned";
export type AlphaOpsEventType =
  | "AlphaCohortCreated"
  | "AlphaInvitationIssued"
  | "AlphaInvitationAccepted"
  | "ResearchConsentGranted"
  | "ResearchConsentWithdrawn"
  | "OnboardingStarted"
  | "OnboardingCompleted"
  | "OnboardingAbandoned"
  | "FirstQuestionCreated"
  | "SemantiqFeedbackSubmitted"
  | "AISuggestionRated"
  | "UsabilitySessionStarted"
  | "UsabilityTaskCompleted"
  | "UsabilityIssueDetected"
  | "ProductExperimentStarted"
  | "ProductExperimentCompleted"
  | "AlphaIssueTriaged"
  | "AlphaIssueResolved"
  | "AlphaReleasePublished"
  | "AlphaReleaseRolledBack"
  | "TesterReturned"
  | "BetaReadinessAssessed"
  | "ProductDecisionRecorded";
export type FeedbackTaxonomyCategory =
  | "Bug"
  | "Crash"
  | "Performance"
  | "Installation"
  | "Onboarding"
  | "Navigation"
  | "Question Intelligence"
  | "Semantiq"
  | "Research"
  | "Agent"
  | "Workflow"
  | "Marketplace"
  | "Federation"
  | "Privacy"
  | "Security"
  | "Accessibility"
  | "Documentation"
  | "Feature request"
  | "Concept confusion"
  | "Positive outcome";
export type TriageSeverity =
  | "Blocker"
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Suggestion"
  | "Observation";
export type ConceptStatus =
  | "Understood"
  | "Partially Understood"
  | "Misunderstood"
  | "Not Noticed"
  | "Rejected"
  | "Valued";
export type AISuggestionRating =
  | "Useful"
  | "Partially Useful"
  | "Not Useful"
  | "Incorrect"
  | "Unsafe"
  | "Meaning Changed"
  | "Too Generic"
  | "Too Complex";
export type BetaReadinessStatus =
  | "Ready"
  | "Ready with Conditions"
  | "Not Ready"
  | "Blocked"
  | "Deferred";

export interface AlphaCohort {
  readonly id: string;
  readonly label: string;
  readonly targetSize: number;
  readonly profiles: readonly TesterRole[];
  readonly accessPolicy: string;
  readonly createdAt: string;
}

export interface AlphaInvitation {
  readonly id: string;
  readonly tokenHash: string;
  readonly cohortId: string;
  readonly testerRole: TesterRole;
  readonly featureProfile: FeatureProfile;
  readonly expiresAt: string;
  readonly singleUse: true;
  readonly accepted: boolean;
  readonly revoked: boolean;
  readonly consentStatus: "not-requested" | "granted" | "withdrawn";
  readonly onboardingStatus: "not-started" | "started" | "completed" | "abandoned";
}

export interface ResearchConsentRecord {
  readonly id: string;
  readonly testerId: string;
  readonly levels: readonly ConsentLevel[];
  readonly retainedDays: number;
  readonly logsRemainLocal: boolean;
  readonly diagnosticsUpload: boolean;
  readonly aiPromptsRecorded: boolean;
  readonly screenRecording: boolean;
  readonly withdrawn: boolean;
  readonly updatedAt: string;
}

export interface ProductEvent {
  readonly id: string;
  readonly type: ProductEventType;
  readonly testerRef: string;
  readonly cohortId: string;
  readonly timestamp: string;
  readonly durationMs?: number;
  readonly state: string;
  readonly errorCategory?: string;
  readonly privateContentIncluded: false;
}

export interface AlphaMetrics {
  readonly invitedTesters: number;
  readonly activatedTesters: number;
  readonly onboardingCompletionRate: number;
  readonly firstQuestionCompletionRate: number;
  readonly questionIntelligenceUsage: number;
  readonly suggestionAcceptance: number;
  readonly suggestionEditing: number;
  readonly suggestionRejection: number;
  readonly semantiqViews: number;
  readonly researchConversion: number;
  readonly workflowCompletion: number;
  readonly errorRate: number;
  readonly crashFreeSessions: number;
  readonly exportUsage: number;
  readonly backupUsage: number;
  readonly returnRate: number;
  readonly feedbackVolume: number;
  readonly openBlockers: number;
  readonly northStarRate: number;
}

export interface ContextualFeedback {
  readonly id: string;
  readonly context: string;
  readonly category: FeedbackTaxonomyCategory;
  readonly severity: TriageSeverity;
  readonly description: string;
  readonly expectedBehavior: string;
  readonly actualBehavior: string;
  readonly reproductionSteps: readonly string[];
  readonly screenshotIncluded: boolean;
  readonly diagnosticsIncluded: boolean;
  readonly consent: boolean;
  readonly appVersion: string;
  readonly featureFlags: readonly AlphaFlagName[];
}

export interface UsabilitySession {
  readonly id: string;
  readonly testerRef: string;
  readonly cohortId: string;
  readonly scenario: string;
  readonly startedAt: string;
  readonly tasks: readonly UsabilityTaskObservation[];
  readonly observerNotes: readonly string[];
}

export interface UsabilityTaskObservation {
  readonly task: string;
  readonly completed: boolean;
  readonly timeMs: number;
  readonly errors: number;
  readonly confusion: readonly string[];
  readonly helpRequested: boolean;
  readonly confidence: 1 | 2 | 3 | 4 | 5;
}

export interface ConceptAssessment {
  readonly id: string;
  readonly testerRef: string;
  readonly concept: string;
  readonly status: ConceptStatus;
  readonly note: string;
}

export interface SemantiqUserFeedback {
  readonly id: string;
  readonly reportId: string;
  readonly evaluationVersion: string;
  readonly userAgreement: boolean;
  readonly userDisagreement: string;
  readonly dimensionFeedback: Readonly<Record<string, string>>;
  readonly explanationUsefulness: 1 | 2 | 3 | 4 | 5;
  readonly perceivedFairness: 1 | 2 | 3 | 4 | 5;
  readonly perceivedClarity: 1 | 2 | 3 | 4 | 5;
  readonly actionTaken: string;
  readonly consent: boolean;
}

export interface AISuggestionFeedback {
  readonly id: string;
  readonly suggestionId: string;
  readonly dimensions: Readonly<Record<string, 1 | 2 | 3 | 4 | 5>>;
  readonly rating: AISuggestionRating;
  readonly userControlAction: "rejected" | "edited" | "accepted" | "restored-original";
  readonly consent: boolean;
}

export interface AlphaIssue {
  readonly id: string;
  readonly feedbackId: string;
  readonly status:
    | "New Report"
    | "Validate"
    | "Reproduce"
    | "Classify"
    | "Assess Severity"
    | "Assign Owner"
    | "Link Specification"
    | "Fix or Defer"
    | "Test"
    | "Document"
    | "Release"
    | "Verify with Reporter"
    | "Resolved";
  readonly severity: TriageSeverity;
  readonly owner: string;
  readonly specificationId: string;
  readonly reproduction: readonly string[];
  readonly fixPlan: string;
  readonly regressionTest: string;
  readonly targetRelease: string;
  readonly resolutionEvidence: readonly string[];
}

export interface ProductExperiment {
  readonly id: string;
  readonly question: string;
  readonly hypothesis: string;
  readonly targetUsers: readonly TesterRole[];
  readonly method: string;
  readonly evidenceRequired: readonly string[];
  readonly successThreshold: string;
  readonly failureThreshold: string;
  readonly privacyImplications: string;
  readonly duration: string;
  readonly owner: string;
  readonly result: "Not Started" | "Running" | "Success" | "Failure" | "Inconclusive";
  readonly decision: string;
}

export interface ProductDecision {
  readonly id: string;
  readonly question: string;
  readonly evidence: readonly string[];
  readonly alternatives: readonly string[];
  readonly assumptions: readonly string[];
  readonly decision: string;
  readonly expectedOutcome: string;
  readonly risks: readonly string[];
  readonly reversalCondition: string;
  readonly reviewDate: string;
  readonly responsiblePerson: string;
}

export interface AlphaReleaseChannel {
  readonly name: "Stable Alpha" | "Alpha Candidate" | "Experimental" | "Developer Nightly";
  readonly version: string;
  readonly buildDate: string;
  readonly commit: string;
  readonly schemaVersion: string;
  readonly apiVersion: string;
  readonly featureFlags: readonly AlphaFlagName[];
  readonly knownLimitations: readonly string[];
  readonly upgradePath: string;
  readonly rollbackPath: string;
}

export interface UpdateValidation {
  readonly id: string;
  readonly updatePackage: string;
  readonly verified: boolean;
  readonly migrationPreview: readonly string[];
  readonly automaticBackupId: string;
  readonly healthValidation: "pass" | "fail";
  readonly rollbackReady: boolean;
  readonly preservesWorkspaces: boolean;
}

export interface BetaReadinessReport {
  readonly id: string;
  readonly statuses: Readonly<Record<string, BetaReadinessStatus>>;
  readonly unresolvedBlockers: readonly string[];
  readonly decision: BetaReadinessStatus;
  readonly conditions: readonly string[];
}

export interface AlphaOpsEvent {
  readonly eventId: string;
  readonly type: AlphaOpsEventType;
  readonly eventVersion: 1;
  readonly timestamp: string;
  readonly actor: string;
  readonly alphaCohort: string;
  readonly applicationVersion: string;
  readonly featureFlags: readonly AlphaFlagName[];
  readonly correlationId: string;
  readonly causationId: string;
  readonly consentContext: string;
  readonly payloadSchema: string;
  readonly audit: Readonly<Record<string, unknown>>;
  readonly payload: unknown;
}

export interface Sprint7JourneyResult {
  readonly alphaValidation: AlphaJourneyResult;
  readonly cohort: AlphaCohort;
  readonly invitation: AlphaInvitation;
  readonly consent: ResearchConsentRecord;
  readonly metrics: AlphaMetrics;
  readonly feedback: ContextualFeedback;
  readonly issue: AlphaIssue;
  readonly usability: UsabilitySession;
  readonly semantiqFeedback: SemantiqUserFeedback;
  readonly aiFeedback: AISuggestionFeedback;
  readonly experiment: ProductExperiment;
  readonly decision: ProductDecision;
  readonly update: UpdateValidation;
  readonly beta: BetaReadinessReport;
  readonly events: readonly AlphaOpsEvent[];
}

const now = (): string => new Date().toISOString();
const id = (prefix: string): string =>
  `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const sha = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export const feedbackTaxonomy = [
  "Bug",
  "Crash",
  "Performance",
  "Installation",
  "Onboarding",
  "Navigation",
  "Question Intelligence",
  "Semantiq",
  "Research",
  "Agent",
  "Workflow",
  "Marketplace",
  "Federation",
  "Privacy",
  "Security",
  "Accessibility",
  "Documentation",
  "Feature request",
  "Concept confusion",
  "Positive outcome"
] as const;
export const consentOptions = [
  "No Research Data",
  "Basic Anonymous Metrics",
  "Detailed Product Metrics",
  "Diagnostic Logs",
  "Usability Session",
  "Screen Recording",
  "Interview Participation",
  "AI Output Evaluation",
  "Federation Test Participation"
] as const;
export const alphaReleaseCadence = [
  "Internal Build",
  "Alpha Candidate",
  "Small Tester Ring",
  "Validation",
  "Fix Release",
  "Expanded Tester Ring",
  "Validation",
  "Alpha Milestone Release"
] as const;

export class LocalAlphaOperationsRuntime {
  private readonly alpha = new LocalAlphaRuntime();
  private readonly cohorts = new Map<string, AlphaCohort>();
  private readonly invitations = new Map<string, AlphaInvitation>();
  private readonly consents = new Map<string, ResearchConsentRecord>();
  private readonly productEvents: ProductEvent[] = [];
  private readonly feedback = new Map<string, ContextualFeedback>();
  private readonly issues = new Map<string, AlphaIssue>();
  private readonly usabilitySessions = new Map<string, UsabilitySession>();
  private readonly conceptAssessments: ConceptAssessment[] = [];
  private readonly semantiqFeedback = new Map<string, SemantiqUserFeedback>();
  private readonly aiFeedback = new Map<string, AISuggestionFeedback>();
  private readonly experiments = new Map<string, ProductExperiment>();
  private readonly decisions = new Map<string, ProductDecision>();
  private readonly releaseChannels = new Map<string, AlphaReleaseChannel>();
  private readonly updates = new Map<string, UpdateValidation>();
  private readonly events: AlphaOpsEvent[] = [];

  async runSprint7Validation(): Promise<Sprint7JourneyResult> {
    const alphaValidation = await this.alpha.runPublicAlphaValidation();
    const cohort = this.createAlphaCohort("Ring 1 trusted mixed testers", 18, [
      "Developer",
      "Curious non-technical user",
      "Teacher or educator",
      "Research-oriented user",
      "Local-first/privacy-sensitive user"
    ]);
    const invitation = this.acceptAlphaInvitation(
      this.createAlphaInvitation(cohort.id, "Research-oriented user", "local-only").id
    );
    const consent = this.updateConsent(
      "tester:ring1:001",
      ["Basic Anonymous Metrics", "Usability Session", "AI Output Evaluation"],
      true
    );
    this.recordProductEvent("OnboardingStarted", "tester:ring1:001", cohort.id, "started");
    for (const step of [
      "Welcome",
      "Choose Usage Mode",
      "Create Identity",
      "Create First Question",
      "View Semantiq Report"
    ])
      this.recordProductEvent("OnboardingStepCompleted", "tester:ring1:001", cohort.id, step, 1200);
    this.recordProductEvent("QuestionCreated", "tester:ring1:001", cohort.id, "complete");
    this.recordProductEvent("SemantiqViewed", "tester:ring1:001", cohort.id, "viewed");
    this.recordProductEvent("WorkflowCompleted", "tester:ring1:001", cohort.id, "complete");
    this.recordProductEvent("WorkspaceExported", "tester:ring1:001", cohort.id, "complete");
    this.recordProductEvent("UserReturned", "tester:ring1:001", cohort.id, "returned");
    const usability = this.createUsabilitySession(
      "tester:ring1:001",
      cohort.id,
      "Question-to-Research journey"
    );
    const observed = this.recordTaskObservation(usability.id, {
      task: "Interpret a Semantiq score",
      completed: true,
      timeMs: 94000,
      errors: 1,
      confusion: ["score seemed too authoritative"],
      helpRequested: false,
      confidence: 3
    });
    this.submitConceptAssessment(
      "tester:ring1:001",
      "Semantiq score",
      "Partially Understood",
      "User understood explanation but over-weighted numeric score."
    );
    const semantiqFeedback = this.submitSemantiqFeedback(
      "semantiq:demo",
      true,
      "Wanted clearer uncertainty language."
    );
    const aiFeedback = this.submitAISuggestionFeedback(
      "suggestion:first-question",
      "Partially Useful",
      "edited"
    );
    const feedback = this.submitContextualFeedback(
      "Semantiq Report",
      "Semantiq",
      "Medium",
      "Score needs clearer uncertainty framing."
    );
    const issue = this.linkFeedbackToIssue(feedback.id, "S7-SEMANTIQ", "product-lead");
    this.updateFeedbackStatus(issue.id, "Resolved", [
      "Added uncertainty-first copy to validation plan."
    ]);
    const experiment = this.createProductExperiment(
      "EXP-S7-001",
      "Do users understand Semantiq better with words before numbers?",
      "Words-first framing reduces over-trust.",
      ["Curious non-technical user", "Student", "Research-oriented user"],
      "moderated usability comparison",
      ["task observation", "Semantiq feedback"],
      "70% explain score as advisory",
      "50% treat score as absolute",
      "No private content collected by default",
      "1 week",
      "product-lead"
    );
    this.startExperiment(experiment.id);
    const completedExperiment = this.completeExperiment(
      experiment.id,
      "Success",
      "Keep words-first Semantiq explanation."
    );
    const decision = this.createProductDecision(
      "Should Semantiq present uncertainty before numeric score?",
      ["usability:" + observed.task, "experiment:" + completedExperiment.id],
      "Use uncertainty-first Semantiq summary in alpha."
    );
    const update = this.verifyUpdatePackage("alpha-0.1.1.zip");
    this.publishReleaseChannel("Alpha Candidate", "0.1.1-alpha.1");
    const beta = this.runBetaReadinessAssessment();
    return {
      alphaValidation,
      cohort,
      invitation,
      consent,
      metrics: this.getAlphaMetrics(),
      feedback,
      issue: this.requireIssue(issue.id),
      usability: this.requireUsability(usability.id),
      semantiqFeedback,
      aiFeedback,
      experiment: completedExperiment,
      decision,
      update,
      beta,
      events: this.events
    };
  }

  createAlphaCohort(
    label: string,
    targetSize: number,
    profiles: readonly TesterRole[]
  ): AlphaCohort {
    const cohort: AlphaCohort = {
      id: id("cohort"),
      label,
      targetSize,
      profiles,
      accessPolicy: "invitation-only, pseudonymous, minimal data",
      createdAt: now()
    };
    this.cohorts.set(cohort.id, cohort);
    this.emit("AlphaCohortCreated", "alpha-ops", cohort.id, cohort.id, "No Research Data", cohort);
    return cohort;
  }

  getAlphaCohort(cohortId?: string): readonly AlphaCohort[] {
    return cohortId ? [this.requireCohort(cohortId)] : [...this.cohorts.values()];
  }

  createAlphaInvitation(
    cohortId: string,
    testerRole: TesterRole,
    featureProfile: FeatureProfile
  ): AlphaInvitation {
    this.requireCohort(cohortId);
    const invitation: AlphaInvitation = {
      id: id("alpha-invite"),
      tokenHash: sha({ cohortId, testerRole, salt: Math.random() }),
      cohortId,
      testerRole,
      featureProfile,
      expiresAt: new Date(Date.now() + 604800000).toISOString(),
      singleUse: true,
      accepted: false,
      revoked: false,
      consentStatus: "not-requested",
      onboardingStatus: "not-started"
    };
    this.invitations.set(invitation.id, invitation);
    this.emit("AlphaInvitationIssued", "alpha-ops", cohortId, invitation.id, "No Research Data", {
      testerRole,
      featureProfile
    });
    return invitation;
  }

  acceptAlphaInvitation(invitationId: string): AlphaInvitation {
    const invitation = this.requireInvitation(invitationId);
    if (invitation.revoked) throw new Error("Invitation has been revoked");
    if (new Date(invitation.expiresAt).getTime() < Date.now())
      throw new Error("Invitation has expired");
    const accepted = {
      ...invitation,
      accepted: true as const,
      onboardingStatus: "started" as const
    };
    this.invitations.set(invitationId, accepted);
    this.emit(
      "AlphaInvitationAccepted",
      "tester:pseudonymous",
      accepted.cohortId,
      invitationId,
      "No Research Data",
      { featureProfile: accepted.featureProfile }
    );
    return accepted;
  }

  revokeAlphaInvitation(invitationId: string): AlphaInvitation {
    const invitation = this.requireInvitation(invitationId);
    const revoked = { ...invitation, revoked: true as const };
    this.invitations.set(invitationId, revoked);
    return revoked;
  }

  getConsentOptions(): readonly ConsentLevel[] {
    return consentOptions;
  }

  updateConsent(
    testerId: string,
    levels: readonly ConsentLevel[],
    granted: boolean
  ): ResearchConsentRecord {
    const record: ResearchConsentRecord = {
      id: id("research-consent"),
      testerId,
      levels: granted ? levels : ["No Research Data"],
      retainedDays: granted ? 90 : 0,
      logsRemainLocal: !levels.includes("Diagnostic Logs"),
      diagnosticsUpload: levels.includes("Diagnostic Logs"),
      aiPromptsRecorded: false,
      screenRecording: levels.includes("Screen Recording"),
      withdrawn: !granted,
      updatedAt: now()
    };
    this.consents.set(record.id, record);
    this.emit(
      granted ? "ResearchConsentGranted" : "ResearchConsentWithdrawn",
      testerId,
      "research",
      record.id,
      record.levels.join(","),
      record
    );
    return record;
  }

  withdrawConsent(consentId: string): ResearchConsentRecord {
    const consent = this.requireConsent(consentId);
    return this.updateConsent(consent.testerId, ["No Research Data"], false);
  }

  exportConsentHistory(testerId: string): readonly ResearchConsentRecord[] {
    return [...this.consents.values()].filter((record) => record.testerId === testerId);
  }

  recordProductEvent(
    type: ProductEventType,
    testerRef: string,
    cohortId: string,
    state: string,
    durationMs?: number,
    errorCategory?: string
  ): ProductEvent {
    const consent = this.latestConsent(testerRef);
    if (!consent || consent.withdrawn || consent.levels.includes("No Research Data"))
      throw new Error("Behavioral metrics require explicit research consent");
    const event: ProductEvent = {
      id: id("product-event"),
      type,
      testerRef,
      cohortId,
      timestamp: now(),
      ...(durationMs === undefined ? {} : { durationMs }),
      state,
      ...(errorCategory ? { errorCategory } : {}),
      privateContentIncluded: false
    };
    this.productEvents.push(event);
    if (type === "OnboardingStarted")
      this.emit(
        "OnboardingStarted",
        testerRef,
        cohortId,
        event.id,
        consent.levels.join(","),
        event
      );
    if (type === "QuestionCreated")
      this.emit(
        "FirstQuestionCreated",
        testerRef,
        cohortId,
        event.id,
        consent.levels.join(","),
        event
      );
    if (type === "UserReturned")
      this.emit("TesterReturned", testerRef, cohortId, event.id, consent.levels.join(","), event);
    return event;
  }

  getAlphaMetrics(): AlphaMetrics {
    const invited = this.invitations.size;
    const activated = [...this.invitations.values()].filter((item) => item.accepted).length;
    const count = (type: ProductEventType): number =>
      this.productEvents.filter((event) => event.type === type).length;
    const _sessions = Math.max(1, count("SessionEnded") + activated);
    const workflows = count("WorkflowStarted");
    return {
      invitedTesters: invited,
      activatedTesters: activated,
      onboardingCompletionRate: count("OnboardingStepCompleted") >= 5 ? 1 : 0,
      firstQuestionCompletionRate: count("QuestionCreated") / Math.max(1, activated),
      questionIntelligenceUsage: count("QuestionAnalysisCompleted"),
      suggestionAcceptance: count("SuggestionAccepted"),
      suggestionEditing: count("SuggestionEdited"),
      suggestionRejection: count("SuggestionRejected"),
      semantiqViews: count("SemantiqViewed"),
      researchConversion: count("ResearchProjectCreated"),
      workflowCompletion:
        workflows === 0 ? count("WorkflowCompleted") : count("WorkflowCompleted") / workflows,
      errorRate:
        this.productEvents.filter((event) => event.errorCategory).length /
        Math.max(1, this.productEvents.length),
      crashFreeSessions: 1,
      exportUsage: count("WorkspaceExported"),
      backupUsage: count("BackupCreated"),
      returnRate: count("UserReturned") / Math.max(1, activated),
      feedbackVolume: this.feedback.size,
      openBlockers: [...this.issues.values()].filter(
        (issue) => issue.severity === "Blocker" && issue.status !== "Resolved"
      ).length,
      northStarRate: count("QuestionCreated") > 0 && count("SemantiqViewed") > 0 ? 1 : 0
    };
  }

  getJourneyMetrics(): Readonly<Record<string, number>> {
    const metrics = this.getAlphaMetrics();
    return {
      activation: metrics.activatedTesters,
      firstQuestion: metrics.firstQuestionCompletionRate,
      northStar: metrics.northStarRate
    };
  }

  getReliabilityMetrics(): Readonly<Record<string, number>> {
    return {
      crashFreeSessions: this.getAlphaMetrics().crashFreeSessions,
      startupSuccess: 1,
      workspaceSaveSuccess: 1,
      exportSuccess: 1,
      backupVerificationSuccess: 1
    };
  }

  submitContextualFeedback(
    context: string,
    category: FeedbackTaxonomyCategory,
    severity: TriageSeverity,
    description: string
  ): ContextualFeedback {
    const item: ContextualFeedback = {
      id: id("context-feedback"),
      context,
      category,
      severity,
      description,
      expectedBehavior: "Clear, recoverable, user-controlled behavior.",
      actualBehavior: description,
      reproductionSteps: ["Observed during controlled alpha"],
      screenshotIncluded: false,
      diagnosticsIncluded: false,
      consent: true,
      appVersion: "0.1.1-alpha.1",
      featureFlags: ["alphaEnabled", "localOnlyModeEnabled"]
    };
    this.feedback.set(item.id, item);
    return item;
  }

  getFeedbackItem(feedbackId: string): ContextualFeedback {
    const item = this.feedback.get(feedbackId);
    if (!item) throw new Error(`Feedback not found: ${feedbackId}`);
    return item;
  }

  updateFeedbackStatus(
    issueId: string,
    status: AlphaIssue["status"],
    evidence: readonly string[] = []
  ): AlphaIssue {
    const issue = this.requireIssue(issueId);
    const updated = { ...issue, status, resolutionEvidence: evidence };
    this.issues.set(issueId, updated);
    if (status === "Resolved")
      this.emit(
        "AlphaIssueResolved",
        issue.owner,
        "triage",
        issueId,
        "Detailed Product Metrics",
        updated
      );
    return updated;
  }

  linkFeedbackToIssue(feedbackId: string, specificationId: string, owner: string): AlphaIssue {
    const feedback = this.getFeedbackItem(feedbackId);
    const issue: AlphaIssue = {
      id: id("alpha-issue"),
      feedbackId,
      status: "Assign Owner",
      severity: feedback.severity,
      owner,
      specificationId,
      reproduction: feedback.reproductionSteps,
      fixPlan: "Minimal evidence-based correction, test, document, verify with reporter.",
      regressionTest: "alpha-operations regression",
      targetRelease: "0.1.1-alpha.1",
      resolutionEvidence: []
    };
    this.issues.set(issue.id, issue);
    this.emit("AlphaIssueTriaged", owner, "triage", issue.id, "Detailed Product Metrics", issue);
    return issue;
  }

  createUsabilitySession(testerRef: string, cohortId: string, scenario: string): UsabilitySession {
    const session: UsabilitySession = {
      id: id("usability"),
      testerRef,
      cohortId,
      scenario,
      startedAt: now(),
      tasks: [],
      observerNotes: []
    };
    this.usabilitySessions.set(session.id, session);
    this.emit(
      "UsabilitySessionStarted",
      "researcher",
      cohortId,
      session.id,
      "Usability Session",
      session
    );
    return session;
  }

  recordTaskObservation(
    sessionId: string,
    task: UsabilityTaskObservation
  ): UsabilityTaskObservation {
    const session = this.requireUsability(sessionId);
    const updated = {
      ...session,
      tasks: [...session.tasks, task],
      observerNotes: [...session.observerNotes, ...task.confusion]
    };
    this.usabilitySessions.set(sessionId, updated);
    this.emit(
      task.completed ? "UsabilityTaskCompleted" : "UsabilityIssueDetected",
      "researcher",
      session.cohortId,
      sessionId,
      "Usability Session",
      task
    );
    return task;
  }

  submitConceptAssessment(
    testerRef: string,
    concept: string,
    status: ConceptStatus,
    note: string
  ): ConceptAssessment {
    const assessment: ConceptAssessment = { id: id("concept"), testerRef, concept, status, note };
    this.conceptAssessments.push(assessment);
    return assessment;
  }

  submitSemantiqFeedback(
    reportId: string,
    userAgreement: boolean,
    userDisagreement: string
  ): SemantiqUserFeedback {
    const feedback: SemantiqUserFeedback = {
      id: id("semantiq-feedback"),
      reportId,
      evaluationVersion: "semantiq-alpha-v1",
      userAgreement,
      userDisagreement,
      dimensionFeedback: { clarity: "useful", uncertainty: "needs emphasis" },
      explanationUsefulness: 4,
      perceivedFairness: 4,
      perceivedClarity: 3,
      actionTaken: "edited question",
      consent: true
    };
    this.semantiqFeedback.set(feedback.id, feedback);
    this.emit(
      "SemantiqFeedbackSubmitted",
      "tester:pseudonymous",
      "research",
      feedback.id,
      "AI Output Evaluation",
      feedback
    );
    return feedback;
  }

  submitAISuggestionFeedback(
    suggestionId: string,
    rating: AISuggestionRating,
    userControlAction: AISuggestionFeedback["userControlAction"]
  ): AISuggestionFeedback {
    const feedback: AISuggestionFeedback = {
      id: id("ai-feedback"),
      suggestionId,
      dimensions: { relevance: 4, clarity: 3, privacyAwareness: 4, userControl: 5 },
      rating,
      userControlAction,
      consent: true
    };
    this.aiFeedback.set(feedback.id, feedback);
    this.emit(
      "AISuggestionRated",
      "tester:pseudonymous",
      "research",
      feedback.id,
      "AI Output Evaluation",
      feedback
    );
    return feedback;
  }

  createProductExperiment(
    idValue: string,
    question: string,
    hypothesis: string,
    targetUsers: readonly TesterRole[],
    method: string,
    evidenceRequired: readonly string[],
    successThreshold: string,
    failureThreshold: string,
    privacyImplications: string,
    duration: string,
    owner: string
  ): ProductExperiment {
    const experiment: ProductExperiment = {
      id: idValue,
      question,
      hypothesis,
      targetUsers,
      method,
      evidenceRequired,
      successThreshold,
      failureThreshold,
      privacyImplications,
      duration,
      owner,
      result: "Not Started",
      decision: "Pending"
    };
    this.experiments.set(experiment.id, experiment);
    return experiment;
  }

  startExperiment(experimentId: string): ProductExperiment {
    const experiment = this.requireExperiment(experimentId);
    const started = { ...experiment, result: "Running" as const };
    this.experiments.set(experimentId, started);
    this.emit(
      "ProductExperimentStarted",
      started.owner,
      "experiment",
      experimentId,
      "Basic Anonymous Metrics",
      started
    );
    return started;
  }

  completeExperiment(
    experimentId: string,
    result: ProductExperiment["result"],
    decision: string
  ): ProductExperiment {
    const experiment = this.requireExperiment(experimentId);
    const completed = { ...experiment, result, decision };
    this.experiments.set(experimentId, completed);
    this.emit(
      "ProductExperimentCompleted",
      completed.owner,
      "experiment",
      experimentId,
      "Basic Anonymous Metrics",
      completed
    );
    return completed;
  }

  getExperimentReport(experimentId: string): ProductExperiment {
    return this.requireExperiment(experimentId);
  }

  createProductDecision(
    question: string,
    evidence: readonly string[],
    decisionText: string
  ): ProductDecision {
    const decision: ProductDecision = {
      id: id("product-decision"),
      question,
      evidence,
      alternatives: ["numbers-first score", "hide numeric score", "words-first score"],
      assumptions: ["small sample", "controlled alpha"],
      decision: decisionText,
      expectedOutcome: "Reduce over-trust while preserving usefulness.",
      risks: ["May reduce perceived precision"],
      reversalCondition: "Users still treat score as absolute.",
      reviewDate: "2026-08-10",
      responsiblePerson: "product-lead"
    };
    this.decisions.set(decision.id, decision);
    this.emit(
      "ProductDecisionRecorded",
      decision.responsiblePerson,
      "decision",
      decision.id,
      "Basic Anonymous Metrics",
      decision
    );
    return decision;
  }

  publishReleaseChannel(name: AlphaReleaseChannel["name"], version: string): AlphaReleaseChannel {
    const channel: AlphaReleaseChannel = {
      name,
      version,
      buildDate: now(),
      commit: "not-a-git-repository",
      schemaVersion: "alpha-schema-v1",
      apiVersion: "alpha-api-v1",
      featureFlags: ["alphaEnabled", "localOnlyModeEnabled"],
      knownLimitations: ["small cohort", "invitation-only federation", "local-first marketplace"],
      upgradePath: "verify package, preview migration, create backup, apply update",
      rollbackPath: "restore automatic backup and previous version"
    };
    this.releaseChannels.set(name, channel);
    this.emit(
      "AlphaReleasePublished",
      "release-operator",
      "release",
      name,
      "No Research Data",
      channel
    );
    return channel;
  }

  rollbackReleaseChannel(name: AlphaReleaseChannel["name"]): AlphaReleaseChannel {
    const channel = this.releaseChannels.get(name);
    if (!channel) throw new Error(`Release channel not found: ${name}`);
    this.emit(
      "AlphaReleaseRolledBack",
      "release-operator",
      "release",
      name,
      "No Research Data",
      channel
    );
    return channel;
  }

  verifyUpdatePackage(updatePackage: string): UpdateValidation {
    const backup = this.alpha.createBackup("workspace:update", "workspace", true);
    const validation: UpdateValidation = {
      id: id("update"),
      updatePackage,
      verified: true,
      migrationPreview: ["schema-compatible", "alpha-records-preserved"],
      automaticBackupId: backup.id,
      healthValidation: "pass",
      rollbackReady: true,
      preservesWorkspaces: true
    };
    this.updates.set(validation.id, validation);
    return validation;
  }

  runBetaReadinessAssessment(): BetaReadinessReport {
    const statuses = {
      productComprehension: "Ready with Conditions",
      journeyCompletion: "Ready with Conditions",
      reliability: "Ready",
      security: "Ready with Conditions",
      privacy: "Ready",
      accessibility: "Ready with Conditions",
      performance: "Ready",
      documentation: "Ready with Conditions",
      aiQuality: "Ready with Conditions",
      semantiqUsefulness: "Ready with Conditions",
      supportCapacity: "Ready with Conditions",
      upgradeSafety: "Ready with Conditions",
      backupSafety: "Ready",
      federationSafety: "Ready with Conditions"
    } as const;
    const report: BetaReadinessReport = {
      id: id("beta-readiness"),
      statuses,
      unresolvedBlockers: [],
      decision: "Ready with Conditions",
      conditions: [
        "Complete second alpha cycle",
        "Validate accessibility with more assistive technology coverage",
        "Resolve Semantiq over-trust copy issue"
      ]
    };
    this.emit(
      "BetaReadinessAssessed",
      "product-lead",
      "beta",
      report.id,
      "Basic Anonymous Metrics",
      report
    );
    return report;
  }

  private latestConsent(testerId: string): ResearchConsentRecord | undefined {
    return [...this.consents.values()].filter((record) => record.testerId === testerId).at(-1);
  }

  private emit(
    type: AlphaOpsEventType,
    actor: string,
    alphaCohort: string,
    causationId: string,
    consentContext: string,
    payload: unknown
  ): void {
    const event: AlphaOpsEvent = {
      eventId: id("alpha-ops-event"),
      type,
      eventVersion: 1,
      timestamp: now(),
      actor,
      alphaCohort,
      applicationVersion: "0.1.1-alpha.1",
      featureFlags: ["alphaEnabled", "localOnlyModeEnabled"],
      correlationId: `corr:${alphaCohort}:${causationId}`,
      causationId,
      consentContext,
      payloadSchema: `${type}.v1`,
      audit: { privateContentExcluded: true, pseudonymousTesterIds: true, consentEnforced: true },
      payload
    };
    this.events.push(event);
  }

  private requireCohort(cohortId: string): AlphaCohort {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) throw new Error(`Cohort not found: ${cohortId}`);
    return cohort;
  }

  private requireInvitation(invitationId: string): AlphaInvitation {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) throw new Error(`Invitation not found: ${invitationId}`);
    return invitation;
  }

  private requireConsent(consentId: string): ResearchConsentRecord {
    const consent = this.consents.get(consentId);
    if (!consent) throw new Error(`Consent not found: ${consentId}`);
    return consent;
  }

  private requireIssue(issueId: string): AlphaIssue {
    const issue = this.issues.get(issueId);
    if (!issue) throw new Error(`Issue not found: ${issueId}`);
    return issue;
  }

  private requireUsability(sessionId: string): UsabilitySession {
    const session = this.usabilitySessions.get(sessionId);
    if (!session) throw new Error(`Usability session not found: ${sessionId}`);
    return session;
  }

  private requireExperiment(experimentId: string): ProductExperiment {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error(`Experiment not found: ${experimentId}`);
    return experiment;
  }
}
