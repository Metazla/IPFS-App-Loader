import {PeerId} from "@libp2p/interface";
import {createLibp2p, Libp2p} from "libp2p";
import {createConfig} from "./libp2p-web";
import {createHelia, HeliaLibp2p} from "helia";
import {UnixFS, unixfs} from "@helia/unixfs";
import {IPNS, ipns} from '@helia/ipns'

export class IPFSService {
    public libp2p: Libp2p;
    public helia: HeliaLibp2p<Libp2p>;
    public fs: UnixFS;
    public ipns: IPNS;

    constructor(private peerId?: PeerId | string,
                private bootstrapAddrList?: string[]) {

    }

    async start() {
        this.libp2p = await createLibp2p(await createConfig({}, null, this.bootstrapAddrList));
        this.helia = await createHelia({libp2p: this.libp2p});
        this.fs = unixfs(this.helia);
        this.ipns = ipns(this.helia)
        await this.libp2p.start();
        console.log('Node Address: ', this.libp2p.getMultiaddrs().map((ma) => ma.toString()));
    }
}
