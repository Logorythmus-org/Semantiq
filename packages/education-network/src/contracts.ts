export type LearningPathMode =
  | "self-learning"
  | "school"
  | "university"
  | "professional"
  | "research"
  | "leadership"
  | "innovation"
  | "community"
  | "mentorship"
  | "career-transition";

export type CompetencyKind =
  | "curiosity"
  | "critical-thinking"
  | "scientific-thinking"
  | "systems-thinking"
  | "creativity"
  | "communication"
  | "collaboration"
  | "engineering"
  | "research"
  | "teaching"
  | "leadership"
  | "ethics"
  | "reflection";

export type CredentialType =
  | "micro-credential"
  | "competency-badge"
  | "research-certificate"
  | "teaching-certificate"
  | "community-recognition"
  | "innovation-award"
  | "professional-portfolio"
  | "digital-credential";

export interface LearningObject {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly questionIds: readonly string[];
  readonly graphLinkIds: readonly string[];
  readonly difficulty: number;
  readonly prerequisiteIds: readonly string[];
  readonly learningOutcomes: readonly string[];
  readonly competencyIds: readonly string[];
  readonly activityIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly assessmentIds: readonly string[];
  readonly reflectionIds: readonly string[];
  readonly narrativeIds: readonly string[];
  readonly gameIds: readonly string[];
  readonly resourceIds: readonly string[];
  readonly aiAssistanceIds: readonly string[];
  readonly versionHistoryIds: readonly string[];
}

export interface LearningPath {
  readonly id: string;
  readonly learnerId: string;
  readonly mode: LearningPathMode;
  readonly questionIds: readonly string[];
  readonly goalIds: readonly string[];
  readonly objectIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly reflectionIds: readonly string[];
  readonly assessmentIds: readonly string[];
  readonly mentorIds: readonly string[];
  readonly adaptive: true;
}

export interface CompetencyNode {
  readonly id: string;
  readonly kind: CompetencyKind;
  readonly learnerId: string;
  readonly evidenceIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly researchIds: readonly string[];
  readonly teachingIds: readonly string[];
  readonly mentorshipIds: readonly string[];
  readonly achievementIds: readonly string[];
  readonly semantiqScoreIds: readonly string[];
  readonly level: number;
}

export interface MentorshipAssignment {
  readonly id: string;
  readonly learnerId: string;
  readonly mentorId: string;
  readonly type: "peer" | "expert" | "community" | "ai" | "organization" | "university" | "cross-disciplinary";
  readonly competencyIds: readonly string[];
  readonly goalIds: readonly string[];
  readonly sessionIds: readonly string[];
  readonly reflectionIds: readonly string[];
  readonly outcomeIds: readonly string[];
  readonly measurable: true;
}

export interface TeachingArtifact {
  readonly id: string;
  readonly teacherId: string;
  readonly type: "course" | "micro-lesson" | "live-workshop" | "narrative-learning" | "interactive-game" | "research-seminar" | "project-coaching" | "community-learning";
  readonly questionIds: readonly string[];
  readonly demonstratedKnowledgeIds: readonly string[];
  readonly learningObjectIds: readonly string[];
  readonly published: boolean;
}

export interface PortfolioAssessment {
  readonly id: string;
  readonly learnerId: string;
  readonly reasoningIds: readonly string[];
  readonly researchIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly teachingIds: readonly string[];
  readonly collaborationIds: readonly string[];
  readonly innovationIds: readonly string[];
  readonly reflectionIds: readonly string[];
  readonly semantiqScoreIds: readonly string[];
  readonly mastery: boolean;
}

export interface VerifiableCredential {
  readonly id: string;
  readonly type: CredentialType;
  readonly subjectId: string;
  readonly issuerId: string;
  readonly competencyIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly walletRecordId: string;
  readonly signatureId: string;
  readonly issuedAt: string;
  readonly expiresAt?: string;
  readonly revoked: boolean;
}

export interface LearningAnalyticsSnapshot {
  readonly id: string;
  readonly learnerId: string;
  readonly knowledgeGrowth: number;
  readonly competencyGrowth: number;
  readonly researchParticipation: number;
  readonly teaching: number;
  readonly reflection: number;
  readonly projects: number;
  readonly innovation: number;
  readonly collaboration: number;
  readonly communityLearning: number;
  readonly longTermProgress: number;
  readonly privacyPreserving: true;
}

export interface EducationAgentRole {
  readonly role:
    | "tutor-agent"
    | "mentor-agent"
    | "curriculum-designer"
    | "learning-path-agent"
    | "assessment-agent"
    | "reflection-coach"
    | "research-coach"
    | "project-coach"
    | "accessibility-agent"
    | "language-coach";
  readonly capabilities: readonly string[];
  readonly explanationRequired: true;
  readonly humanAgencyPreserved: true;
}

export interface GlobalClassroom {
  readonly id: string;
  readonly participantIds: readonly string[];
  readonly institutionIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly questionIds: readonly string[];
  readonly multilingual: boolean;
  readonly offlineReady: boolean;
  readonly lowBandwidthReady: boolean;
  readonly accessibilityFeatureIds: readonly string[];
}

export interface EducationNetworkRepository {
  saveLearningObject(object: LearningObject): Promise<void>;
  saveLearningPath(path: LearningPath): Promise<void>;
  getLearningPath(pathId: string): Promise<LearningPath | undefined>;
  saveCompetency(node: CompetencyNode): Promise<void>;
  saveMentorship(assignment: MentorshipAssignment): Promise<void>;
  saveTeaching(artifact: TeachingArtifact): Promise<void>;
  saveAssessment(assessment: PortfolioAssessment): Promise<void>;
  saveCredential(credential: VerifiableCredential): Promise<void>;
  getCredential(credentialId: string): Promise<VerifiableCredential | undefined>;
  saveAnalytics(snapshot: LearningAnalyticsSnapshot): Promise<void>;
  publishEvent(event: EducationNetworkEvent): Promise<void>;
}

export interface EducationNetworkService {
  createLearningPath(path: LearningPath): Promise<void>;
  recommendLearning(learnerId: string): Promise<readonly string[]>;
  trackCompetency(node: CompetencyNode): Promise<void>;
  assignMentor(assignment: MentorshipAssignment): Promise<void>;
  createCourse(artifact: TeachingArtifact): Promise<void>;
  publishLesson(artifactId: string): Promise<void>;
  assessPortfolio(assessment: PortfolioAssessment): Promise<void>;
  issueCredential(credential: VerifiableCredential): Promise<void>;
  verifyCredential(credentialId: string): Promise<boolean>;
  generateLearningAnalytics(learnerId: string): Promise<LearningAnalyticsSnapshot>;
}

export interface EducationNetworkEvent {
  readonly type:
    | "LearningStarted"
    | "CompetencyImproved"
    | "ProjectCompleted"
    | "MentorAssigned"
    | "TeachingPublished"
    | "CredentialIssued"
    | "ReflectionCompleted"
    | "LearningPathUpdated"
    | "AssessmentCompleted"
    | "MasteryAchieved";
  readonly version: number;
  readonly occurredAt: string;
  readonly learnerId?: string;
  readonly credentialId?: string;
  readonly payload: unknown;
}
