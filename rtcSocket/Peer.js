import Properties from "../Properties.js";
import RTConnection from "./RTConnection.js";
import inherit from "../utils/inherit.js";
class PublicPeer{
    /** @type {string} */
    sender = "";
    eventTrack = (track, client)=>{};
    onTrack = (callback)=>{this.eventTrack = callback};
    eventChat = (message, client)=>{};
    onChat = (callback)=>{this.eventChat = callback};
}
export default class Peer extends Properties {
    /** @type {RTConnection} */
    peer;
    /** @type {PublicPeer} */
    peerClient;
    sender;
    #streamUnit;
    setStreamUnit=(stream)=>{
        if (stream === undefined) return;
        if (this.#streamUnit !== undefined) return;
        this.#streamUnit = stream;
        if (this.peer === undefined) return; 
        this.peer.addLocalStream(stream);
    };
    /** @param {object} Main  @param {string} sender */
    constructor(Main, sender){
        super();
        this.sender = sender;
        this.peerClient = new PublicPeer();
        this.peerClient.sender = sender;
        inherit(this, Main);
    }
    async join(_, to){
        this.peer ??= new RTConnection({
            iceServers:this.iceServers, 
            to, 
            localRol:"master"
        }, this);
        this.peer.addLocalStream(this.#streamUnit);
        this.peer.status.connecting;
        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(offer);
        return offer;
    }   

    async offer(offer, to){;
        this.peer ??= new RTConnection({
            iceServers:this.iceServers, 
            to, 
            localRol:"client"
        }, this);
        this.peer.addLocalStream(this.#streamUnit);
        this.peer.status.connecting;
        this.peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);
        return answer;
    }
    async answer(answer){
        this.peer.setRemoteDescription(new RTCSessionDescription(answer));
        return {type:"iceCandidateIn", candidates:this.peer.getCandidates()};
    }
    async iceCandidateIn({candidates}){
        this.peer.status.connected;
        this.peer.iceCandidate(candidates);
        return {type:"iceCandidateOut", candidates:this.peer.getCandidates()};
    }
    async iceCandidateOut({candidates}){ 
        this.peer.status.connected;
        this.peer.iceCandidate(candidates);
    }
    iceCandidate({data}){ this.peer.addIceCandidates(data)}
    
    async renegotiation({data}){
        this.peer.renegotiation(data);
    }
    close(){
        if (this.peer) {
            this.peer.close();
            this.peer.clearIceCandidates();
            this.peer = null;
            this.#streamUnit = null;
        }
    }
}