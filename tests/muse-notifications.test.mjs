import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
function worker() {
 const listeners = {}, shown = [], opened = [], messages = [];
 const scope = { URL, URLSearchParams, Date, console, self: { addEventListener: (name, fn) => listeners[name] = fn, registration: { showNotification: async (title, options) => shown.push({ title, options }) }, location: { origin: 'https://focus.example' }, clients: { matchAll: async () => [], openWindow: async url => opened.push(url) } } };
 scope.globalThis = scope.self;
 scope.importScripts = () => vm.runInNewContext(readFileSync('public/muse-notifications.js','utf8'), scope);
 vm.runInNewContext(readFileSync('public/sw.js','utf8'), scope);
 return { scope, listeners, shown, opened, messages };
}
async function fire(fn, data) { let pending; fn({ ...data, waitUntil: promise => pending = promise }); await pending; }
test('Muse encrypted-payload handling preserves legacy empty FOCUS pushes', async () => {
 const w = worker();
 await fire(w.listeners.push, { data: null });
 assert.equal(w.shown[0].title, 'FOCUS · Session finished');
 await fire(w.listeners.push, { data: { json: () => ({type:'muse',kind:'return',target:'outing-1',tag:'muse-job-1',expiresAt:new Date(Date.now()+60000).toISOString(), personalTitle:'Secret'}) } });
 assert.equal(w.shown[1].title,'Muse');
 assert.ok(w.shown[1].options.body.includes('belongings'));
 assert.equal(w.shown[1].options.data.url,'/#muse?kind=return&target=outing-1');
 assert.ok(!JSON.stringify(w.shown[1]).includes('Secret'));
 assert.equal(w.shown[1].options.renotify,false);
});
test('expired pushes are quiet and never state a stale task is due', async () => {
 const w=worker();
 await fire(w.listeners.push,{ data:{json:()=>({type:'muse',kind:'departure',expiresAt:'2000-01-01T00:00:00Z'})} });
 assert.equal(w.shown[0].options.silent,true);
 assert.equal(w.shown[0].options.body,'Open Muse to review your current reminders.');
});
test('notification click routes only to local Muse or FOCUS',async()=>{
 const w=worker();
 await fire(w.listeners.notificationclick,{notification:{close(){},data:{url:'https://evil.example/'}}});
 assert.equal(w.opened[0],'/');
 await fire(w.listeners.notificationclick,{notification:{close(){},data:{url:'/#muse?kind=task&target=1'}}});
 assert.equal(w.opened[1],'/#muse?kind=task&target=1');
 w.scope.self.clients.matchAll=async()=>[{url:'https://focus.example/',postMessage:x=>w.messages.push(x),focus:async()=>{}}];
 await fire(w.listeners.notificationclick,{notification:{close(){},data:{url:'/#muse?kind=return&target=2'}}});
 assert.equal(w.messages[0].type,'muse-open');
 assert.equal(w.messages[0].hash,'#muse?kind=return&target=2');
});
