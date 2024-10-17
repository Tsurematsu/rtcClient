import Properties from "../Properties.js";
import Peer from "./Peer.js";
import inherit from "../utils/inherit.js";
export default class RtcSocket extends Properties {
    peers = {};
    closePeer(idClient){
        if (this.peers[idClient] === undefined) return;
        this.peers[idClient].close();
    }
    constructor(Main){ 
        super(); 
        inherit(this, Main);
        this.setStream = (stream) =>{
            if (this.stream !== undefined) return;
            this.stream = stream;
            for (const peer of Object.values(this.peers)) {
                peer.setStreamUnit(stream)
            }
        };
        const eventsManager = async ({sender, data, to})=>{
            this.peers[sender] ??= new Peer(this, sender);
            this.peers[sender].setStreamUnit(this.stream);
            const retorno = await this.peers[sender][data.type](data, (res)=>to(res, 'newRTC'));
            if(retorno===null || retorno===undefined) return;
            to(retorno, "newRTC");
        }
        this.socket.onNewPeer(async ({sender, data, to})=>{
            eventsManager({sender, data, to});
        })
        this.socket.in("newRTC", async ({sender, data, to})=>{
            eventsManager({sender, data, to});
        })
    }
}

