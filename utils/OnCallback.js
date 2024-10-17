  /**
 * @typedef {Function} ConditionCallback1
 * @returns {Promise<boolean>|boolean} El resultado de la condición
 */

/**
 * @typedef {Function} ExecutionCallback1
 * @returns {Promise<void>|void}
 */

/**
 * @typedef {Function} ErrorHandler1
 * @param {Error} error - El error que ocurrió
 * @param {ExecutionCallback1[]} callbacks - Lista de callbacks pendientes
 * @returns {Promise<void>|void}
 */

/**
 * Clase que maneja el cacheo y ejecución de callbacks basado en una condición.
 * Soporta operaciones asíncronas tanto para la condición como para los callbacks.
 */


export default class OnCallback {

  /**
   * @param {ConditionCallback1} condition - Función que determina si se ejecutan los callbacks
   * @param {number} [debounceTime=1000] - Tiempo en ms para el debounce
   * @param {ErrorHandler1} [onError=null] - Manejador de errores personalizado
   */
  constructor(condition, debounceTime = 1000, onError = null) {
    this.condition = condition;
    this.cachedCallbacks = [];
    this.debounceTime = debounceTime;
    this.debounceTimeout = null;
    this.onError = onError || this.defaultErrorHandler;
    this.isExecuting = false;
  }

  /**
   * Manejador de errores por defecto
   * @param {Error} error - El error ocurrido
   * @param {ExecutionCallback1[]} cachedCallbacks - Lista de callbacks en cache
   */
  async defaultErrorHandler(error, cachedCallbacks) {
    console.error('Error en CacheCallback:', error);
    console.log('Callbacks en cache:', cachedCallbacks.length);
  }

  /**
   * Ejecuta o cachea un callback basado en la condición
   * @param {ExecutionCallback1} callback - El callback a ejecutar o cachear
   * @returns {Promise<void>}
   */
  async execute(callback) {
    try {
      if (this.isExecuting) {
        this.cachedCallbacks.push(callback);
        return;
      }

      this.isExecuting = true;
      const conditionResult = await Promise.resolve(this.condition());
      
      if (conditionResult === true) {
        await this.executeCache();
        await Promise.resolve(callback());
      } else {
        this.cachedCallbacks.push(callback);
        this.scheduleDebounceCheck();
      }
    } catch (error) {
      await this.onError(error, [...this.cachedCallbacks]);
      this.cachedCallbacks.push(callback);
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Programa la verificación debounced de la condición
   * @private
   */
  scheduleDebounceCheck() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.checkConditionAndExecute();
    }, this.debounceTime);
  }

  /**
   * Verifica la condición y ejecuta el cache si es apropiado
   * @private
   */
  async checkConditionAndExecute() {
    if (this.isExecuting) return;

    try {
      this.isExecuting = true;
      const conditionResult = await Promise.resolve(this.condition());
      
      if (conditionResult === true) {
        await this.executeCache();
      } else {
        await this.onError(
          new Error('Condition returned false'),
          [...this.cachedCallbacks]
        );
      }
    } catch (error) {
      await this.onError(error, [...this.cachedCallbacks]);
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Ejecuta todos los callbacks en el cache
   * @private
   */
  async executeCache() {
    while (this.cachedCallbacks.length > 0) {
      const cachedCallback = this.cachedCallbacks.pop();
      try {
        await Promise.resolve(cachedCallback());
      } catch (error) {
        console.error('Error executing cached callback:', error);
      }
    }
  }

  /**
   * Cambia el tiempo de debounce
   * @param {number} newTime - Nuevo tiempo en milisegundos
   */
  setDebounceTime(newTime) {
    this.debounceTime = newTime;
  }

  /**
   * Establece un nuevo manejador de errores
   * @param {ErrorHandler1} newHandler - Nuevo manejador de errores
   */
  setErrorHandler(newHandler) {
    this.onError = newHandler;
  }

  /**
   * Obtiene el número de callbacks en cache
   * @returns {number} Número de callbacks en cache
   */
  getCacheSize() {
    return this.cachedCallbacks.length;
  }

  /**
   * Limpia los recursos y timeouts
   */
  destroy() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.cachedCallbacks = [];
  }
}