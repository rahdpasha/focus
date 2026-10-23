import test from 'node:test'
import assert from 'node:assert/strict'
import { getFocusSummary } from '../src/utils/focusSummary.ts'
const now = new Date(2026,9,23,12)
const base = {id:'one',subjectId:'os',subjectName:'OS',subjectColor:'#24766a',actualDuration:1500,duration:1500,completed:true,completedAt:now,interruptions:0,totalPausedSeconds:0}
test('progress sums completed sessions and excludes cancelled or future weeks', () => {
 const result = getFocusSummary([base,{...base,id:'two',actualDuration:900},{...base,id:'cancelled',completed:false},{...base,id:'future',completedAt:new Date(2026,10,1)}],now)
 assert.equal(result.todayMinutes,40)
 assert.equal(result.todaySessions,2)
 assert.equal(result.weekMinutes,40)
 assert.equal(result.subjects[0].seconds,2400)
 assert.equal(result.days.reduce((n,d)=>n+d.minutes,0),40)
})
test('empty progress is honest and keeps a full seven day chart', () => {
 const result = getFocusSummary([],now)
 assert.equal(result.weekMinutes,0)
 assert.equal(result.days.length,7)
 assert.deepEqual(result.subjects,[])
})
