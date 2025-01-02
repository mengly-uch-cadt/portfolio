globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import 'node-fetch-native/polyfill';
import { Server as Server$1 } from 'http';
import { Server } from 'https';
import destr from 'destr';
import { withoutTrailingSlash, getQuery as getQuery$1, parseURL, withQuery, joinURL, withLeadingSlash } from 'ufo';
import { createFetch as createFetch$1, Headers } from 'ofetch';
import { createCall, createFetch } from 'unenv/runtime/fetch/index';
import { createHooks } from 'hookable';
import { snakeCase } from 'scule';
import { hash } from 'ohash';
import { createStorage } from 'unstorage';
import defu from 'defu';
import { promises } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'pathe';

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode !== void 0) {
      node = nextNode;
    } else {
      node = node.placeholderChildNode;
      if (node !== null) {
        params[node.paramName] = section;
        paramsFound = true;
      } else {
        break;
      }
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildNode = childNode;
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.substring(3) || "_";
        isStaticRoute = false;
      }
      node = childNode;
    }
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections[sections.length - 1];
    node.data = null;
    if (Object.keys(node.children).length === 0) {
      const parentNode = node.parent;
      delete parentNode[lastSection];
      parentNode.wildcardChildNode = null;
      parentNode.placeholderChildNode = null;
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildNode: null
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table);
}
function _createMatcher(table) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table) {
  const matches = [];
  for (const [key, value] of table.wildcard) {
    if (path.startsWith(key)) {
      matches.push(value);
    }
  }
  for (const [key, value] of table.dynamic) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.substring(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        table.static.set(path, node.data);
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

class H3Error extends Error {
  constructor() {
    super(...arguments);
    this.statusCode = 500;
    this.fatal = false;
    this.unhandled = false;
    this.statusMessage = void 0;
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: this.statusCode
    };
    if (this.statusMessage) {
      obj.statusMessage = this.statusMessage;
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
H3Error.__h3_error__ = true;
function createError(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(
    input.message ?? input.statusMessage,
    input.cause ? { cause: input.cause } : void 0
  );
  if ("stack" in input) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = input.statusCode;
  } else if (input.status) {
    err.statusCode = input.status;
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.node.res.writableEnded) {
    return;
  }
  const h3Error = isError(error) ? error : createError(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.node.res.writableEnded) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  if (_code) {
    event.node.res.statusCode = _code;
  }
  if (h3Error.statusMessage) {
    event.node.res.statusMessage = h3Error.statusMessage;
  }
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}

function getQuery(event) {
  return getQuery$1(event.node.req.url || "");
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= opts.modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    event.node.res.end();
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const defer = typeof setImmediate !== "undefined" ? setImmediate : (fn) => fn();
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      event.node.res.end(data);
      resolve();
    });
  });
}
function defaultContentType(event, type) {
  if (type && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = code;
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(name, value);
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
function isStream(data) {
  return data && typeof data === "object" && typeof data.pipe === "function" && typeof data.on === "function";
}
function sendStream(event, data) {
  return new Promise((resolve, reject) => {
    data.pipe(event.node.res);
    data.on("end", () => resolve());
    data.on("error", (error) => reject(createError(error)));
  });
}

class H3Headers {
  constructor(init) {
    if (!init) {
      this._headers = {};
    } else if (Array.isArray(init)) {
      this._headers = Object.fromEntries(
        init.map(([key, value]) => [key.toLowerCase(), value])
      );
    } else if (init && "append" in init) {
      this._headers = Object.fromEntries(init.entries());
    } else {
      this._headers = Object.fromEntries(
        Object.entries(init).map(([key, value]) => [key.toLowerCase(), value])
      );
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  entries() {
    throw Object.entries(this._headers)[Symbol.iterator]();
  }
  keys() {
    return Object.keys(this._headers)[Symbol.iterator]();
  }
  values() {
    throw Object.values(this._headers)[Symbol.iterator]();
  }
  append(name, value) {
    const _name = name.toLowerCase();
    this.set(_name, [this.get(_name), value].filter(Boolean).join(", "));
  }
  delete(name) {
    delete this._headers[name.toLowerCase()];
  }
  get(name) {
    return this._headers[name.toLowerCase()];
  }
  has(name) {
    return name.toLowerCase() in this._headers;
  }
  set(name, value) {
    this._headers[name.toLowerCase()] = String(value);
  }
  forEach(callbackfn) {
    for (const [key, value] of Object.entries(this._headers)) {
      callbackfn(value, key, this);
    }
  }
}

class H3Response {
  constructor(body = null, init = {}) {
    this.body = null;
    this.type = "default";
    this.bodyUsed = false;
    this.headers = new H3Headers(init.headers);
    this.status = init.status ?? 200;
    this.statusText = init.statusText || "";
    this.redirected = !!init.status && [301, 302, 307, 308].includes(init.status);
    this._body = body;
    this.url = "";
    this.ok = this.status < 300 && this.status > 199;
  }
  clone() {
    return new H3Response(this.body, {
      headers: this.headers,
      status: this.status,
      statusText: this.statusText
    });
  }
  arrayBuffer() {
    return Promise.resolve(this._body);
  }
  blob() {
    return Promise.resolve(this._body);
  }
  formData() {
    return Promise.resolve(this._body);
  }
  json() {
    return Promise.resolve(this._body);
  }
  text() {
    return Promise.resolve(this._body);
  }
}

class H3Event {
  constructor(req, res) {
    this["__is_event__"] = true;
    this.context = {};
    this.node = { req, res };
  }
  get path() {
    return this.req.url;
  }
  get req() {
    return this.node.req;
  }
  get res() {
    return this.node.res;
  }
  respondWith(r) {
    Promise.resolve(r).then((_response) => {
      if (this.res.writableEnded) {
        return;
      }
      const response = _response instanceof H3Response ? _response : new H3Response(_response);
      for (const [key, value] of response.headers.entries()) {
        this.res.setHeader(key, value);
      }
      if (response.status) {
        this.res.statusCode = response.status;
      }
      if (response.statusText) {
        this.res.statusMessage = response.statusText;
      }
      if (response.redirected) {
        this.res.setHeader("location", response.url);
      }
      if (!response._body) {
        return this.res.end();
      }
      if (typeof response._body === "string" || "buffer" in response._body || "byteLength" in response._body) {
        return this.res.end(response._body);
      }
      if (!response.headers.has("content-type")) {
        response.headers.set("content-type", MIMES.json);
      }
      this.res.end(JSON.stringify(response._body));
    });
  }
}
function createEvent(req, res) {
  return new H3Event(req, res);
}

function defineEventHandler(handler) {
  handler.__is_handler__ = true;
  return handler;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return "__is_handler__" in input;
}
function toEventHandler(input, _, _route) {
  if (!isEventHandler(input)) {
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? `
     Route: ${_route}` : "",
      `
     Handler: ${input}`
    );
  }
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler = r.default || r;
        if (typeof handler !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler
          );
        }
        _resolved = toEventHandler(r.default || r);
        return _resolved;
      });
    }
    return _promise;
  };
  return eventHandler((event) => {
    if (_resolved) {
      return _resolved(event);
    }
    return resolveHandler().then((handler) => handler(event));
  });
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const app = {
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    handler,
    stack,
    options
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(
      normalizeLayer({ ...arg2, route: "/", handler: arg1 })
    );
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const reqUrl = event.node.req.url || "/";
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!reqUrl.startsWith(layer.route)) {
          continue;
        }
        event.node.req.url = reqUrl.slice(layer.route.length) || "/";
      } else {
        event.node.req.url = reqUrl;
      }
      if (layer.match && !layer.match(event.node.req.url, event)) {
        continue;
      }
      const val = await layer.handler(event);
      if (event.node.res.writableEnded) {
        return;
      }
      const type = typeof val;
      if (type === "string") {
        return send(event, val, MIMES.html);
      } else if (isStream(val)) {
        return sendStream(event, val);
      } else if (val === null) {
        event.node.res.statusCode = 204;
        return send(event);
      } else if (type === "object" || type === "boolean" || type === "number") {
        if (val.buffer) {
          return send(event, val);
        } else if (val instanceof Error) {
          throw createError(val);
        } else {
          return send(
            event,
            JSON.stringify(val, void 0, spacing),
            MIMES.json
          );
        }
      }
    }
    if (!event.node.res.writableEnded) {
      throw createError({
        statusCode: 404,
        statusMessage: `Cannot find any route matching ${event.node.req.url || "/"}.`
      });
    }
  });
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      if (app.options.onError) {
        await app.options.onError(error, event);
      } else {
        if (error.unhandled || error.fatal) {
          console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
        }
        await sendError(event, error, !!app.options.debug);
      }
    }
  };
  return toNodeHandle;
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler, void 0, path);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  router.handler = eventHandler((event) => {
    let path = event.node.req.url || "/";
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      if (opts.preemptive || opts.preemtive) {
        throw createError({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${event.node.req.url || "/"}.`
        });
      } else {
        return;
      }
    }
    const method = (event.node.req.method || "get").toLowerCase();
    const handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      throw createError({
        statusCode: 405,
        name: "Method Not Allowed",
        statusMessage: `Method ${method} is not allowed on this route.`
      });
    }
    const params = matched.params || {};
    event.context.params = params;
    return handler(event);
  });
  return router;
}

const _runtimeConfig = {"app":{"baseURL":"/","buildAssetsDir":"/_nuxt/","cdnURL":""},"nitro":{"routeRules":{"/__nuxt_error":{"cache":false}},"envPrefix":"NUXT_"},"public":{"apiBase":"/api","dev":{"name":"Uch Mengly","logo_name":"uch-mengly","role":"Full-Stack/Flutter developer","about":{"sections":{"professional-info":{"title":"professional-info","icon":"icons/info-professional.svg","info":{"experience":{"title":"experience","description":"<br>As a passionate and dedicated Computer Science student, I am continuously expanding my technical skill set through hands-on experience and academic learning. I have developed expertise in full-stack development, including backend technologies like Laravel and mobile development with Flutter. I am also honing my data science and analytics skills, working with tools like Python, SQL, and PowerBI to extract actionable insights from data. My experiences include participating in competitive events like MakerThon 2024, where I demonstrated problemsolving and innovation. With a strong foundation in software development and data analytics, I am committed to applying my knowledge to real-world challenges and continuously growing my technical capabilities."},"hard-skills":{"title":"hard-skills","description":"<br>I possess strong technical skills in Flutter, Dart, PHP, Laravel, MySQL, SQL, Firebase, NuxtJs, and VueJs, which I have utilized in various development projects. Additionally, I have experience with Git for version control and proficiency in C++ and Python for software development. My expertise in HTML and CSS allows me to design and build responsive and user-friendly web interfaces. I am also adept in problem solving, effective communication, and teamwork, ensuring seamless collaboration in development projects. These skills enable me to tackle complex challenges and contribute to successful project outcomes."},"soft-skills":{"title":"soft-skills","description":"<br>I have strong communication skills, enabling effective collaboration and clear idea sharing. I excel in teamwork, problem-solving, and adaptability, allowing me to tackle challenges and work efficiently in dynamic environments. My time management ensures deadlines are met, while my leadership skills help guide and motivate others. I also possess critical thinking abilities and conflict resolution skills, ensuring smooth team dynamics and informed decision-making. These soft skills complement my technical expertise and enhance my contributions to any project."}}},"personal-info":{"title":"personal-info","icon":"icons/info-personal.svg","info":{"bio":{"title":"bio","description":"<br><b style=\"color: #43D9AD;\">My Bio</b><br>I am a third-year Computer Science student with a passion for technology and a strong foundation in various programming languages and frameworks. Throughout my academic journey, I’ve worked on eLearning projects using Laravel, Nuxt, and Flutter for mobile app development. My learning journey is fueled by a continuous desire to explore new technologies, and I enjoy solving complex problems while collaborating with others. In addition to my technical skills, I focus on enhancing my leadership, communication, and teamwork abilities to contribute to meaningful projects and grow both professionally and personally."},"interests":{"title":"interests","description":"<br><b style=\"color: #43D9AD;\">My Interests</b><br>I have a strong interest in technology and software development, particularly in areas like mobile app development, cloud computing, and web technologies. I am excited about exploring new tools and frameworks that can enhance my development skills and broaden my understanding of different platforms. Additionally, I’m passionate about solving real-world problems through programming, whether that’s building innovative applications or optimizing processes. I also enjoy learning about new trends in tech, contributing to open-source projects, and collaborating with like-minded individuals to create impactful solutions. My interest in continuous learning drives me to stay up-to-date with the latest developments in the tech industry."},"education":{"title":"education","description":"<br><b style=\"color: #43D9AD;\">Software Engineering - Cambodia Academy of Digital Technology</b> <br> I am currently pursuing a Bachelor’s degree in Computer Science at CADT, where I am gaining a solid foundation in both theoretical and practical aspects of computing. The program has equipped me with essential skills in software development, data structures, algorithms, database management, and various programming languages. At CADT, I have had the opportunity to work on diverse projects, which have enhanced my problem-solving abilities and technical knowledge. The curriculum also allows me to explore emerging technologies, preparing me for a career in the ever-evolving tech industry. I am committed to applying the knowledge I acquire in my academic journey to real-world challenges.<br><br><b style=\"color: #43D9AD;\">Up Skilling - TUX Global Institute</b><br>I am currently upskilling in Data Science at TUX, where I am deepening my knowledge of data analysis, machine learning, and statistical methods. This program allows me to work with tools and frameworks that are essential for processing and analyzing large datasets, as well as developing predictive models. Through hands-on projects and practical experience, I am enhancing my ability to derive insights from data and solve complex problems. This upskilling experience is helping me bridge the gap between my existing technical skills and the growing demand for data-driven decision-making in various industries."}}},"hobbies-info":{"title":"hobbies-info","icon":"icons/info-hobbies.svg","info":{"sports":{"title":"sports","description":"<br>I have a strong passion for sports and outdoor activities, which are essential for keeping me active and energized. Badminton is one of my favorite sports, as it combines quick reflexes, strategic thinking, and the thrill of competition. I enjoy the fast pace of the game and the way it challenges my agility and coordination. Jogging and cycling are also part of my routine, helping me build endurance and explore my surroundings while staying fit. Additionally, I love hiking, as it allows me to connect with nature and enjoy breathtaking views while challenging myself physically. These activities not only contribute to my physical health but also strengthen my discipline, resilience, and focus, which positively impact other areas of my life."},"favorite-games":{"title":"favorite-games","description":"<br>I enjoy playing a variety of games that challenge my mind and help me develop strategic thinking. For example, I love playing **Sudoku**, which sharpens my logical reasoning and attention to detail. **Crossword puzzles** are another favorite, allowing me to expand my vocabulary while solving complex clues. I also enjoy strategy board games like **Catan** and **Ticket to Ride**, where I can plan, negotiate, and make tactical decisions with friends. **Card games** such as **Rummy** provide a mix of luck and strategy, offering an exciting and competitive experience. Additionally, I enjoy playing **strategy video games** like **Civilization**, where I manage resources and make decisions to build and grow empires. These games not only entertain me but also enhance my problem-solving skills and critical thinking abilities."}}}}},"contacts":{"direct":{"title":"contacts","sources":{"email":"menglyuch.personal@gmail.com","phone":"+855 96 999 4954","telegram":"@MenglyUch"}},"social":{"github":{"title":"Github profile","url":"https://github.com/","user":"Uch Mengly"},"facebook":{"title":"Facebook profile","url":"https://facebook.com/","user":"username"},"twitter":{"title":"Twitter account","url":"https://twitter.com/","user":"username"}},"find_me_also_in":{"title":"find-me-also-in","sources":{"youtube":{"title":"YouTube channel","url":"https://www.youtube.com/@mengly8612","user":"Meng Ly"},"GitHub":{"title":"Github profile","url":"https://github.com/mengly-uch-cadt","user":"Uch Mengly"},"LinkedIn":{"title":"LinkedIn profile","url":"https://www.linkedin.com/in/mengly-uch-663422242/","user":"Mengly Uch"}}}},"projects":{"1":{"title":"Elearning Website","description":"The <b style=\"color: #43D9AD;\">E-Learning Platform</b> is designed to provide a flexible and engaging educational experience, allowing learners to access high-quality courses and resources from anywhere at any time. The platform aims to cater to diverse learner needs, promote skill development, and encourage continuous education by integrating interactive tools, multimedia content, and personalized learning pathways. It also serves as a digital hub for fostering collaboration among students, educators, and professionals, creating a vibrant community dedicated to knowledge sharing and growth. Ultimately, the platform supports the organization’s mission to make education more accessible, inclusive, and impactful.","img":"/images/projects/elearning-website.png","tech":["Nuxt"],"web_url":"https://elearning-dev.tgi.asia","youtube":"https://youtu.be/8mqGv39PSjo"},"2":{"title":"Elearning Admin Portal","description":"The <b style=\"color: #43D9AD;\">Admin Portal</b> serves as the central hub for managing and monitoring the e-learning platform. It provides administrators with tools to oversee course content, user engagement, performance analytics, and platform settings. The portal ensures smooth operations by enabling efficient management of users, courses, assessments, and resources, contributing to an optimal learning experience.","img":"/images/projects/elearning-admin-portal.png","tech":["Nuxt"],"web_url":"https://elearning-portal-dev.tgi.asia","youtube":"https://youtu.be/7B2T9tTdbxY"},"3":{"title":"Elearning Backend","description":"The <b style=\"color: #43D9AD;\">E-Learning Backend</b> powers user management, course delivery, and progress tracking with secure APIs, role-based access and ensuring a seamless and scalable learning experience.","img":"/images/projects/elearning-backend.png","tech":["Laravel","MySQL","PHP"]},"4":{"title":"Elearning Mobile App","description":"The <b style=\"color: #43D9AD;\">E-Learning Mobile Platform</b> offers a flexible, engaging educational experience, enabling learners to access courses and resources anytime, anywhere via their mobile devices. Designed for diverse needs, it promotes skill development and collaboration through interactive tools and personalized learning pathways, making education more accessible and impactful.","img":"/images/projects/elearning-mobile-app.jpg","tech":["Flutter","Dart","Firebase"],"youtube":"https://youtube.com/shorts/LsxYzSBWMiA?feature=share"},"5":{"title":"Event Management Mobile App","description":"This project is a comprehensive <b style=\"color: #43D9AD;\">Event Management</b> platform designed to streamline the process of creating, managing, and participating in events. It features user registration, event creation with customizable settings, calendar integration for easy viewing, and real-time notifications to keep users updated. Optional advanced features like chat functionality and QR code check-ins enhance the user experience, making it a modern solution for personal or professional event coordination.","img":"/images/projects/event-management.png","tech":["Flutter","Dart","Firebase"],"git_url":"https://github.com/mengly-uch-cadt/Moon-Event-Flutter","youtube":"https://youtu.be/eHWAycd1ewU"},"6":{"title":"Khmer Ticket","description":"<b style=\"color: #43D9AD;\">Khmer Ticket</b> is a simple and efficient platform for booking bus and van tickets, allowing users to search schedules, select seats, and reserve tickets with ease.","img":"/images/projects/khmerticket.png","tech":["PHP","MySQL","HTML","CSS","JavaScript"]},"7":{"title":"Route Finder Cambodia Map","description":"This is a <b style=\"color: #43D9AD;\">route-finding</b> application for a Cambodia map that enables users to search for routes by selecting a province, district, and commune as the source and target locations. The system leverages AI algorithms such as Breadth-First Search (BFS), Depth-Bounded First Search (DBFS), Greedy Best-First Search (GBFS), and A* (A-star) to calculate the optimal route. It displays the calculated path on the map, the total distance, the straight-line distance, and a detailed list of the nodes (locations) in the route.Team member of 3 people in this project. Uch Mengly, Chea Veasna and Siv SreyNoch.","img":"/images/projects/cambodia-map.png","tech":["AI","Django","HTML","CSS","JavaScript"],"git_url":"https://github.com/mengly-uch-cadt/Cambodia-Map","youtube":"https://youtu.be/jflbxw4njH8"},"8":{"title":"Charity Donation Backend","description":"The backend of Empower Change serves as the foundation for secure, scalable, and efficient data management. It provides administrators with a powerful control panel to manage users, projects, and donations.  Integrated with trusted payment gateways  the backend ensures seamless transaction processing. Built with scalability in mind, it is capable of handling increased traffic and data demands as the platform grows, ensuring a smooth experience for all stakeholders.","img":"/images/projects/charity-backend.jpg","tech":["Laravel","MySQL","HTML","CSS","JavaScript"],"git_url":"https://github.com/mengly-uch-cadt/Charity-Backend","youtube":"https://youtu.be/CJrYf7EFQPE"},"9":{"title":"Charity Donation Frontend","description":"The frontend of the Empower Change platform is designed to deliver an intuitive and engaging user experience, making it easy for donors and project hosts to interact with the platform. Donors can browse projects, make secure contributions, and track their impact through personalized progress, ","img":"/images/projects/charity-frontend.jpg","tech":["Vue","HTML","CSS","JavaScript"],"git_url":"https://github.com/mengly-uch-cadt/Charity-Frontend","youtube":"https://youtu.be/CJrYf7EFQPE"}}}},"apiSecret":"123"};
const ENV_PREFIX = "NITRO_";
const ENV_PREFIX_ALT = _runtimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_";
const getEnv = (key) => {
  const envKey = snakeCase(key).toUpperCase();
  return destr(process.env[ENV_PREFIX + envKey] ?? process.env[ENV_PREFIX_ALT + envKey]);
};
function isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function overrideConfig(obj, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey);
    if (isObject(obj[key])) {
      if (isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
      }
      overrideConfig(obj[key], subKey);
    } else {
      obj[key] = envValue ?? obj[key];
    }
  }
}
overrideConfig(_runtimeConfig);
const config$1 = deepFreeze(_runtimeConfig);
const useRuntimeConfig = () => config$1;
function deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

const globalTiming = globalThis.__timing__ || {
  start: () => 0,
  end: () => 0,
  metrics: []
};
const timingMiddleware = eventHandler((event) => {
  const start = globalTiming.start();
  const _end = event.res.end;
  event.res.end = function(chunk, encoding, cb) {
    const metrics = [["Generate", globalTiming.end(start)], ...globalTiming.metrics];
    const serverTiming = metrics.map((m) => `-;dur=${m[1]};desc="${encodeURIComponent(m[0])}"`).join(", ");
    if (!event.res.headersSent) {
      event.res.setHeader("Server-Timing", serverTiming);
    }
    _end.call(event.res, chunk, encoding, cb);
    return this;
  }.bind(event.res);
});

const _assets = {

};

function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
}

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

const storage = createStorage({});

const useStorage = () => storage;

storage.mount('/assets', assets$1);

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(createRouter$1({ routes: config.nitro.routeRules }));
function createRouteRulesHandler() {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      return sendRedirect(event, routeRules.redirect.to, routeRules.redirect.statusCode);
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    const path = new URL(event.req.url, "http://localhost").pathname;
    event.context._nitro.routeRules = getRouteRulesForPath(path);
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

const defaultCacheOptions = {
  name: "_",
  base: "/cache",
  swr: true,
  maxAge: 1
};
function defineCachedFunction(fn, opts) {
  opts = { ...defaultCacheOptions, ...opts };
  const pending = {};
  const group = opts.group || "nitro";
  const name = opts.name || fn.name || "_";
  const integrity = hash([opts.integrity, fn, opts]);
  const validate = opts.validate || (() => true);
  async function get(key, resolver) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    const entry = await useStorage().getItem(cacheKey) || {};
    const ttl = (opts.maxAge ?? opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || !validate(entry);
    const _resolve = async () => {
      if (!pending[key]) {
        entry.value = void 0;
        entry.integrity = void 0;
        entry.mtime = void 0;
        entry.expires = void 0;
        pending[key] = Promise.resolve(resolver());
      }
      entry.value = await pending[key];
      entry.mtime = Date.now();
      entry.integrity = integrity;
      delete pending[key];
      if (validate(entry)) {
        useStorage().setItem(cacheKey, entry).catch((error) => console.error("[nitro] [cache]", error));
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (opts.swr && entry.value) {
      _resolvePromise.catch(console.error);
      return Promise.resolve(entry);
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const key = (opts.getKey || getKey)(...args);
    const entry = await get(key, () => fn(...args));
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
const cachedFunction = defineCachedFunction;
function getKey(...args) {
  return args.length ? hash(args, {}) : "";
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions) {
  const _opts = {
    ...opts,
    getKey: (event) => {
      const url = event.req.originalUrl || event.req.url;
      const friendlyName = decodeURI(parseURL(url).pathname).replace(/[^a-zA-Z0-9]/g, "").substring(0, 16);
      const urlHash = hash(url);
      return `${friendlyName}.${urlHash}`;
    },
    validate: (entry) => {
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: [
      opts.integrity,
      handler
    ]
  };
  const _cachedHandler = cachedFunction(async (incomingEvent) => {
    const reqProxy = cloneWithProxy(incomingEvent.req, { headers: {} });
    const resHeaders = {};
    let _resSendBody;
    const resProxy = cloneWithProxy(incomingEvent.res, {
      statusCode: 200,
      getHeader(name) {
        return resHeaders[name];
      },
      setHeader(name, value) {
        resHeaders[name] = value;
        return this;
      },
      getHeaderNames() {
        return Object.keys(resHeaders);
      },
      hasHeader(name) {
        return name in resHeaders;
      },
      removeHeader(name) {
        delete resHeaders[name];
      },
      getHeaders() {
        return resHeaders;
      },
      end(chunk, arg2, arg3) {
        if (typeof chunk === "string") {
          _resSendBody = chunk;
        }
        if (typeof arg2 === "function") {
          arg2();
        }
        if (typeof arg3 === "function") {
          arg3();
        }
        return this;
      },
      write(chunk, arg2, arg3) {
        if (typeof chunk === "string") {
          _resSendBody = chunk;
        }
        if (typeof arg2 === "function") {
          arg2();
        }
        if (typeof arg3 === "function") {
          arg3();
        }
        return this;
      },
      writeHead(statusCode, headers2) {
        this.statusCode = statusCode;
        if (headers2) {
          for (const header in headers2) {
            this.setHeader(header, headers2[header]);
          }
        }
        return this;
      }
    });
    const event = createEvent(reqProxy, resProxy);
    event.context = incomingEvent.context;
    const body = await handler(event) || _resSendBody;
    const headers = event.res.getHeaders();
    headers.etag = headers.Etag || headers.etag || `W/"${hash(body)}"`;
    headers["last-modified"] = headers["Last-Modified"] || headers["last-modified"] || new Date().toUTCString();
    const cacheControl = [];
    if (opts.swr) {
      if (opts.maxAge) {
        cacheControl.push(`s-maxage=${opts.maxAge}`);
      }
      if (opts.staleMaxAge) {
        cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
      } else {
        cacheControl.push("stale-while-revalidate");
      }
    } else if (opts.maxAge) {
      cacheControl.push(`max-age=${opts.maxAge}`);
    }
    if (cacheControl.length) {
      headers["cache-control"] = cacheControl.join(", ");
    }
    const cacheEntry = {
      code: event.res.statusCode,
      headers,
      body
    };
    return cacheEntry;
  }, _opts);
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(event);
    if (event.res.headersSent || event.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.res.statusCode = response.code;
    for (const name in response.headers) {
      event.res.setHeader(name, response.headers[name]);
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const plugins = [
  
];

function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}
function isJsonRequest(event) {
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || event.req.url?.endsWith(".json") || event.req.url?.includes("/api/");
}
function normalizeError(error) {
  const cwd = process.cwd();
  const stack = (error.stack || "").split("\n").splice(1).filter((line) => line.includes("at ")).map((line) => {
    const text = line.replace(cwd + "/", "./").replace("webpack:/", "").replace("file://", "").trim();
    return {
      text,
      internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
    };
  });
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage ?? (statusCode === 404 ? "Not Found" : "");
  const message = error.message || error.toString();
  return {
    stack,
    statusCode,
    statusMessage,
    message
  };
}

const errorHandler = (async function errorhandler(error, event) {
  const { stack, statusCode, statusMessage, message } = normalizeError(error);
  const errorObject = {
    url: event.node.req.url,
    statusCode,
    statusMessage,
    message,
    stack: "",
    data: error.data
  };
  event.node.res.statusCode = errorObject.statusCode !== 200 && errorObject.statusCode || 500;
  if (errorObject.statusMessage) {
    event.node.res.statusMessage = errorObject.statusMessage;
  }
  if (error.unhandled || error.fatal) {
    const tags = [
      "[nuxt]",
      "[request error]",
      error.unhandled && "[unhandled]",
      error.fatal && "[fatal]",
      Number(errorObject.statusCode) !== 200 && `[${errorObject.statusCode}]`
    ].filter(Boolean).join(" ");
    console.error(tags, errorObject.message + "\n" + stack.map((l) => "  " + l.text).join("  \n"));
  }
  if (isJsonRequest(event)) {
    event.node.res.setHeader("Content-Type", "application/json");
    event.node.res.end(JSON.stringify(errorObject));
    return;
  }
  const isErrorPage = event.node.req.url?.startsWith("/__nuxt_error");
  const res = !isErrorPage ? await useNitroApp().localFetch(withQuery(joinURL(useRuntimeConfig().app.baseURL, "/__nuxt_error"), errorObject), {
    headers: getRequestHeaders(event),
    redirect: "manual"
  }).catch(() => null) : null;
  if (!res) {
    const { template } = await import('./error-500.mjs');
    event.node.res.setHeader("Content-Type", "text/html;charset=UTF-8");
    event.node.res.end(template(errorObject));
    return;
  }
  for (const [header, value] of res.headers.entries()) {
    setResponseHeader(event, header, value);
  }
  if (res.status && res.status !== 200) {
    event.node.res.statusCode = res.status;
  }
  if (res.statusText) {
    event.node.res.statusMessage = res.statusText;
  }
  event.node.res.end(await res.text());
});

const assets = {
  "/demo-share.jpg": {
    "type": "image/jpeg",
    "etag": "\"1788c-/Jkr0WvVnoFS9xeJzZzelEARy4c\"",
    "mtime": "2024-12-31T14:23:05.717Z",
    "size": 96396,
    "path": "../public/demo-share.jpg"
  },
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": "\"8ae6-ejR/vzyddXQO8cvdSgrtZnqVL0A\"",
    "mtime": "2024-12-31T14:23:05.717Z",
    "size": 35558,
    "path": "../public/favicon.ico"
  },
  "/logo.png": {
    "type": "image/png",
    "etag": "\"21c38-S1vIICQDPW005ZQ5O2iSk2i//dM\"",
    "mtime": "2024-12-31T14:23:05.774Z",
    "size": 138296,
    "path": "../public/logo.png"
  },
  "/README.md": {
    "type": "text/markdown; charset=utf-8",
    "etag": "\"1ee-4v8O3SpixpI+K4o9jLYjkPmH2Ss\"",
    "mtime": "2024-12-31T14:23:05.717Z",
    "size": 494,
    "path": "../public/README.md"
  },
  "/worker.js": {
    "type": "application/javascript",
    "etag": "\"2bb-1NMNUQ3FvwfSOHcB6egEbaAHxw0\"",
    "mtime": "2024-12-31T14:23:05.779Z",
    "size": 699,
    "path": "../public/worker.js"
  },
  "/icons/arrow-button.svg": {
    "type": "image/svg+xml",
    "etag": "\"b8-OTecWE3mEy4hYYxvIN+4wf2RclE\"",
    "mtime": "2024-12-31T14:23:05.719Z",
    "size": 184,
    "path": "../public/icons/arrow-button.svg"
  },
  "/icons/arrow-down.svg": {
    "type": "image/svg+xml",
    "etag": "\"be-kZSoF/lSQhL6/yLPbsCf9KFPgVs\"",
    "mtime": "2024-12-31T14:23:05.720Z",
    "size": 190,
    "path": "../public/icons/arrow-down.svg"
  },
  "/icons/arrow.svg": {
    "type": "image/svg+xml",
    "etag": "\"b6-yrPkTanmJq0Dx12CZEp2XgmfsL8\"",
    "mtime": "2024-12-31T14:23:05.720Z",
    "size": 182,
    "path": "../public/icons/arrow.svg"
  },
  "/icons/burger-close.svg": {
    "type": "image/svg+xml",
    "etag": "\"104-S2/Ft0twJBw9CiTHlAwyvb/r8iA\"",
    "mtime": "2024-12-31T14:23:05.720Z",
    "size": 260,
    "path": "../public/icons/burger-close.svg"
  },
  "/icons/burger.svg": {
    "type": "image/svg+xml",
    "etag": "\"b3-e4SyVlNGhSShL5xjfrHnZRG+4VQ\"",
    "mtime": "2024-12-31T14:23:05.721Z",
    "size": 179,
    "path": "../public/icons/burger.svg"
  },
  "/icons/check.svg": {
    "type": "image/svg+xml",
    "etag": "\"f5-VnzkxnVBhyzx7H9yjYqTHEBxc24\"",
    "mtime": "2024-12-31T14:23:05.721Z",
    "size": 245,
    "path": "../public/icons/check.svg"
  },
  "/icons/close.svg": {
    "type": "image/svg+xml",
    "etag": "\"215-1tKNzOBRLihmEC+C4j7hGu5XoAs\"",
    "mtime": "2024-12-31T14:23:05.721Z",
    "size": 533,
    "path": "../public/icons/close.svg"
  },
  "/icons/diple.svg": {
    "type": "image/svg+xml",
    "etag": "\"f7-VUpSuv/WPOUXz0CmclbZQG2aIOc\"",
    "mtime": "2024-12-31T14:23:05.724Z",
    "size": 247,
    "path": "../public/icons/diple.svg"
  },
  "/icons/email.svg": {
    "type": "image/svg+xml",
    "etag": "\"29a-AHpg2LgMyx7fwZEyJ3fZsWj++2w\"",
    "mtime": "2024-12-31T14:23:05.724Z",
    "size": 666,
    "path": "../public/icons/email.svg"
  },
  "/icons/folder.svg": {
    "type": "image/svg+xml",
    "etag": "\"941-JV45VlPcTE+BBIAdeQeAxPDgMZY\"",
    "mtime": "2024-12-31T14:23:05.725Z",
    "size": 2369,
    "path": "../public/icons/folder.svg"
  },
  "/icons/folder1.svg": {
    "type": "image/svg+xml",
    "etag": "\"27a-lhATVNAu09ecNvPbxqvU900OuRs\"",
    "mtime": "2024-12-31T14:23:05.725Z",
    "size": 634,
    "path": "../public/icons/folder1.svg"
  },
  "/icons/folder2.svg": {
    "type": "image/svg+xml",
    "etag": "\"27b-tK75MxRWtgxHLC2szZ/sF2tDgNE\"",
    "mtime": "2024-12-31T14:23:05.725Z",
    "size": 635,
    "path": "../public/icons/folder2.svg"
  },
  "/icons/folder3.svg": {
    "type": "image/svg+xml",
    "etag": "\"279-QgqUtFEfjCebugNAwtFKQ2Cnh58\"",
    "mtime": "2024-12-31T14:23:05.725Z",
    "size": 633,
    "path": "../public/icons/folder3.svg"
  },
  "/icons/info-hobbies.svg": {
    "type": "image/svg+xml",
    "etag": "\"356-rBx1vX6lJ0e4JEpw2onMKpiFWuE\"",
    "mtime": "2024-12-31T19:05:13.269Z",
    "size": 854,
    "path": "../public/icons/info-hobbies.svg"
  },
  "/icons/info-personal.svg": {
    "type": "image/svg+xml",
    "etag": "\"2c5-6ElYTMQr2+AbJG1lgzvlUq9626k\"",
    "mtime": "2024-12-31T19:05:28.098Z",
    "size": 709,
    "path": "../public/icons/info-personal.svg"
  },
  "/icons/info-professional.svg": {
    "type": "image/svg+xml",
    "etag": "\"34e-Lw4EpO/UGBIkevnCnRSxm5chevo\"",
    "mtime": "2024-12-31T14:23:05.727Z",
    "size": 846,
    "path": "../public/icons/info-professional.svg"
  },
  "/icons/link.svg": {
    "type": "image/svg+xml",
    "etag": "\"24a-m/IkfbO7GAqrV+hzKk9MTOA4ynA\"",
    "mtime": "2024-12-31T14:23:05.727Z",
    "size": 586,
    "path": "../public/icons/link.svg"
  },
  "/icons/markdown.svg": {
    "type": "image/svg+xml",
    "etag": "\"329-k3G/PtDSCjFLPxAcFiSn6xPFFAc\"",
    "mtime": "2024-12-31T14:23:05.727Z",
    "size": 809,
    "path": "../public/icons/markdown.svg"
  },
  "/icons/nuxt.svg": {
    "type": "image/svg+xml",
    "etag": "\"393-wwJjM2+OwTKNw+s6jaahjrXdh00\"",
    "mtime": "2024-12-31T14:23:05.729Z",
    "size": 915,
    "path": "../public/icons/nuxt.svg"
  },
  "/icons/phone.svg": {
    "type": "image/svg+xml",
    "etag": "\"452-Uh2+r07LOt/uhBAN/PPdCsOyapA\"",
    "mtime": "2024-12-31T14:23:05.729Z",
    "size": 1106,
    "path": "../public/icons/phone.svg"
  },
  "/icons/telegram.svg": {
    "type": "image/svg+xml",
    "etag": "\"1c0-ZXlaJSU7+KwQfK40z3dNIGj6rEY\"",
    "mtime": "2024-12-31T18:49:09.875Z",
    "size": 448,
    "path": "../public/icons/telegram.svg"
  },
  "/resume/UchMengly-Resume.pdf": {
    "type": "application/pdf",
    "etag": "\"42efa-sgxa+n9CghuCfBG0HpImt/bAE3U\"",
    "mtime": "2024-12-27T08:16:02.895Z",
    "size": 274170,
    "path": "../public/resume/UchMengly-Resume.pdf"
  },
  "/pwa/manifest.json": {
    "type": "application/json",
    "etag": "\"4bb-bik3+KBYz8ConINyhOZXdw6fgvU\"",
    "mtime": "2024-12-31T14:23:05.779Z",
    "size": 1211,
    "path": "../public/pwa/manifest.json"
  },
  "/_nuxt/about-me.70deb9bf.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"47c-AfIf1L3F19onSd7YBT1I8WnbEgE\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 1148,
    "path": "../public/_nuxt/about-me.70deb9bf.css"
  },
  "/_nuxt/about-me.99b99058.js": {
    "type": "application/javascript",
    "etag": "\"224b-egXJk+cYXyzx5JtH66aP6/2zd1g\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 8779,
    "path": "../public/_nuxt/about-me.99b99058.js"
  },
  "/_nuxt/close.19fba679.js": {
    "type": "application/javascript",
    "etag": "\"87-PYe6UmsxTP3IUmCmuIaimUaG6ic\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 135,
    "path": "../public/_nuxt/close.19fba679.js"
  },
  "/_nuxt/composables.fb5eb5d1.js": {
    "type": "application/javascript",
    "etag": "\"61-HJrsrsICuD99/JsW3Udu8rqFHBk\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 97,
    "path": "../public/_nuxt/composables.fb5eb5d1.js"
  },
  "/_nuxt/contact-me.8966fc53.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"6aa-HhuBLPNXwpwBoC7FMDLT3wto8HY\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 1706,
    "path": "../public/_nuxt/contact-me.8966fc53.css"
  },
  "/_nuxt/contact-me.db93bb1c.js": {
    "type": "application/javascript",
    "etag": "\"263f-jvGYDb4upLWIAgVeOKzEKsb1DTA\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 9791,
    "path": "../public/_nuxt/contact-me.db93bb1c.js"
  },
  "/_nuxt/entry.1df28302.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"a84d-Wf5lZUAnt9Hsh1m5bTJbyWWdhrw\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 43085,
    "path": "../public/_nuxt/entry.1df28302.css"
  },
  "/_nuxt/entry.52bca07b.js": {
    "type": "application/javascript",
    "etag": "\"2bce4-CEqFmpEOvEm3hceErqvNeN852Zc\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 179428,
    "path": "../public/_nuxt/entry.52bca07b.js"
  },
  "/_nuxt/error-404.23f2309d.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"e2e-ivsbEmi48+s9HDOqtrSdWFvddYQ\"",
    "mtime": "2025-01-02T01:48:01.958Z",
    "size": 3630,
    "path": "../public/_nuxt/error-404.23f2309d.css"
  },
  "/_nuxt/error-404.86322d9d.js": {
    "type": "application/javascript",
    "etag": "\"8a0-+1NBKelvWn48j79Xghib/6BCAGE\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 2208,
    "path": "../public/_nuxt/error-404.86322d9d.js"
  },
  "/_nuxt/error-500.002bde84.js": {
    "type": "application/javascript",
    "etag": "\"744-sRP2xz4Kw4tS3q3F73FDmMj2WtI\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 1860,
    "path": "../public/_nuxt/error-500.002bde84.js"
  },
  "/_nuxt/error-500.aa16ed4d.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"79e-7j4Tsx89siDo85YoIs0XqsPWmPI\"",
    "mtime": "2025-01-02T01:48:01.958Z",
    "size": 1950,
    "path": "../public/_nuxt/error-500.aa16ed4d.css"
  },
  "/_nuxt/error-component.2336e142.js": {
    "type": "application/javascript",
    "etag": "\"4ba-njlT9MJAbh9HDaPuKa3sFdZXSII\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 1210,
    "path": "../public/_nuxt/error-component.2336e142.js"
  },
  "/_nuxt/FiraCode-Bold.cb8eb487.ttf": {
    "type": "font/ttf",
    "etag": "\"2e1cc-orOqYo5RBo4T3r9k4u16yXAJ9kA\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 188876,
    "path": "../public/_nuxt/FiraCode-Bold.cb8eb487.ttf"
  },
  "/_nuxt/FiraCode-Light.9a0ab96c.ttf": {
    "type": "font/ttf",
    "etag": "\"2e034-pNxR376ejEPU+10mpcKXAs54b0M\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 188468,
    "path": "../public/_nuxt/FiraCode-Light.9a0ab96c.ttf"
  },
  "/_nuxt/FiraCode-Medium.e6130d9c.ttf": {
    "type": "font/ttf",
    "etag": "\"2df54-l7JwhdRewdcrAv+BDZpXCDnZHV4\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 188244,
    "path": "../public/_nuxt/FiraCode-Medium.e6130d9c.ttf"
  },
  "/_nuxt/FiraCode-Regular.d6641a9a.ttf": {
    "type": "font/ttf",
    "etag": "\"2df5c-heLz1vuG9DrczSZqitBnWXigGXU\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 188252,
    "path": "../public/_nuxt/FiraCode-Regular.d6641a9a.ttf"
  },
  "/_nuxt/FiraCode-Retina.2353fa3f.ttf": {
    "type": "font/ttf",
    "etag": "\"35cc4-wMH6Gnn8EC0rZ1M5axecGQGgSMI\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 220356,
    "path": "../public/_nuxt/FiraCode-Retina.2353fa3f.ttf"
  },
  "/_nuxt/FiraCode-SemiBold.acc523d8.ttf": {
    "type": "font/ttf",
    "etag": "\"2e0bc-MqnexoPc2ZtERrfNGxkHUg0T50g\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 188604,
    "path": "../public/_nuxt/FiraCode-SemiBold.acc523d8.ttf"
  },
  "/_nuxt/FiraCode-Variable.0ed78a6a.ttf": {
    "type": "font/ttf",
    "etag": "\"3f53c-KvDSPhDq42erfT+bm0gUs1jCtfA\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 259388,
    "path": "../public/_nuxt/FiraCode-Variable.0ed78a6a.ttf"
  },
  "/_nuxt/index.97050501.js": {
    "type": "application/javascript",
    "etag": "\"228e-Y0FllbgEt6zrAo/hCWxD7wIKUro\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 8846,
    "path": "../public/_nuxt/index.97050501.js"
  },
  "/_nuxt/index.b67db2e0.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"15f4-QNFqOCFpKxUxbClz9yTOyVcNfog\"",
    "mtime": "2025-01-02T01:48:01.959Z",
    "size": 5620,
    "path": "../public/_nuxt/index.b67db2e0.css"
  },
  "/_nuxt/projects.3cc0f21e.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"a9e-RSbMbbj4LLSCIGmwdobN7LQBBqI\"",
    "mtime": "2025-01-02T01:48:01.959Z",
    "size": 2718,
    "path": "../public/_nuxt/projects.3cc0f21e.css"
  },
  "/_nuxt/projects.793c3604.js": {
    "type": "application/javascript",
    "etag": "\"14c9-Z9Du91D3pN057kt1WF7XGEDZcb0\"",
    "mtime": "2025-01-02T01:48:01.948Z",
    "size": 5321,
    "path": "../public/_nuxt/projects.793c3604.js"
  },
  "/images/projects/ai-resources.png": {
    "type": "image/png",
    "etag": "\"d2e79-zIv1bfen8UPuvhaWao+WZtVTLnk\"",
    "mtime": "2024-12-31T14:23:05.750Z",
    "size": 863865,
    "path": "../public/images/projects/ai-resources.png"
  },
  "/images/projects/cambodia-map.png": {
    "type": "image/png",
    "etag": "\"2cdd52-EKlRyVi4Tx55+yo0Xc9JEYUoNMk\"",
    "mtime": "2025-01-01T23:09:55.424Z",
    "size": 2940242,
    "path": "../public/images/projects/cambodia-map.png"
  },
  "/images/projects/charity-backend.jpg": {
    "type": "image/jpeg",
    "etag": "\"27112-22nGe0K4UF7oG/aQsE6KIN0egt4\"",
    "mtime": "2025-01-01T23:09:55.426Z",
    "size": 160018,
    "path": "../public/images/projects/charity-backend.jpg"
  },
  "/images/projects/charity-frontend.jpg": {
    "type": "image/jpeg",
    "etag": "\"26f26-7ZKtkCA3OAiF8YAMS7bN6lqZ5yY\"",
    "mtime": "2025-01-01T23:09:55.427Z",
    "size": 159526,
    "path": "../public/images/projects/charity-frontend.jpg"
  },
  "/images/projects/elearning-admin-portal.png": {
    "type": "image/png",
    "etag": "\"1f672-w7FSqCGKKsZCOz3VZoIu34+tGBQ\"",
    "mtime": "2025-01-01T11:53:19.604Z",
    "size": 128626,
    "path": "../public/images/projects/elearning-admin-portal.png"
  },
  "/images/projects/elearning-backend.png": {
    "type": "image/png",
    "etag": "\"5e6d1e-8O45d+yudnjRpAihYle3gEWU4Ac\"",
    "mtime": "2025-01-01T15:06:09.246Z",
    "size": 6188318,
    "path": "../public/images/projects/elearning-backend.png"
  },
  "/images/projects/elearning-mobile-app.jpg": {
    "type": "image/jpeg",
    "etag": "\"2a426-JEA8Q0KoO8RuXEJ+lqfWOcMaSEY\"",
    "mtime": "2025-01-01T23:09:55.428Z",
    "size": 173094,
    "path": "../public/images/projects/elearning-mobile-app.jpg"
  },
  "/images/projects/elearning-website.png": {
    "type": "image/png",
    "etag": "\"b5791-8yrlKpMqhUAefAPvgZ0mjI80pTs\"",
    "mtime": "2025-01-01T09:56:07.103Z",
    "size": 743313,
    "path": "../public/images/projects/elearning-website.png"
  },
  "/images/projects/ethereum.png": {
    "type": "image/png",
    "etag": "\"494db-QfpxQyKYGx7DOjozqaKVyGRuO3o\"",
    "mtime": "2024-12-31T14:23:05.753Z",
    "size": 300251,
    "path": "../public/images/projects/ethereum.png"
  },
  "/images/projects/event-management.png": {
    "type": "image/png",
    "etag": "\"434328-lO7xesJXVxV8S5X5Yhku/MFIKa0\"",
    "mtime": "2025-01-01T13:13:50.420Z",
    "size": 4408104,
    "path": "../public/images/projects/event-management.png"
  },
  "/images/projects/khmerticket.png": {
    "type": "image/png",
    "etag": "\"163e97-oxyWamYLYpzVNxjC4mAWGJAi3Kk\"",
    "mtime": "2025-01-01T16:12:18.497Z",
    "size": 1457815,
    "path": "../public/images/projects/khmerticket.png"
  },
  "/images/projects/tetris-game.png": {
    "type": "image/png",
    "etag": "\"136c49-1ofMUd7eELYhhtIavsqJBfxzPXY\"",
    "mtime": "2024-12-31T14:23:05.763Z",
    "size": 1272905,
    "path": "../public/images/projects/tetris-game.png"
  },
  "/images/projects/ui-animations.png": {
    "type": "image/png",
    "etag": "\"41985-FE9unSqTl9lPE3LIDCetWdRQVqw\"",
    "mtime": "2024-12-31T14:23:05.766Z",
    "size": 268677,
    "path": "../public/images/projects/ui-animations.png"
  },
  "/images/projects/ui-animations2.png": {
    "type": "image/png",
    "etag": "\"3fb13-dh1WEMq9mwKiApNskJ+u8h8N/uU\"",
    "mtime": "2024-12-31T14:23:05.768Z",
    "size": 260883,
    "path": "../public/images/projects/ui-animations2.png"
  },
  "/images/projects/worldmap.png": {
    "type": "image/png",
    "etag": "\"97cc0-XGX1S/H6bJDScxURH36jOpkJleM\"",
    "mtime": "2024-12-31T14:23:05.773Z",
    "size": 621760,
    "path": "../public/images/projects/worldmap.png"
  },
  "/icons/console/arrow-button.svg": {
    "type": "image/svg+xml",
    "etag": "\"b8-OTecWE3mEy4hYYxvIN+4wf2RclE\"",
    "mtime": "2024-12-31T14:23:05.722Z",
    "size": 184,
    "path": "../public/icons/console/arrow-button.svg"
  },
  "/icons/console/bolt-down-left.svg": {
    "type": "image/svg+xml",
    "etag": "\"6e4-aPMoiVO7fzLMVMx/Eb+ltxgVxuk\"",
    "mtime": "2024-12-31T14:23:05.722Z",
    "size": 1764,
    "path": "../public/icons/console/bolt-down-left.svg"
  },
  "/icons/console/bolt-down-right.svg": {
    "type": "image/svg+xml",
    "etag": "\"6e4-4kGaC6XzPaluVY3oIvffCaKV1y0\"",
    "mtime": "2024-12-31T14:23:05.723Z",
    "size": 1764,
    "path": "../public/icons/console/bolt-down-right.svg"
  },
  "/icons/console/bolt-up-left.svg": {
    "type": "image/svg+xml",
    "etag": "\"6df-r7D0r5ZU7ZskkbjEH76McGd9RRA\"",
    "mtime": "2024-12-31T14:23:05.723Z",
    "size": 1759,
    "path": "../public/icons/console/bolt-up-left.svg"
  },
  "/icons/console/bolt-up-right.svg": {
    "type": "image/svg+xml",
    "etag": "\"6de-fii/T0Zxh+QFVF25uVoRHFT9Nic\"",
    "mtime": "2024-12-31T14:23:05.723Z",
    "size": 1758,
    "path": "../public/icons/console/bolt-up-right.svg"
  },
  "/icons/gist/comments.svg": {
    "type": "image/svg+xml",
    "etag": "\"328-1drNuB0u/AWQVe8bPQ9Xq5Buq+g\"",
    "mtime": "2024-12-31T14:23:05.726Z",
    "size": 808,
    "path": "../public/icons/gist/comments.svg"
  },
  "/icons/gist/star.svg": {
    "type": "image/svg+xml",
    "etag": "\"1f3-MgBc7LeUw7x5Fm4m33vTGB7x08M\"",
    "mtime": "2024-12-31T14:23:05.726Z",
    "size": 499,
    "path": "../public/icons/gist/star.svg"
  },
  "/icons/social/facebook.svg": {
    "type": "image/svg+xml",
    "etag": "\"100-Cy0W5OAyVUuviM+rFOwxIv2o3Nc\"",
    "mtime": "2024-12-31T14:23:05.729Z",
    "size": 256,
    "path": "../public/icons/social/facebook.svg"
  },
  "/icons/social/github.svg": {
    "type": "image/svg+xml",
    "etag": "\"5ab-MpoSZo1Bki2p20whey6mQnfGi8w\"",
    "mtime": "2024-12-31T14:23:05.730Z",
    "size": 1451,
    "path": "../public/icons/social/github.svg"
  },
  "/icons/social/linkedin.svg": {
    "type": "image/svg+xml",
    "etag": "\"1d0-rJaA7gZwsvDyX2r2+BY0Ug+4hDc\"",
    "mtime": "2024-12-31T18:39:47.537Z",
    "size": 464,
    "path": "../public/icons/social/linkedin.svg"
  },
  "/icons/social/twitter.svg": {
    "type": "image/svg+xml",
    "etag": "\"4c7-aET7mrYTJ6VIk1c2Tk9ptmyx8UY\"",
    "mtime": "2024-12-31T14:23:05.730Z",
    "size": 1223,
    "path": "../public/icons/social/twitter.svg"
  },
  "/icons/techs/ai.svg": {
    "type": "image/svg+xml",
    "etag": "\"1c5-TXe1u3iLTrt7Q4aPcG0oSMn7yYw\"",
    "mtime": "2025-01-01T23:09:55.400Z",
    "size": 453,
    "path": "../public/icons/techs/ai.svg"
  },
  "/icons/techs/angular.svg": {
    "type": "image/svg+xml",
    "etag": "\"190-NeLQCaBzUiD44NQVEIXpj0RcNlA\"",
    "mtime": "2024-12-31T14:23:05.730Z",
    "size": 400,
    "path": "../public/icons/techs/angular.svg"
  },
  "/icons/techs/css.svg": {
    "type": "image/svg+xml",
    "etag": "\"15a-TFqO2rMQbKBe/iXTGim6I9Ee0RI\"",
    "mtime": "2024-12-31T14:23:05.730Z",
    "size": 346,
    "path": "../public/icons/techs/css.svg"
  },
  "/icons/techs/dart.svg": {
    "type": "image/svg+xml",
    "etag": "\"1dd-5aNfOgbItQPOzWEQgCtf2UmHIEs\"",
    "mtime": "2025-01-01T16:31:59.042Z",
    "size": 477,
    "path": "../public/icons/techs/dart.svg"
  },
  "/icons/techs/django.svg": {
    "type": "image/svg+xml",
    "etag": "\"250-hPuSAr4pzjnTUHrtOzvbsgyngXI\"",
    "mtime": "2025-01-01T23:09:55.402Z",
    "size": 592,
    "path": "../public/icons/techs/django.svg"
  },
  "/icons/techs/firebase.svg": {
    "type": "image/svg+xml",
    "etag": "\"148-IAL1Do+vTqmSgyEdjU0DdWf5swA\"",
    "mtime": "2025-01-01T16:33:22.446Z",
    "size": 328,
    "path": "../public/icons/techs/firebase.svg"
  },
  "/icons/techs/flutter.svg": {
    "type": "image/svg+xml",
    "etag": "\"139-IPj1TdjIHfy4KkhgMNPY8KQPbcY\"",
    "mtime": "2024-12-31T14:23:05.734Z",
    "size": 313,
    "path": "../public/icons/techs/flutter.svg"
  },
  "/icons/techs/gatsby.svg": {
    "type": "image/svg+xml",
    "etag": "\"358-gPr6qSUkXZTEEvNh6jH1d3vWTjw\"",
    "mtime": "2024-12-31T14:23:05.734Z",
    "size": 856,
    "path": "../public/icons/techs/gatsby.svg"
  },
  "/icons/techs/html.svg": {
    "type": "image/svg+xml",
    "etag": "\"1cc-lE/rMMrjGqU/7gcIS/FSkvPywu0\"",
    "mtime": "2024-12-31T14:23:05.736Z",
    "size": 460,
    "path": "../public/icons/techs/html.svg"
  },
  "/icons/techs/javascript.svg": {
    "type": "image/svg+xml",
    "etag": "\"338-TsMTe4uJTyIzqoz7jYnz3k2rEHE\"",
    "mtime": "2025-01-01T16:35:41.665Z",
    "size": 824,
    "path": "../public/icons/techs/javascript.svg"
  },
  "/icons/techs/laravel.svg": {
    "type": "image/svg+xml",
    "etag": "\"15f-8B4lDq0qR2PtKfHFtzvhmggV+/k\"",
    "mtime": "2025-01-01T07:54:46.726Z",
    "size": 351,
    "path": "../public/icons/techs/laravel.svg"
  },
  "/icons/techs/mysql.svg": {
    "type": "image/svg+xml",
    "etag": "\"1c1-JJukUu/qXcAnas7USbxvZ0LQU+w\"",
    "mtime": "2025-01-01T16:30:15.648Z",
    "size": 449,
    "path": "../public/icons/techs/mysql.svg"
  },
  "/icons/techs/nuxt.svg": {
    "type": "image/svg+xml",
    "etag": "\"2e8-ZzrYIeo3dEt4cfmroxt5IFVawEk\"",
    "mtime": "2025-01-01T07:53:14.596Z",
    "size": 744,
    "path": "../public/icons/techs/nuxt.svg"
  },
  "/icons/techs/php.svg": {
    "type": "image/svg+xml",
    "etag": "\"2da-s5r4VfujSBSjgkja5Y8CnpdlMTw\"",
    "mtime": "2025-01-01T16:26:59.498Z",
    "size": 730,
    "path": "../public/icons/techs/php.svg"
  },
  "/icons/techs/react.svg": {
    "type": "image/svg+xml",
    "etag": "\"1041-EmvDamWSG20A+5GpTtc3M5e6Usk\"",
    "mtime": "2024-12-31T14:23:05.737Z",
    "size": 4161,
    "path": "../public/icons/techs/react.svg"
  },
  "/icons/techs/vue.svg": {
    "type": "image/svg+xml",
    "etag": "\"14a-7GEat9GBzPHAKSM7Q0Ly4vop1+M\"",
    "mtime": "2024-12-31T14:23:05.737Z",
    "size": 330,
    "path": "../public/icons/techs/vue.svg"
  },
  "/pwa/icons/apple-touch-icon.png": {
    "type": "image/png",
    "etag": "\"70ff-dKqzQbXvg02HZtWBsr6TAlLZeGg\"",
    "mtime": "2024-12-31T14:23:05.776Z",
    "size": 28927,
    "path": "../public/pwa/icons/apple-touch-icon.png"
  },
  "/pwa/icons/icon144.png": {
    "type": "image/png",
    "etag": "\"5716-eX54sEp0wzeVqfwfVMHgVnbwZ9I\"",
    "mtime": "2024-12-31T14:23:05.777Z",
    "size": 22294,
    "path": "../public/pwa/icons/icon144.png"
  },
  "/pwa/icons/icon168.png": {
    "type": "image/png",
    "etag": "\"65ac-/4uxhIiC8YrwA+8AYGcoKCpJJkE\"",
    "mtime": "2024-12-31T14:23:05.777Z",
    "size": 26028,
    "path": "../public/pwa/icons/icon168.png"
  },
  "/pwa/icons/icon192.png": {
    "type": "image/png",
    "etag": "\"70ff-dKqzQbXvg02HZtWBsr6TAlLZeGg\"",
    "mtime": "2024-12-31T14:23:05.778Z",
    "size": 28927,
    "path": "../public/pwa/icons/icon192.png"
  },
  "/pwa/icons/Icon48.png": {
    "type": "image/png",
    "etag": "\"159b-bIgxPcK+rCQAeoPTgh0cuDGkLUY\"",
    "mtime": "2024-12-31T14:23:05.775Z",
    "size": 5531,
    "path": "../public/pwa/icons/Icon48.png"
  },
  "/pwa/icons/icon512.png": {
    "type": "image/png",
    "etag": "\"21c51-qnVGyCBlHMkXvBDEwu5R1llhw/4\"",
    "mtime": "2024-12-31T14:23:05.779Z",
    "size": 138321,
    "path": "../public/pwa/icons/icon512.png"
  },
  "/pwa/icons/Icon72.png": {
    "type": "image/png",
    "etag": "\"232c-SH2402xakez3F7dx16MDm6C1T5I\"",
    "mtime": "2024-12-31T14:23:05.776Z",
    "size": 9004,
    "path": "../public/pwa/icons/Icon72.png"
  },
  "/pwa/icons/Icon96.png": {
    "type": "image/png",
    "etag": "\"2fb7-ehIcRbDO+jrp5x2ux/RFMVgQl8U\"",
    "mtime": "2024-12-31T14:23:05.776Z",
    "size": 12215,
    "path": "../public/pwa/icons/Icon96.png"
  },
  "/icons/techs/filled/ai.svg": {
    "type": "image/svg+xml",
    "etag": "\"28f-7Xah6lFq2JabanQj7ZYedelbfzo\"",
    "mtime": "2025-01-01T23:09:55.402Z",
    "size": 655,
    "path": "../public/icons/techs/filled/ai.svg"
  },
  "/icons/techs/filled/angular.svg": {
    "type": "image/svg+xml",
    "etag": "\"293-uPHJsW61UbvYJExSpoF3oYEe87s\"",
    "mtime": "2024-12-31T14:23:05.730Z",
    "size": 659,
    "path": "../public/icons/techs/filled/angular.svg"
  },
  "/icons/techs/filled/css.svg": {
    "type": "image/svg+xml",
    "etag": "\"25e-oI+VfSFkfFOGTwNAdrFT9LhvNlo\"",
    "mtime": "2024-12-31T14:23:05.732Z",
    "size": 606,
    "path": "../public/icons/techs/filled/css.svg"
  },
  "/icons/techs/filled/dart.svg": {
    "type": "image/svg+xml",
    "etag": "\"6c4-FDjDvEPb1KXP4SEQxRCo+o0K3Ss\"",
    "mtime": "2025-01-01T16:32:16.978Z",
    "size": 1732,
    "path": "../public/icons/techs/filled/dart.svg"
  },
  "/icons/techs/filled/django.svg": {
    "type": "image/svg+xml",
    "etag": "\"2fd-N44FCtdW5axpL5kpPkg46UStilc\"",
    "mtime": "2025-01-01T23:09:55.403Z",
    "size": 765,
    "path": "../public/icons/techs/filled/django.svg"
  },
  "/icons/techs/filled/firebase.svg": {
    "type": "image/svg+xml",
    "etag": "\"489-Ix71xNOmkAE5z8kg7tk2gr3DKA0\"",
    "mtime": "2025-01-01T16:33:39.198Z",
    "size": 1161,
    "path": "../public/icons/techs/filled/firebase.svg"
  },
  "/icons/techs/filled/flutter.svg": {
    "type": "image/svg+xml",
    "etag": "\"233-kT7jigv3O1P6BL0qxaye0EW8b+Q\"",
    "mtime": "2024-12-31T14:23:05.732Z",
    "size": 563,
    "path": "../public/icons/techs/filled/flutter.svg"
  },
  "/icons/techs/filled/gatsby.svg": {
    "type": "image/svg+xml",
    "etag": "\"370-cH9XknawEnWQni40/nQmYVUH3/E\"",
    "mtime": "2024-12-31T14:23:05.732Z",
    "size": 880,
    "path": "../public/icons/techs/filled/gatsby.svg"
  },
  "/icons/techs/filled/html.svg": {
    "type": "image/svg+xml",
    "etag": "\"2b5-UinJPnCYT0OYGtfyyYzIdo9YawU\"",
    "mtime": "2024-12-31T14:23:05.732Z",
    "size": 693,
    "path": "../public/icons/techs/filled/html.svg"
  },
  "/icons/techs/filled/javascript.svg": {
    "type": "image/svg+xml",
    "etag": "\"382-tLrbKz4eNJk5GlsKfRWRZVB67TI\"",
    "mtime": "2025-01-01T16:35:54.412Z",
    "size": 898,
    "path": "../public/icons/techs/filled/javascript.svg"
  },
  "/icons/techs/filled/laravel.svg": {
    "type": "image/svg+xml",
    "etag": "\"8ef-Qatt5US7yquIg80g+Kt/PkV263k\"",
    "mtime": "2025-01-01T07:55:03.774Z",
    "size": 2287,
    "path": "../public/icons/techs/filled/laravel.svg"
  },
  "/icons/techs/filled/mysql.svg": {
    "type": "image/svg+xml",
    "etag": "\"c1a-+I9PNMZHgBXbsykXC+RBBCypwcQ\"",
    "mtime": "2025-01-01T16:30:45.905Z",
    "size": 3098,
    "path": "../public/icons/techs/filled/mysql.svg"
  },
  "/icons/techs/filled/nuxt.svg": {
    "type": "image/svg+xml",
    "etag": "\"32d-NOT1tHY4std2dU/Q2Bmjaeu8QUI\"",
    "mtime": "2025-01-01T07:52:25.097Z",
    "size": 813,
    "path": "../public/icons/techs/filled/nuxt.svg"
  },
  "/icons/techs/filled/php.svg": {
    "type": "image/svg+xml",
    "etag": "\"10d4-rVHYRopgPBlC2ZjQZbErUNatDIA\"",
    "mtime": "2025-01-01T16:27:17.633Z",
    "size": 4308,
    "path": "../public/icons/techs/filled/php.svg"
  },
  "/icons/techs/filled/react.svg": {
    "type": "image/svg+xml",
    "etag": "\"11ac-/AtPM3JvN/fyo0efBJU4bPwdN24\"",
    "mtime": "2024-12-31T14:23:05.733Z",
    "size": 4524,
    "path": "../public/icons/techs/filled/react.svg"
  },
  "/icons/techs/filled/vue.svg": {
    "type": "image/svg+xml",
    "etag": "\"25e-izQoTlaUw1GOZuYx6jD4TvieaqA\"",
    "mtime": "2024-12-31T14:23:05.733Z",
    "size": 606,
    "path": "../public/icons/techs/filled/vue.svg"
  }
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = [];

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base of publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = ["HEAD", "GET"];
const EncodingMap = { gzip: ".gz", br: ".br" };
const _f4b49z = eventHandler((event) => {
  if (event.req.method && !METHODS.includes(event.req.method)) {
    return;
  }
  let id = decodeURIComponent(withLeadingSlash(withoutTrailingSlash(parseURL(event.req.url).pathname)));
  let asset;
  const encodingHeader = String(event.req.headers["accept-encoding"] || "");
  const encodings = encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort().concat([""]);
  if (encodings.length > 1) {
    event.res.setHeader("Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      throw createError({
        statusMessage: "Cannot find static asset " + id,
        statusCode: 404
      });
    }
    return;
  }
  const ifNotMatch = event.req.headers["if-none-match"] === asset.etag;
  if (ifNotMatch) {
    event.res.statusCode = 304;
    event.res.end();
    return;
  }
  const ifModifiedSinceH = event.req.headers["if-modified-since"];
  if (ifModifiedSinceH && asset.mtime) {
    if (new Date(ifModifiedSinceH) >= new Date(asset.mtime)) {
      event.res.statusCode = 304;
      event.res.end();
      return;
    }
  }
  if (asset.type && !event.res.getHeader("Content-Type")) {
    event.res.setHeader("Content-Type", asset.type);
  }
  if (asset.etag && !event.res.getHeader("ETag")) {
    event.res.setHeader("ETag", asset.etag);
  }
  if (asset.mtime && !event.res.getHeader("Last-Modified")) {
    event.res.setHeader("Last-Modified", asset.mtime);
  }
  if (asset.encoding && !event.res.getHeader("Content-Encoding")) {
    event.res.setHeader("Content-Encoding", asset.encoding);
  }
  if (asset.size && !event.res.getHeader("Content-Length")) {
    event.res.setHeader("Content-Length", asset.size);
  }
  return readAsset(id);
});

const _lazy_dKfC5n = () => import('./renderer.mjs');

const handlers = [
  { route: '', handler: _f4b49z, lazy: false, middleware: true, method: undefined },
  { route: '/__nuxt_error', handler: _lazy_dKfC5n, lazy: true, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_dKfC5n, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const h3App = createApp({
    debug: destr(false),
    onError: errorHandler
  });
  h3App.use(config.app.baseURL, timingMiddleware);
  const router = createRouter();
  h3App.use(createRouteRulesHandler());
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(/\/+/g, "/");
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(h.route.replace(/:\w+|\*\*/g, "_"));
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router);
  const localCall = createCall(toNodeListener(h3App));
  const localFetch = createFetch(localCall, globalThis.fetch);
  const $fetch = createFetch$1({ fetch: localFetch, Headers, defaults: { baseURL: config.app.baseURL } });
  globalThis.$fetch = $fetch;
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch
  };
  for (const plugin of plugins) {
    plugin(app);
  }
  return app;
}
const nitroApp = createNitroApp();
const useNitroApp = () => nitroApp;

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const server = cert && key ? new Server({ key, cert }, toNodeListener(nitroApp.h3App)) : new Server$1(toNodeListener(nitroApp.h3App));
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const s = server.listen(port, host, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  const i = s.address();
  const baseURL = (useRuntimeConfig().app.baseURL || "").replace(/\/$/, "");
  const url = `${protocol}://${i.family === "IPv6" ? `[${i.address}]` : i.address}:${i.port}${baseURL}`;
  console.log(`Listening ${url}`);
});
{
  process.on("unhandledRejection", (err) => console.error("[nitro] [dev] [unhandledRejection] " + err));
  process.on("uncaughtException", (err) => console.error("[nitro] [dev] [uncaughtException] " + err));
}
const nodeServer = {};

export { useRuntimeConfig as a, getRouteRules as b, createError as c, eventHandler as e, getQuery as g, nodeServer as n, sendRedirect as s, useNitroApp as u };
//# sourceMappingURL=node-server.mjs.map
