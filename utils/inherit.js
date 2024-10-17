export default function inherit(A, B) {
    const d = {};
    for (const k in B) {
      A[k] = B[k];
      if (Object.prototype.hasOwnProperty.call(B, k)) {
        d[k] = {get:()=>B[k],set:(v)=>{B[k] =v}};
      }
    }
    // @ts-ignore
    Object.defineProperties(A, d);
}