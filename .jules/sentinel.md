## 2025-05-20 - Stream Chunk Byte Size Bounds Prior to String Allocation

**Vulnerability:** HTTP request body size checks using string concatenation (`body += String(chunk)`) perform size checks post-concatenation, allowing malicious single large chunks to trigger large heap string allocations before the size limit is evaluated.
**Learning:** Checking string length after concatenation in `for await (const chunk of request)` streams fails to bound memory allocation on the first chunk.
**Prevention:** Track accumulated byte size (`Buffer.byteLength` or `Buffer.length`) before string concatenation and abort stream reading immediately if limit is exceeded.
