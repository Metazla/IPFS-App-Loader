/// <reference lib="webworker" />
console.log('Service worker start')
import {precacheAndRoute} from 'workbox-precaching'
import {clientsClaim} from 'workbox-core'
import {IPFSService} from "./p2p/IPFSService";
import {CID} from 'multiformats/cid';
import {UnixFS} from "@helia/unixfs";
import {IPNS} from "@helia/ipns";
import {peerIdFromString} from '@libp2p/peer-id'
import {ethers} from 'ethers';
import {UnixFSEntry} from "ipfs-unixfs-exporter";
declare let self: ServiceWorkerGlobalScope

// self.__WB_MANIFEST is the default injection point
precacheAndRoute(self.__WB_MANIFEST)

clientsClaim()
self.skipWaiting()

const linkCache: Promise<Cache> = caches.open('ipfs-cache');
const ipfsDirCache: Promise<Cache> = caches.open('ipfs-dir-cache');
const ensCache: Promise<Cache> = caches.open('ens-cache');
let unixfs: UnixFS = null;
let ipns: IPNS = null;

// Any other custom service worker logic can go here.
const ready = (async () => {
    const ipfsService = new IPFSService();
    await ipfsService.start();
    console.log('Service started');
    unixfs = ipfsService.fs;
    ipns = ipfsService.ipns;
})();


//const target = "vitalik.eth";//TODO just for initial test
//cacheIpfsStr("vitalik.eth").catch(console.error);
//cacheIpfsStr("vitalik.eth").catch(console.error);

async function resolveEnsDomain(ensName: string): Promise<string | null> {
    if (!ensName.endsWith('.eth')) {
        throw new Error(`Invalid ENS domain: ${ensName}`);
    }
    if (await (await ensCache).match(ensName)) {
        const response = await (await ensCache).match(ensName);
        const cid = await response.text();
        console.log(`Resolved (cache) ENS name ${ensName} to content hash ${cid}`);
        return cid;
    } else {
        const provider = ethers.getDefaultProvider();
        const resolver = await provider.getResolver(ensName);
        if (resolver) {
            let contentHash = await resolver.getContentHash();
            //will look like ipfs://bafybeicijwrpp5exzlbqpyqcmkbcmnrqxdouyremgq3eod23qufugk5ina
            // or ipns://bafybeicijwrpp5exzlbqpyqcmkbcmnrqxdouyremgq3eod23qufugk5ina
            //clean up the ipfs:// or ipns:// if don't start with that => error
            if (contentHash.startsWith('ipfs://') || contentHash.startsWith('ipns://')) {
                contentHash = contentHash.substring(7);
                console.log(`Resolved ENS name ${ensName} to content hash ${contentHash}`);
                await (await ensCache).put(ensName, new Response(contentHash));
                return contentHash;
            } else {
                throw new Error(`Invalid content hash for ENS name: ${contentHash}`);
            }
        } else {
            throw new Error(`No resolver found for ENS name: ${ensName}`);
        }
    }
}

/**
 * Resolve the name (ENS domain, IPNS peerid, or CID) to a CID
 * @param name
 */
async function resolveName(name: string): Promise<string> {
    // try to resolve the name
    //try solve eth domain
    if (name.endsWith('.eth')) {
        try {
            name = await resolveEnsDomain(name);
        } catch (e) {
            /* ignore */
        }
    }

    //at this point, it could be a Peer or a CID only
    //try resolve ipns
    try {
        // resolve the name
        const peerId = peerIdFromString(name);
        const result = await ipns.resolve(peerId,{
            offline: false,
            nocache: false,
            onProgress: (progress) => {
                console.log('IPNS resolve progress: ' + progress);
            }
        });
        name = result.cid.toString();
    } catch (e) {
        /** ignore => Not An IPNS */
    }
    console.log('Resolved name to ' + name);
    //Must be a CID at this point (will throw if not)
    CID.parse(name);
    return name;
}

async function cacheIpfsStr(name: string) {
    const cidstr = await resolveName(name);
    console.log('caching ' + cidstr);
    await cacheFile(CID.parse(cidstr), "/" + cidstr);
    console.log('linkCache done for ' + name);
}

async function processFile(file: UnixFSEntry, localPath: string, cid: CID) {
    const relPath = localPath + file.path.replace(cid.toString(), '');
    if (file.type === 'file' || file.type === 'raw') {
        const cacheKey = new URL(`/ipfs${relPath}`, self.location.origin);
        if (!await (await linkCache).match(new Request(cacheKey))) {
            //if the file is not in the linkCache, add it
            const content: Uint8Array[] = [];
            for await (const chunk of file.content()) {
                content.push(chunk);
            }
            const response = new Response(new Blob(content));
            await (await linkCache).put(new Request(cacheKey), response);
            console.log(`File ${cacheKey} has been cached`);
        }
    }
}

async function cacheFile(cid: CID|string, localPath: string) {
    if (typeof cid === 'string') {
        cid = CID.parse(cid);
    }
    const cache = await ipfsDirCache;
    if (!await cache.match(cid.toString())) {
        //const ls = unixfs.ls(cid); //Note that this will not work as it will be a generator

        //load all the files first then the directories
        for await (const file of unixfs.ls(cid)) {
            await processFile(file, localPath, cid);
        }

        for await (const file of unixfs.ls(cid)) {
            const relPath = localPath + file.path.replace(cid.toString(), '');
            if (file.type === 'directory') {
                await cacheFile(file.cid, relPath);
            }
        }

        const ret = [];
        for await (const file of unixfs.ls(cid)) {
            ret.push({
                type: file.type,
                cid: file.cid.toString(),
                path: file.path,
            });
        }
        const response = new Response(JSON.stringify(ret));
        await cache.put(new Request(cid.toString()), response);
    } else {
        console.log('cache hit for ' + cid.toString());
    }
}

async function handleFetchEvent(event: FetchEvent) {
    let request = event.request;
    let url = new URL(event.request.url);

    if (url.pathname.startsWith('/ipfs')) {
        console.log('IPFS Cache lookup for ' + url.toString());
        await ready;
        const parts = request.url.split('/');
        const name = parts[4];
        const pathAfterCid = parts.slice(5).join('/');
        const cid = await resolveName(name);
        url = new URL(url.toString().replace(name, cid));
        request = new Request(url);
        let response = await (await linkCache).match(request);
        if (response) {
            console.log('Cache hit for ' + url.toString());
            return response;
        } else {
            if (pathAfterCid === '' || pathAfterCid.endsWith('/')) {
                console.log('Checking for directory ' + name);
                const indexFiles = ['index.html', 'index.htm', 'index'];
                for (const indexFile of indexFiles) {
                    const indexUrl = new URL("/ipfs/" + cid + '/' + indexFile, self.location.origin);
                    const indexRequest = new Request(indexUrl);
                    console.log('Checking for ' + indexUrl.toString());
                    response = await (await linkCache).match(indexRequest);
                    if (response) {
                        console.log('Cache hit for ' + indexUrl.toString());
                        return response;
                    }
                }
            } else {
                console.log('Cache miss for ' + url.toString());
                await cacheIpfsStr(name);
                response = await (await linkCache).match(request);
            }
        }
        if (!response || response.status === 404) {
            response = new Response(
                'The requested file was not found in the linkCache.',
                {
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        'Content-Type': 'text/html',
                        'X-Custom-Header': 'Custom Value'
                    }
                }
            );
        }
        return response;
    }
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/ipfs')) {
        event.respondWith(handleFetchEvent(event));
    } else {
        event.respondWith(fetch(event.request));
    }
});

console.log('Service worker registered 13')

