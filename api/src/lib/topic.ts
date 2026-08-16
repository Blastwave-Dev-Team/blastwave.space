import net from 'net';

const TOPIC_TIMEOUT_MS = 2000;
const MAX_RESPONSE_BYTES = 64 * 1024;
const PADDING_BYTES = 5;

export function ByondTopic(
  addr: string,
  port: number,
  req: string,
): Promise<string | number> {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ port, host: addr });
    let buffer: Buffer | null = null;
    let expectedLength: number | null = null;
    let settled = false;

    const finish = (error?: Error, value?: string | number) => {
      if (settled) {
        return;
      }
      settled = true;
      client.destroy();
      if (error) {
        reject(error);
        return;
      }
      resolve(value as string | number);
    };

    client.setTimeout(TOPIC_TIMEOUT_MS);

    client.on('connect', () => {
      const query = `?${req}\0`;
      const payloadLength = PADDING_BYTES + Buffer.byteLength(query, 'ascii');
      const packet = Buffer.alloc(4 + payloadLength);
      packet[0] = 0;
      packet[1] = 0x83;
      packet.writeUInt16BE(payloadLength, 2);
      packet.write(query, 4 + PADDING_BYTES, 'ascii');
      client.write(packet);
    });

    client.on('data', (data) => {
      buffer = buffer == null ? data : Buffer.concat([buffer, data]);
      if (buffer.length > MAX_RESPONSE_BYTES) {
        finish(new Error('topic response too large'));
        return;
      }
      if (buffer.length > 5) {
        expectedLength = buffer.readUInt16BE(2);
        if (expectedLength < 1 || expectedLength > MAX_RESPONSE_BYTES) {
          finish(new Error('invalid topic length'));
          return;
        }
      }
      if (expectedLength != null && buffer.length >= expectedLength + 4) {
        const type = buffer[4];
        if (type === 0x2a) {
          finish(undefined, buffer.readFloatLE(5));
          return;
        }
        if (type === 0x06) {
          finish(undefined, buffer.toString('utf8', 5, expectedLength + 3));
          return;
        }
        finish(new Error('invalid topic data type'));
      }
    });

    client.on('timeout', () => {
      finish(new Error('topic timeout'));
    });

    client.on('error', (err) => {
      finish(err);
    });

    client.on('close', () => {
      finish(new Error('topic connection closed'));
    });
  });
}
