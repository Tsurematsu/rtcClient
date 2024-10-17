/** @typedef {import('./rtcSocket/RtcSocket.js').default} RtcSocket */
/** @typedef {import('./socket/socket.js').default} socket */
export default class Properties{

    //  not touch
    // -----------------------------------------------------------------------

    eventErrorJoin = ({remake})=>{};
    onErrorJoin = (callback)=>{this.eventErrorJoin = callback};
    
    eventConnected = (e)=>{};
    onConnected = (callback)=>{this.eventConnected = callback};
    
    eventNotifyClose = (e)=>{};
    onNotifyClose = (callback)=>{this.eventNotifyClose = callback};
    
    eventTrack;
    onTrack = (callback)=>{this.eventTrack = callback};
    
    eventNewCLient;
    /** @param {Properties} callback */
    onNewClient = (callback)=>{this.eventNewCLient = callback};

    // -----------------------------------------------------------------------
    // modificador
    /** @param {MediaStream} stream */
    setStream = (stream)=>{this.stream = stream};
    /** @type {MediaStream} */
    stream;
    // -----------------------------------------------------------------------

    /** @type {String} */
    host;
    /**@type {String} */ 
    port;
    /** @type {String} */
    room;
    /** @type {RtcSocket} */
    rtcSocket;
    /** @type {socket} */
    socket;
    username;
    iceServers;

    // -----------------------------------------------------------------------
    
}