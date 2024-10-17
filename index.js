import socket from "./socket/socket.js";
import iceServers from "./utils/iceServers.js";
import Properties from "./Properties.js"
import RtcSocket from "./rtcSocket/RtcSocket.js";
export default class client extends Properties {    
    constructor({host, port=3050, username=null, room="room"}) {
        super();
        //------------------------------------------
        this.port = String(port);
        this.room = String(room);
        //------------------------------------------
        const preferURL = new URL(host);
        //------------------------------------------
        const urlPatch = new URL(import.meta.url);
        const urlName = urlPatch.hostname;
        //------------------------------------------
        const alternativeURL = new URL(import.meta.url);
        alternativeURL.port = this.port;
        // -----------------------------------------
        const isLocalIP = Number(urlName.replaceAll(".","")) ? true: false;
        this.host = (isLocalIP || urlName === "localhost") ? alternativeURL.origin: preferURL.origin;
        //------------------------------------------

        this.onTrack = (callback)=>{this.eventTrack = callback};
        this.onNewClient = (callback)=>{this.eventNewCLient = callback};
        this.username = username??`User_${Math.floor(Math.random()*1000)}`;
    }
    async connect(data){
        this.stream = data?.stream ? data.stream: this.stream;            
        this.iceServers ??= await iceServers(this.host);
        this.socket ??= await new Promise((resolve)=>new socket({
            host:this.host,
            room:this.room,
            username:this.username,
        }, resolve));
        this.socket.onConnected(this.eventConnected);
        this.socket.onErrorJoin(this.eventErrorJoin);
        this.socket.onNotifyClose((e)=>{
            this.rtcSocket.closePeer(e);
            this.eventNotifyClose(e);
        });
        this.rtcSocket ??= new RtcSocket(this);
    }
}