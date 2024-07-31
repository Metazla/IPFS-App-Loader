import PWABadge from './PWABadge.tsx'
import './App.css'
import {AddressBar} from "./AdressBar.tsx";
import {useState} from "react";

function App() {
    //const link = '/ipfs/k51qzi5uqu5di6mtyetmj34yhcb7x17thj14kgyhqb79dzt06eh6o86e0hzk0q/';
    const [link, setLink] = useState('vitalik.eth');
    let formatedLink = link;
    if(!formatedLink.startsWith('/ipfs/')) {
        formatedLink = '/ipfs/' + formatedLink;
    }
    if(!formatedLink.endsWith('/')) {
        formatedLink = formatedLink + '/';
    }
    return (
        <>
            <AddressBar
                link={link}
                onLinkChange={setLink}
            />
            <iframe
                src={formatedLink}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: "aliceblue"
                }}
            />
            {/*<iframe
                src={"/ipfs/metazla.eth"}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: "aliceblue"
                }}
            />*/}
            <PWABadge/>
        </>
    )
}

export default App
