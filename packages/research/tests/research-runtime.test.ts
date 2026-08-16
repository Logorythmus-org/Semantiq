import { describe, expect, it } from "vitest";
import {
  createResearchProject,
  LocalResearchRuntime,
  type CollaborationRecord,
  type DatasetObject,
  type EvidenceObject,
  type ExperimentObject,
  type HypothesisObject,
  type PeerReviewObject,
  type PublicationObject,
  type ResearchCommunityRuntime,
  type ResearchTask
} from "../src/index.js";

describe("research and community runtime", () => {
  it("turns a question into connected research, evidence, experiment, publication, and review objects", async () => {
    const runtime = new LocalResearchRuntime();
    const project = createResearchProject(
      "research:1",
      "question:1",
      "Evidence in learning",
      ["Measure evidence effects"],
      "education research"
    );
    const evidence: EvidenceObject = {
      id: "evidence:1",
      projectId: project.id,
      type: "observation",
      source: "Classroom observation",
      confidence: 0.8,
      quality: 0.75,
      classification: "primary",
      provenance: "researcher:1",
      metadata: { method: "field-note" },
      historyIds: []
    };
    const hypothesis: HypothesisObject = {
      id: "hypothesis:1",
      projectId: project.id,
      statement: "Evidence feedback improves learning retention.",
      assumptions: ["Learners receive clear feedback."],
      predictions: ["Retention scores improve."],
      expectedResults: ["Higher follow-up score"],
      supportingEvidenceIds: [evidence.id],
      contradictionIds: [],
      confidence: 0.65,
      validationStatus: "untested",
      historyIds: []
    };
    const experiment: ExperimentObject = {
      id: "experiment:1",
      projectId: project.id,
      type: "educational",
      protocol: "Compare learning outcomes with and without evidence feedback.",
      variables: ["feedback", "retention"],
      environment: "classroom",
      resources: ["rubric"],
      participantIds: ["participant:1"],
      status: "completed",
      resultIds: ["result:1"],
      observationIds: [evidence.id],
      failureNotes: [],
      replicationIds: [],
      benchmarkIds: []
    };
    const publication: PublicationObject = {
      id: "publication:1",
      projectId: project.id,
      title: "Evidence Feedback in Learning",
      status: "published",
      citationIds: [],
      doiPlaceholder: "doi:placeholder:evidence-learning",
      version: "1.0.0",
      authorIds: ["researcher:1"],
      contributorIds: ["participant:1"],
      evidenceIds: [evidence.id],
      researchIds: [project.id],
      graphLinkIds: []
    };
    const review: PeerReviewObject = {
      id: "review:1",
      publicationId: publication.id,
      reviewerId: "reviewer:1",
      mode: "open",
      comments: ["Method is traceable."],
      approved: true,
      revisionRequests: [],
      conflictResolutionNotes: [],
      completedAt: new Date().toISOString()
    };

    await runtime.createResearch(project);
    await runtime.addEvidence(evidence);
    await runtime.createHypothesis(hypothesis);
    await runtime.createExperiment(experiment);
    await runtime.publishResearch(publication);
    await runtime.reviewPublication(review);

    const search = await runtime.searchResearch("evidence learning");
    const analytics = await runtime.analytics(project.id);
    const recommendations = await runtime.recommendEvidence(project.id);

    expect(search).toContain(project.id);
    expect(analytics.evidenceGrowth).toBe(1);
    expect(analytics.experimentCount).toBe(1);
    expect(recommendations[0]?.targetId).toBe(evidence.id);
    expect(runtime.events().map((event) => event.type)).toContain("PublicationPublished");
  });

  it("supports research communities, collaboration, tasks, datasets, and recommendations", async () => {
    const runtime = new LocalResearchRuntime();
    const project = createResearchProject(
      "research:2",
      "question:2",
      "Open science collaboration",
      ["Coordinate researchers"],
      "community research"
    );
    const community: ResearchCommunityRuntime = {
      id: "community:1",
      name: "Open Research Lab",
      type: "research-group",
      memberIds: [],
      roles: {},
      permissionIds: [],
      timelineIds: [],
      metrics: {},
      graphNodeId: "community-node:1"
    };
    const collaboration: CollaborationRecord = {
      id: "collaboration:1",
      workspaceId: "workspace:research",
      projectId: project.id,
      participantIds: ["researcher:1", "mentor:1"],
      sharedObjectIds: [project.id],
      comments: ["Let's collect stronger evidence."],
      mentions: ["mentor:1"],
      notificationIds: [],
      assignmentIds: ["task:1"]
    };
    const task: ResearchTask = {
      id: "task:1",
      projectId: project.id,
      title: "Collect evidence",
      dependencyIds: [],
      assigneeIds: ["researcher:1"],
      checklist: ["Find source", "Validate provenance"],
      status: "doing",
      progress: 0.5,
      benchmarkIds: []
    };
    const dataset: DatasetObject = {
      id: "dataset:1",
      projectId: project.id,
      schema: { fields: ["claim", "evidence"] },
      metadata: { title: "Evidence Dataset" },
      version: "1.0.0",
      license: "CC-BY",
      storageRef: "memory://dataset:1",
      quality: 0.7,
      provenance: "researcher:1",
      relationIds: []
    };

    await runtime.createResearch(project);
    await runtime.createCommunity(community);
    await runtime.joinCommunity(community.id, "researcher:1", "researcher");
    await runtime.createCollaboration(collaboration);
    await runtime.assignTask(task);
    await runtime.addDataset(dataset);

    const analytics = await runtime.analytics(project.id);
    const recommendations = await runtime.recommendResearch(project.id);
    const timeline = await runtime.graphTimeline(project.id);

    expect(analytics.communityActivity).toBe(1);
    expect(analytics.collaboration).toBe(1);
    expect(recommendations.length).toBeGreaterThanOrEqual(1);
    expect(timeline.length).toBeGreaterThan(0);
    expect(runtime.events().map((event) => event.type)).toContain("MemberJoined");
  });
});
