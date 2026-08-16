# Observable Behavioral Grounding

SemantIQ evaluates observable behavior through a strict 7-stage sequence:

$$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$

- **Context**: The environmental state and prompt inputs presented to the agent.
- **Interpretation**: The observable framing and semantic understanding reflected in model outputs.
- **Decision**: The selected tool call or procedural choice.
- **Action**: The concrete command or API invocation emitted by the model.
- **Result**: The direct return code or output from the execution environment.
- **Consequence**: The downstream state modifications caused by the action.
- **Recovery**: The model's ability to detect, mitigate, and correct execution failures.
