# Aggregates

Aggregates enforce consistency boundaries. Repositories load and save aggregate roots only.

## Question Engine

- Aggregate root: Question.
- Entities: Answer, Observation, Discussion, Question Version, Benchmark Reference.
- Value objects: Question Text, Question Metadata, Question State, Confidence, Provenance.
- Domain services: Question Linking Service, Question Quality Service.
- Factories: Question Factory, Answer Factory.
- Repositories: Question Repository.
- Policies: Question Edit Policy, Question Link Policy.
- Specifications: IsOpenQuestion, CanAcceptAnswer, CanLinkQuestion.
- Events: QuestionCreated, QuestionUpdated, QuestionLinked, AnswerProposed, ObservationAdded.

## Knowledge Graph

- Aggregate root: Knowledge Object.
- Entities: Relationship, Tag, Semantic Annotation.
- Value objects: Relationship Type, Semantic Weight, Directionality, Provenance.
- Domain services: Relationship Resolver, Graph Consistency Service.
- Factories: Relationship Factory.
- Repositories: Knowledge Object Repository, Relationship Repository.
- Policies: Relationship Permission Policy.
- Specifications: CanCreateRelationship, RelationshipIsNonCircular.
- Events: KnowledgeObjectCreated, RelationshipCreated, RelationshipReclassified, KnowledgeValidated.

## Semantiq Benchmark

- Aggregate root: Benchmark.
- Entities: Benchmark Case, Benchmark Run, Evaluation Result.
- Value objects: Score, Dimension, Rubric, Explanation.
- Domain services: Benchmark Runner, Scoring Policy.
- Factories: Benchmark Case Factory.
- Repositories: Benchmark Repository.
- Policies: Benchmark Visibility Policy.
- Specifications: BenchmarkIsRunnable, ResultIsComparable.
- Events: BenchmarkCreated, BenchmarkCompleted, BenchmarkResultExplained.

## Agent OS

- Aggregate root: Agent.
- Entities: Workflow, Tool Session, Agent Assignment.
- Value objects: Capability, Approval Requirement, Agent Memory Reference.
- Domain services: Planner, Tool Broker, Approval Service.
- Factories: Agent Factory, Workflow Factory.
- Repositories: Agent Repository, Workflow Repository.
- Policies: Agent Permission Policy, Human Approval Policy.
- Specifications: AgentCanUseTool, WorkflowCanExecute.
- Events: AgentAssigned, WorkflowExecuted, ToolInvoked, HumanApprovalRequested.

## Workspace

- Aggregate root: Workspace.
- Entities: Panel, Resource Mount, Workspace Session.
- Value objects: Workspace Mode, Local Path, Sync State.
- Domain services: Workspace Resolver, Mount Service.
- Factories: Workspace Factory.
- Repositories: Workspace Repository.
- Policies: Workspace Access Policy.
- Specifications: WorkspaceCanOpen, ResourceCanMount.
- Events: WorkspaceCreated, WorkspaceOpened, WorkspaceResourceMounted.

## Project System

- Aggregate root: Project.
- Entities: Task, Milestone, Project Member, Deliverable.
- Value objects: Project State, Priority, Due Window.
- Domain services: Project Planning Service.
- Factories: Project Factory.
- Repositories: Project Repository.
- Policies: Project Membership Policy.
- Specifications: ProjectCanStart, ProjectCanComplete.
- Events: ProjectStarted, ProjectUpdated, ProjectCompleted.

## Scientific Atlas

- Aggregate root: Research Thread.
- Entities: Evidence, Hypothesis, Experiment, Research Paper.
- Value objects: Citation, Evidence Strength, Method, Result.
- Domain services: Evidence Evaluation Service, Hypothesis Service.
- Factories: Hypothesis Factory, Experiment Factory.
- Repositories: Research Thread Repository.
- Policies: Evidence Submission Policy.
- Specifications: EvidenceIsCitable, HypothesisIsTestable.
- Events: EvidenceAdded, HypothesisProposed, ExperimentStarted, ResearchPublished.

## Narrative And Game

- Aggregate roots: Narrative, Game.
- Entities: Scene, Character, Plot Arc, Rule Set, Simulation, Play Session.
- Value objects: Narrative Structure, Game Mechanic, Learning Goal.
- Domain services: Narrative Generator, Game Design Service.
- Factories: Narrative Factory, Game Factory.
- Repositories: Narrative Repository, Game Repository.
- Policies: Generation Attribution Policy.
- Specifications: NarrativeCanGenerate, GameCanPublish.
- Events: NarrativeGenerated, GameCreated, GameSessionCompleted.

## Identity And Wallet

- Aggregate roots: Semantic Identity, Wallet Asset.
- Entities: Role, Permission Grant, Credential, Ownership Claim.
- Value objects: Capability, Identity Handle, Asset Type, Claim Proof.
- Domain services: Permission Service, Ownership Service.
- Factories: Identity Factory, Asset Factory.
- Repositories: Identity Repository, Wallet Asset Repository.
- Policies: Ownership Transfer Policy.
- Specifications: IdentityCanClaimAsset, PermissionAllowsAction.
- Events: IdentityCreated, PermissionGranted, WalletAssetCreated, OwnershipTransferred.

## Supporting Contexts

Marketplace owns Listing. Education owns Learning Path. Repositories own Repository. Search owns Search Index. Notifications own Notification. Analytics owns Metric. Settings owns Setting. Administration owns Community and Policy.
