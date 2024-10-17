// @ts-nocheck


/**
 * @typedef {Object} inData
 * @property {string} sender 
 * @property {string} username
 * @property {string[]} users
 * @property {function({response, event}): void} emit
 * @property {function(Object, string): void} to
 * @property {Object} data
 */

/**
 * @typedef {Object} inEvent
 * @property {string} username
 * @property {Object} data
 * @property {string} event 
 */



export default class socket {
    room = null;
    host = null;
    username = null;

    #beacon = null;
    #localSocket = null;

    #eventNewPeer = ()=>{};
    #eventConnected = ()=>{};
    #eventNotifyClose = ()=>{};
    #errorJoin = ()=>{};

    constructor({room, username, host}, callbackResolve) {
        this.room = room;
        this.username = username;
        this.host = host;
        this.#beacon = [
            `${this.host}/notify-close`,
            new Blob([`${this.username}/${this.room}`], { type: 'text/plain' })
        ]       
        import(`${this.host}/socket.io/socket.io.js`).then(()=>{
            window.addEventListener('beforeunload', () => navigator.sendBeacon(this.#beacon[0], this.#beacon[1]));
            this.#localSocket = io(this.host);
            this.#localSocket.on("join", (data)=>{
                data.emit = ({response, event})=>{ this.#localSocket.emit("toClient", {username:data.sender, data:response, event}) }
                data.to = (response, event)=>{ this.#localSocket.emit("toClient", {username:data.sender, data:response, event}) }
                this.#eventNewPeer(data)
            }); 
            this.#localSocket.on("joined", (data)=>this.#eventConnected({username:this.username, data})); 
            this.#localSocket.on("connect", ()=>{ this.#localSocket.emit("join", { room:this.room,  username:this.username}) });
            this.#localSocket.on("error_join", (data)=>this.#errorJoin({remake:this.remake, ...data}))  
            this.#localSocket.on("notify-close", (user)=>{ if (this.username === user) return; this.#eventNotifyClose(user)});
            return callbackResolve(this)
        });
    }

    /** @param {function(users): void} callback */
    onConnected(callback=()=>{}){ this.#eventConnected = callback;}

    /** @param {function(sender): void} callback */
    onNotifyClose(callback=()=>{}){ this.#eventNotifyClose = callback;}

    /** @param {function({remake}): void} callback */
    onErrorJoin(callback=()=>{}){ this.#errorJoin = callback;}

    /** @param {function(inData): void} callback */
    onNewPeer(callback=(e)=>{}){ this.#eventNewPeer = callback;}
    emit(...args){ this.#localSocket.emit(...args)};
    send(...args){ this.#localSocket.send(...args)};
    on(...args){ this.#localSocket.on(...args)};
    remake(newUsername){
        this.#localSocket.emit("join", {room:this.room, username:newUsername}, true);
        this.username = newUsername;
        this.#beacon[1] = new Blob([`${this.username}/${this.room}`], { type: 'text/plain' });
        return newUsername;
    }
    in(event, callback){ 
        this.#localSocket.on(event, async (data)=>{
            if (!(data.username === "all" || data.username === this.username)) return
            const username = data.sender;
            data.emit = ({response, event})=>{ this.#localSocket.emit("toClient", {username, data:response, event}) }   
            data.to = (response, event)=>{ this.#localSocket.emit("toClient", {username, data:response, event}) }   
            const response = await callback(data);
            if (response === undefined || response === null || response === false) { return; }
            this.to({username:data.sender, data:response.data, event:response.event});
        })
    };

    /** @param {inEvent}  */
    to({username, data, event}){this.#localSocket.emit("toClient", {username, data, event})};
}

