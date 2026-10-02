import { readFileSync } from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
async function module(path){const {outputText}=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);}
const {estimate,requiredPaper1,requiredOwn}=await module('app/scoring.ts');
const {topics,p2Map2024,p2Map2025}=await module('app/data.ts');
assert.equal(new Set(topics.map(t=>t.id)).size,topics.length);
for(const map of [p2Map2024,p2Map2025]){assert.equal(map.length,45);for(const id of map)assert.ok(topics.some(t=>t.id===id));}
for(const t of topics)if(t.prerequisite){const pre=topics.find(x=>x.id===t.prerequisite);assert.ok(pre);assert.ok(pre.stage<=t.stage);}
assert.equal(estimate(0,0,false).weighted,0);
assert.equal(estimate(105,45,true).weighted,100);
assert.equal(estimate(105,45,false).weighted,100);
assert.equal(estimate(40,10,true).p2,18.75);
assert.ok(Math.abs(estimate(40,10,true).weighted-39.345238095238095)<1e-8);
assert.equal(requiredPaper1(50,10,true),58);
assert.equal(requiredPaper1(65,10,true),82);
for(const lucky of [true,false])for(const goal of [30,40,50,60,65,80,90]){
 for(let own=0;own<=45;own++){const n=requiredPaper1(goal,own,lucky);if(n<=105){assert.ok(estimate(n,own,lucky).weighted>=goal-1e-8);if(n>0)assert.ok(estimate(n-1,own,lucky).weighted<goal);}else assert.ok(estimate(105,own,lucky).weighted<goal);}
 for(let p1=0;p1<=105;p1++){const n=requiredOwn(goal,p1,lucky);if(n<=45){assert.ok(estimate(p1,n,lucky).weighted>=goal-1e-8);if(n>0)assert.ok(estimate(p1,n-1,lucky).weighted<goal);}else assert.ok(estimate(p1,45,lucky).weighted<goal);}
}
console.log(`Validated ${topics.length} topics, 90 MC references, score examples and minimum-score boundaries.`);
