export function estimate(p1:number, own:number, lucky:boolean) {
 const p2 = own + (lucky ? (45-own)/4 : 0);
 return {p2, weighted:65*p1/105+35*p2/45};
}
export function requiredPaper1(goal:number,own:number,lucky:boolean) {
 const p2=own+(lucky?(45-own)/4:0);
 return Math.max(0,Math.ceil((goal-35*p2/45)*105/65-1e-9));
}
export function requiredOwn(goal:number,p1:number,lucky:boolean) {
 const n=lucky?(goal-65*p1/105-35/45*11.25)/(35/45*.75):(goal-65*p1/105)*45/35;
 return Math.max(0,Math.ceil(n-1e-9));
}
