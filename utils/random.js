export default function random(msg){
    return `${msg}_${Math.floor(Math.random() * 1000)}`;
}