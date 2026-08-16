/**
 * @package @tech-club/adapter-oci
 * OCI 8-Byte Binary Stream Demultiplexer
 * Demuxes standard OCI binary headers: [streamType (1B)][reserved (3B)][frameSize (4B BE)][payload (NB)]
 */

export class OciStreamDemuxer {
  private buffer = Buffer.alloc(0);
  private totalBytesEmitted = 0;
  private readonly maxBytes: number;

  constructor(maxBytes = 5242880) {
    this.maxBytes = maxBytes;
  }

  processChunk(
    chunk: Buffer,
    onStdout: (text: string) => void,
    onStderr: (text: string) => void
  ): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= 8) {
      const streamType = this.buffer[0]; // 1 = stdout, 2 = stderr, 3 = stdin
      const frameSize = this.buffer.readUInt32BE(4);

      // Check if complete frame is available
      if (this.buffer.length < 8 + frameSize) {
        break;
      }

      const payload = this.buffer.subarray(8, 8 + frameSize);
      this.buffer = this.buffer.subarray(8 + frameSize);

      if (this.totalBytesEmitted + payload.length > this.maxBytes) {
        const allowed = Math.max(0, this.maxBytes - this.totalBytesEmitted);
        const truncated = payload.subarray(0, allowed).toString('utf-8') + '\n[STREAM TRUNCATED: 5MB LIMIT EXCEEDED]';
        if (streamType === 1) onStdout(truncated);
        else if (streamType === 2) onStderr(truncated);
        this.totalBytesEmitted = this.maxBytes;
        return;
      }

      this.totalBytesEmitted += payload.length;
      const text = payload.toString('utf-8');
      if (streamType === 1) onStdout(text);
      else if (streamType === 2) onStderr(text);
    }
  }

  flush(): void {
    this.buffer = Buffer.alloc(0);
    this.totalBytesEmitted = 0;
  }
}
