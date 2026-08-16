export interface Question {
  readonly id: string;
  readonly text: string;
  readonly status: "draft" | "open" | "investigating" | "resolved" | "archived";
}

export interface QuestionRepository {
  save(question: Question): Promise<void>;
  getById(id: string): Promise<Question | undefined>;
}
