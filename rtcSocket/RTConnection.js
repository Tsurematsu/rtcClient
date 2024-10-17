import Debounce from "../utils/Debounce.js"
import OnCallback from "../utils/OnCallback.js"
/**  @typedef {import('../utils/Event.js').EventObject} EventObject */
/**  @typedef {import('./Peer.js').default} Peer */
import Event from "../utils/Event.js";
const statusString ={
    connected: "connected",
    disconnected: "disconnected",
    connecting: "connecting",
}
const rolMode = {
    master: "master",
    client: "client",
}
export default class RTConnection {
    /** @type {RTCPeerConnection} */
    peer;
    /** @type {RTCDataChannel} */
    chat;
    #iceBounce;
    #events = {};
    setLocalDescription;
    setRemoteDescription;
    createOffer;
    createAnswer;
    candidates = [];
    managePermissions;
    #cacheIce;
    #getStatus;
    cacheTacks = [];
    /** @type {Peer} */
    main;
    // Renegotiation Manager
    #requestNeg = false;
    #processNeg = false;
    #preventNeg = false;
    #onPrivateConnected=()=>{};
    /** @type {EventObject} */
    status = Event((status, getStatus)=>{
        this.#getStatus = getStatus;
        if (status === statusString.connected) {
            this.#onPrivateConnected();
            this.main.peerClient.sender = this.main.sender;
            this.main.eventNewCLient?.(this.main.peerClient);
            for (const track of this.cacheTacks) {
                this.main.eventTrack?.(track, this.main.sender);
                this.main.peerClient.eventTrack?.(track, this.main.sender);
            };
            this.cacheTacks = [];
        }
    });

    constructor({iceServers, to, localRol}, main){
        this.main = main;
        this.peer = new RTCPeerConnection(iceServers);
        
        // event in development, not implemented now
        this.peer.addEventListener("track", (event)=>{
            if (this.#getStatus() === statusString.connected) {
                this.main.eventTrack?.(event, this.main.sender);
                this.main.peerClient.eventTrack?.(event, this.main.sender);
                return;
            }

            this.cacheTacks.push(event);
        });
        
        this.peer.addEventListener("negotiationneeded", async ()=>{
            if (
                localRol === rolMode.client && 
                this.#getStatus() !== statusString.connected && 
                this.#requestNeg === false &&
                this.#processNeg === false
            ) {
                this.#requestNeg = true;
                to({type:"renegotiation", data:{type:"request"}});
                return;
            }
            if (this.#getStatus() !== statusString.connected)  return ;
            if (this.#processNeg) {this.#preventNeg = true; return;}
            if (this.#requestNeg) return; 
            this.#requestNeg = true;
            to({type:"renegotiation", data:{type:"request"}});
        })
        

        this.renegotiation = async (data)=>{
            const type = data.type;
            const InData = data.InData ?? {};
            const localTo = (type, InData=null)=>{to({type:"renegotiation", data:{InData, type}})};
            const steps = {
                request:()=>{
                    const discern = ()=>{
                        this.#onPrivateConnected = ()=>{};    
                        if (localRol === rolMode.master && this.#requestNeg) return;
                        this.#processNeg = true;
                        localTo("approved");
                    }
                    if (this.#getStatus() === statusString.connected) discern();
                    this.#onPrivateConnected = discern;
                },
                approved:async ()=>{
                    this.#processNeg = true;
                    const makeNewSDP = await this.peer.createOffer();
                    await this.setLocalDescription(makeNewSDP);
                    localTo("makeAnswer", makeNewSDP);
                },
                makeAnswer:async (offer)=>{
                    this.setRemoteDescription(new RTCSessionDescription(offer));
                    const makeNewSDP = await this.peer.createAnswer();
                    await this.setLocalDescription(makeNewSDP);
                    localTo("setAnswer", makeNewSDP);
                },
                setAnswer: async (answer)=>{
                    await this.setRemoteDescription(answer);
                    this.#processNeg = false;
                    this.#requestNeg = false;
                    localTo("completed");
                },
                completed:async ()=>{
                    // prevent loop of event renegotiation
                    let isLoop = false;
                    if (!this.#requestNeg) { isLoop = this.#preventNeg; }
                    this.#processNeg = false;
                    if (isLoop) {console.warn("loop detectado"); return;}
                    if (!isLoop && this.#requestNeg)localTo("request");
                }
            }
            await steps[type]?.(InData);
        };
        // -------------------------------------- 
        // this.peer.addTransceiver('video');
        // this.peer.addTransceiver('audio');
        // -------------------------------------- 

        this.setLocalDescription = (a)=>this.peer.setLocalDescription(a);
        this.setRemoteDescription = (a)=>this.peer.setRemoteDescription(a);
        this.createOffer = (a)=>this.peer.createOffer(a);
        this.createAnswer = (a)=>this.peer.createAnswer(a);
        this.chat = this.peer.createDataChannel("chat");
        this.chat.addEventListener("open", async ()=>{
            this.main.peerClient.eventChat({
                on:(event, callback)=>{this.#events[event] = callback},
                emit:(message, event)=>{this.emit(message, event)}
            });
        });
        this.peer.addEventListener('datachannel', ({channel}) => {
            channel.addEventListener('message', ({data}) => {
                const into = JSON.parse(data);
                this.#events[into.event]?.(into.message);
            });
        });
        this.peer.addEventListener("icecandidate", (event)=>{
            if(!event.candidate) return;
            this.candidates.push(event.candidate);
            this.#iceBounce ??= new Debounce(2000, async ()=>{
                if(this.candidates.length===0) return;
                to({type:"iceCandidate", data:this.candidates});
                this.candidates = [];
            });
            this.#iceBounce.run();
        });
        this.#cacheIce = new OnCallback(()=>{
            if(this.peer.remoteDescription) return true;
            return false;
        })
    }

    // #localStream;
    addLocalStream(stream){
        if (stream===undefined) return;
        for (const track of stream.getTracks()) {
            this.peer.addTrack(track, stream);
        }
    }

    getCandidates(){
        const temCandidates = this.candidates;
        this.candidates = [];
        return temCandidates;
    }
    /** @param {object} message @param {string} event */
    emit(message, event){
        this.chat.send(JSON.stringify({message, event}));
    }

    /** @param {string} event @param {function} callback */
    on(event, callback){
        this.#events[event] = callback;
    }
    close(){this.peer.close()}
    clearIceCandidates(){this.candidates = []}
    async iceCandidate(candidates){
        if (Array.isArray(candidates)) {     
            for (const candidate of candidates) {
                await this.peer.addIceCandidate(candidate);
            }
            return;
        }
        await this.peer.addIceCandidate(candidates);
    }

    async addIceCandidates(candidates){
        if (Array.isArray(candidates)) { 
            this.#cacheIce.execute(async ()=>{
                for(const candidate of candidates){
                    await this.peer.addIceCandidate(candidate);
                }
            });
        }
        this.#cacheIce.execute(async ()=>{
            await this.peer.addIceCandidate(candidates);
        });
    }
}
