# Authoring Custom Adapters

To implement a custom execution adapter, implement the `SandboxProvider` contract:

```typescript
import { SandboxProvider, SandboxInstance, ExecutionResult } from '@semantiq/sandbox-contracts';

export class MyCustomAdapter implements SandboxProvider {
  readonly name = 'my-custom-adapter';
  
  async createInstance(): Promise<SandboxInstance> {
    // Initialize container or environment
    return new MyInstance();
  }
}
```
