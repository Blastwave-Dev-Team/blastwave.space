import net from "net";

export function ByondTopic(addr : string, port : number, req : string) : Promise<string | number> {
	return new Promise((resolv, reject) => {
		const client = net.createConnection({port: port, host: addr}, () => {
			client.write(new Uint8Array([0, 0x83, 0, req.length + 7, 0, 0, 0, 0, 0]))
			client.write(`?${req}\x00`, "ascii")
		})
		let buffer : Buffer<ArrayBufferLike> | null = null
		let length: number | null = null
		client.on('data', (data) => {
			if (buffer == null) {
				buffer = data
			} else {
				buffer = Buffer.concat([buffer, data])
			}
			if (buffer.length > 5) {
				//console.log("Got header")
				length = buffer.readUInt16BE(2);
				//console.log("Length: "+length)
			}
			if (length != null && buffer.length >= length + 4) {
				client.destroySoon()
				if (buffer[4] == 0x2a) {
					resolv(buffer.readFloatLE(5))
				} else if (buffer[4] == 0x6) {
					resolv(buffer.toString('utf8', 5, length + 3))
				} else {
					reject(new Error(`invalid data type ${buffer[4]}`));
				}
			}
		})
		client.on('error', (err) => {
			reject(err)
		})
	})
}
