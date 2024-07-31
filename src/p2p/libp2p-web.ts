import {Libp2p} from 'libp2p';
import {webSockets} from "@libp2p/websockets";
import {type PeerId} from '@libp2p/interface';
import {bootstrap} from "@libp2p/bootstrap";

import {noise} from "@chainsafe/libp2p-noise";
import {yamux} from "@chainsafe/libp2p-yamux";
import {mplex} from "@libp2p/mplex";
import {autoNAT} from "@libp2p/autonat";
import {dcutr} from "@libp2p/dcutr";
import {identify} from "@libp2p/identify";
import * as libp2pInfo from "libp2p/version";
import {keychain} from "@libp2p/keychain";
import {ping} from "@libp2p/ping";
import {kadDHT} from "@libp2p/kad-dht";
import {ipnsValidator} from "ipns/validator";
import {ipnsSelector} from "ipns/selector";
import {all, wss} from '@libp2p/websockets/filters'
import {Multiaddr} from "@multiformats/multiaddr";
import * as mafmt from '@multiformats/mafmt'

export interface Data {
    nodeAddress: string[];
    libp2p: Libp2p
}

export const CODE_P2P = 421
export const CODE_CIRCUIT = 290
export const CODE_TCP = 6
export const CODE_WS = 477
export const CODE_WSS = 478
export function ws (multiaddrs: Multiaddr[]): Multiaddr[] {
    return multiaddrs.filter((ma) => {
        if (ma.protoCodes().includes(CODE_CIRCUIT)) {
            return false
        }
        const testMa = ma.decapsulateCode(CODE_P2P)
        return mafmt.WebSockets.matches(testMa)
    })
}

export async function createConfig<T>(
    additionalServices: any,
    peerId?: PeerId,
    bootstrapAddrList?: string[],
): Promise<T> {
    bootstrapAddrList = bootstrapAddrList || process.env.BOOTSTRAP?.split(',') || ["bootstrap"];

    //add public network for IPNS support
    bootstrapAddrList.push("/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN");
    bootstrapAddrList.push("/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa");
    bootstrapAddrList.push("/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb");
    bootstrapAddrList.push("/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt");
    bootstrapAddrList.push("/ip4/51.159.100.53/tcp/4001/p2p/QmdvgyvitE7TKTrK31iD86eksXJKtHJjWhxAFBhmHoLJGy");

    const libp2pOptions: any = {
        connectionEncryption: [
            noise()
        ],
        streamMuxers: [
            yamux(),
            mplex()
        ],
        peerId: peerId,
        /*addresses: {
            listen: [
                '/webrtc',
                "/webrtc-direct",
                '/webtransport'
            ],
        },*/
        transports: [
            webSockets({
                filter: multiaddrs => {
                    if(window.location.hostname === "localhost"){//only insecure one
                        return ws(multiaddrs);
                    }else{
                        return wss(multiaddrs);
                    }
                },
            }),
            /*webRTCDirect(),
            webRTC({
                rtcConfiguration: {
                    iceServers: [
                        {
                            urls: [
                                "stun:stun.l.google.com:19302",
                                "stun:global.stun.twilio.com:3478",
                            ],
                        },
                    ],
                },
            }),
            webTransport(),
            circuitRelayTransport()*/
        ],
        peerDiscovery: [
            bootstrap({
                list: bootstrapAddrList,
                timeout: 0,
            }),
            /*pubsubPeerDiscovery({
                interval: 1000,
                topics: ["meta-mesh._peer-discovery._p2p._pubsub"], // default : ['_peer-discovery._p2p._pubsub']
                listenOnly: false,
            }),*/
        ],
        connectionGater: {
            denyDialMultiaddr: async (multiaddr: Multiaddr) => {
                return false;
            },
        },
        services: {
            autoNAT: autoNAT(),
            dcutr: dcutr(),
            identify: identify({
                agentVersion: `${libp2pInfo.name}/${libp2pInfo.version} UserAgent=meta-mesh-web`
            }),
            keychain: keychain(),
            ping: ping(),
            //pubsub: gossipsub({ allowPublishToZeroPeers: true }),//needed for pubsub peer discovery (not related to the search protocole)
            dht: kadDHT({
                validators: {
                    ipns: ipnsValidator
                },
                selectors: {
                    ipns: ipnsSelector
                }
            }),
            ...additionalServices
        }
    }
    return libp2pOptions;
}
