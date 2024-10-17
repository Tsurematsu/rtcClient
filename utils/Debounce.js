export default class Debounce {
	constructor(wait, func=()=>{}) {
		this.func = func;
		this.wait = wait;
		this.timeout = null;
	}

	run(...args) {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(() => this.func.apply(this, args), this.wait);
	}
	try(callback) {
		clearTimeout(this.timeout);
		this.timeout = setTimeout(callback, this.wait)
	}
}
