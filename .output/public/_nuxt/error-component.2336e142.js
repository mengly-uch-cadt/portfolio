import{d as o,_ as c,o as f,c as g,n as E,g as k,u as r}from"./entry.52bca07b.js";const P={__name:"nuxt-error-page",props:{error:Object},setup(t){var n;(t.error.stack||"").split(`
`).splice(1).map(e=>({text:e.replace("webpack:/","").replace(".vue",".js").trim(),internal:e.includes("node_modules")&&!e.includes(".cache")||e.includes("internal")||e.includes("new Promise")})).map(e=>`<span class="stack${e.internal?" internal":""}">${e.text}</span>`).join(`
`);const s=Number(t.error.statusCode||500),a=s===404,u=(n=t.error.statusMessage)!=null?n:a?"Page Not Found":"Internal Server Error",i=t.error.message||t.error.toString(),d=void 0,l=o(()=>c(()=>import("./error-404.86322d9d.js"),["./error-404.86322d9d.js","./entry.52bca07b.js","./entry.1df28302.css","./composables.fb5eb5d1.js","./error-404.23f2309d.css"],import.meta.url).then(e=>e.default||e)),m=o(()=>c(()=>import("./error-500.002bde84.js"),["./error-500.002bde84.js","./composables.fb5eb5d1.js","./entry.52bca07b.js","./entry.1df28302.css","./error-500.aa16ed4d.css"],import.meta.url).then(e=>e.default||e)),p=a?l:m;return(e,_)=>(f(),g(r(p),E(k({statusCode:r(s),statusMessage:r(u),description:r(i),stack:r(d)})),null,16))}},x=P;export{x as default};