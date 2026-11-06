// Contrôles statiques locaux, sans identifiants ni accès réseau.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(__dirname + "/../private-media-adapter.js","utf8");
const sandbox = { window: {} };
vm.runInNewContext(source,sandbox);
const api = sandbox.window.RebondPrivateMedia;
assert.equal(api.pathFor("pagevideo/Angie_emprise1.mp4"),"pagevideo/Angie_emprise1.mp4");
assert.equal(api.pathFor("pagevideo/animations/Stratégie de l'agresseur.mp4"),"pagevideo/animations/strategie_de_l_agresseur.mp4");
assert.equal(api.pathFor("pagevideo/animations/Signaler n'est pas dénoncer.mp4"),"pagevideo/animations/signaler_nest_pas_denoncer.mp4");
assert.throws(()=>api.pathFor("../secret"));
assert.throws(()=>api.pathFor("https://example.com/video.mp4"));
assert.equal(api.pathFor("pagevideo/animations/Stratégie de l'agresseur.mp4"),"pagevideo/animations/strategie_de_l_agresseur.mp4");
assert.equal(api.pathFor("pagevideo/animations/Signaler n'est pas dénoncer.mp4"),"pagevideo/animations/signaler_nest_pas_denoncer.mp4");
assert.throws(()=>api.pathFor("pagevideo/%2e%2e/secret.mp4"));
console.log("8 contrôles statiques réussis.");
