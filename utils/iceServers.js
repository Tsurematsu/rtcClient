export default async function iceServers(host=null){
    let turnServer=null;
    if (navigator.onLine) {
        try { turnServer = host!==null ? (await (await fetch(`${host}/turn`)).json()).iceServers:null;} catch {}
    }else{console.log("Offline mode, don't have Ethernet");}
    const iceServers = [
        {"urls": [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302"
        ]},
        {"urls": "stun:stun.ekiga.net"},
        {"urls": "stun:stun.ideasip.com"},
        {"urls": "stun:stun.stunprotocol.org:3478"},
        {"urls": "stun:stun.counterpath.net:3478"},
        {"urls": "stun:stun.freeswitch.org:3478"},
        {"urls": "stun:stun.voip.blackberry.com:3478"}
    ]
    if (turnServer!==null) iceServers.push(turnServer);
    return iceServers;
};