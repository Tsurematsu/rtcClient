/**
 * @typedef {Object} EventObject
 * @property {string} disconnect - Desconectado
 * @property {string} connecting - Conectando
 * @property {string} connected - Conectado
 */

/**
 * @typedef {Function} EventCallback
 * @param {string} status - Estado de la conexión
 * @param {string} getStatus - Estado de la conexión
 */

/**
 * @typedef {Function} EventProxy
 * @param {EventCallback} eventCallback - The callback function for the event.
 * @returns {EventObject}
 */

/** @type {EventProxy} */
const Event = (eventCallback)=>{
    /** @type {EventObject} */
    // @ts-ignore
    const retorno = new Proxy({
        keys:{
            disconnect:"disconnect",
            connecting:"connecting",
            connected:"connected",
        },
        status:"disconnect",
        get event(){return (getStatus)=>eventCallback(this.status, getStatus)}
    }, {
        get(target, prop, receiver){
            target.status = String(prop);
            target.event(()=>target.status);
            return target.status;
        }
    });

    return retorno;
}

export default Event;