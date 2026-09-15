// Integer construction logic, deliberately independent of Python's 3D/4D morphism.
export const bounds = {3: 7, 4: 4, 5: 4, 6: 3};
export const colors = ['#3183df', '#d58727', '#179b80', '#be669c', '#8263ce', '#dc6659'];
export function state(n, base) {
  let even = 0, odd = 0, position = 0;
  while (n) {
    const digit = n % base;
    if (position++ % 2) odd += digit; else even += digit;
    n = Math.floor(n / base);
  }
  return base === 2 ? ((even - odd) % 4 + 4) % 4 : [even % 2, odd % 2];
}
export function letters(d, n) {
  if (!(d in bounds) || !Number.isInteger(n) || n < 0 || n > 100000) throw Error('Invalid dimension or prefix length');
  if (d === 6) {
    const code = {'01':0, '12':1, '23':2, '30':3, '02':4, '13':4, '20':5, '31':5};
    return Array.from({length:n}, (_, j) => code[`${state(j,2)}${state(j+1,2)}`]);
  }
  const output = []; let previous = 0;
  for (let j = 1; output.length < n; j++) {
    const [a,b] = state(j,3);
    if (a || b) continue;
    const r = (j-previous)/2; previous = j;
    if (d === 3) output.push(...[[0], [1], [2,0], [2,1]][r-1]);
    else output.push(r-1);
  }
  return output.slice(0,n);
}
export function vertices(d, n) {
  const points = [Array(d).fill(0)];
  for (const letter of letters(d,n)) {
    const p = [...points.at(-1)]; p[letter]++; points.push(p);
  }
  return points;
}
const gcd = (a,b) => b ? gcd(b,a%b) : a;
export function check(d,n) {
  if (n > 512) throw Error('Interactive checking is limited to 512 steps');
  const points = vertices(d,n); let pairs = 0;
  for (let a=0; a<points.length; a++) {
    const directions = new Map();
    for (let b=a+1; b<points.length; b++) {
      const delta = points[b].map((x,k) => x-points[a][k]);
      const divisor = delta.reduce(gcd,0);
      const key = delta.map(x => x/divisor).join(',');
      const group = directions.get(key) || [];
      group.push(b); directions.set(key,group); pairs++;
      if (group.length >= bounds[d]-1) return {status:'counterexample', witness:[a,...group], pairs};
    }
  }
  return {status:'finite-prefix-pass', dimension:d, steps:n, vertices:n+1, forbidden:bounds[d], pairs};
}
// 4D/5D: the paper's return-displacement map. 6D: an illustrative
// real-linear map, NOT an integer projection certified for the infinite walk.
export function shadow(p) {
  if (p.length === 3) return [...p];
  const columns = p.length < 6 ? [[1,0,1],[-1,1,2],[0,-1,3],[-2,0,4],[0,0,0]] :
    [[1,0,0.7],[-0.5,0.866,-0.7],[-0.5,-0.866,0.3],[0.866,0.5,-0.3],[-0.866,0.5,-1],[0,-1,1]];
  return [0,1,2].map(k => p.reduce((sum,x,j) => sum+x*columns[j][k],0));
}
