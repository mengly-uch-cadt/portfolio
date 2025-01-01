import { useSSRContext, mergeProps } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { _ as _export_sfc, u as useRuntimeConfig } from './server.mjs';
import { _ as _imports_0, a as _imports_1$1 } from './close.19fba679.mjs';
import 'ofetch';
import 'hookable';
import 'unctx';
import 'ufo';
import './node-server.mjs';
import 'node-fetch-native/polyfill';
import 'http';
import 'https';
import 'destr';
import 'unenv/runtime/fetch/index';
import 'scule';
import 'ohash';
import 'unstorage';
import 'defu';
import 'node:fs';
import 'node:url';
import 'pathe';
import '@unhead/vue';
import '@unhead/dom';
import 'vue-router';
import 'aos';

const _sfc_main$1 = {
  props: {
    text: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      lines: 0
    };
  },
  mounted() {
    this.updateLines();
    window.addEventListener("resize", this.updateLines);
    window.addEventListener("click", this.updateLines);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateLines);
    window.removeEventListener("click", this.updateLines);
  },
  methods: {
    updateLines() {
      const textContainer = this.$el.querySelector(".text-container");
      const style = window.getComputedStyle(textContainer);
      parseInt(style.fontSize);
      const lineHeight = parseInt(style.lineHeight);
      const maxHeight = textContainer.offsetHeight;
      this.lines = Math.ceil(maxHeight / lineHeight) + 1;
    }
  }
};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  var _a;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "code-container flex font-fira_retina text-menu-text" }, _attrs))}><div class="line-numbers lg:flex flex-col w-32 hidden"><!--[-->`);
  ssrRenderList($data.lines, (n) => {
    _push(`<div class="grid grid-cols-2 justify-end"><span class="col-span-1 mr-3">${ssrInterpolate(n)}</span>`);
    if (n == 1) {
      _push(`<div class="col-span-1 flex justify-center">/**</div>`);
    } else {
      _push(`<!---->`);
    }
    if (n > 1 && n < $data.lines) {
      _push(`<div class="col-span-1 flex justify-center">*</div>`);
    } else {
      _push(`<!---->`);
    }
    if (n == $data.lines) {
      _push(`<div class="col-span-1 flex justify-center pl-2">*/</div>`);
    } else {
      _push(`<!---->`);
    }
    _push(`</div>`);
  });
  _push(`<!--]--></div><div class="text-container"><p>${(_a = $props.text) != null ? _a : ""}</p></div></div>`);
}
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CommentedText.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["ssrRender", _sfc_ssrRender$1]]);
const _imports_1 = "" + globalThis.__publicAssetsURL("icons/diple.svg");
const _imports_2 = "" + globalThis.__publicAssetsURL("icons/markdown.svg");
const _sfc_main = {
  data() {
    return {
      currentSection: "personal-info",
      folder: "bio",
      loading: true
    };
  },
  setup() {
    const config = useRuntimeConfig();
    return {
      config
    };
  },
  computed: {
    isActive() {
      return (folder) => this.folder === folder;
    },
    isSectionActive() {
      return (section) => this.currentSection === section;
    },
    isOpen() {
      return (folder) => this.folder === folder;
    }
  },
  methods: {
    focusCurrentSection(section) {
      this.currentSection = section.title;
      this.folder = Object.keys(section.info)[0];
      document.getElementById("folders-" + section.title).classList.toggle("hidden");
      document.getElementById("section-arrow-" + section.title).classList.toggle("rotate-90");
    },
    focusCurrentFolder(folder) {
      this.folder = folder.title;
      this.currentSection = this.config.dev.about.sections[this.currentSection].info[folder.title] ? this.currentSection : Object.keys(this.config.dev.about.sections).find((section) => this.config.dev.about.sections[section].info[folder.title]);
    },
    toggleFiles() {
      document.getElementById("file-" + this.folder).classList.toggle("hidden");
    },
    showContacts() {
      document.getElementById("contacts").classList.toggle("hidden");
      document.getElementById("section-arrow").classList.toggle("rotate-90");
    }
  },
  mounted() {
    this.loading = false;
  }
};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  var _a, _b, _c, _d;
  const _component_CommentedText = __nuxt_component_0;
  if (!$data.loading) {
    _push(`<main${ssrRenderAttrs(mergeProps({
      id: "about-me",
      class: "page"
    }, _attrs))}><div id="mobile-page-title"><h2>_about-me</h2></div><div id="page-menu" class="w-full flex"><div id="sections"><!--[-->`);
    ssrRenderList($setup.config.dev.about.sections, (section) => {
      _push(`<div id="section-icon" class="${ssrRenderClass({ active: $options.isSectionActive(section.title) })}"><img${ssrRenderAttr("id", "section-icon-" + section.title)}${ssrRenderAttr("src", section.icon)}${ssrRenderAttr("alt", section.title + "-section")}></div>`);
    });
    _push(`<!--]--></div><div id="section-content" class="hidden lg:block w-full h-full border-right"><div id="section-content-title" class="hidden lg:flex items-center min-w-full"><img id="section-arrow-menu"${ssrRenderAttr("src", _imports_0)} alt="" class="section-arrow mx-3 open"><p class="font-fira_regular text-white text-sm">${(_a = $setup.config.dev.about.sections[$data.currentSection].title) != null ? _a : ""}</p></div><div><!--[-->`);
    ssrRenderList($setup.config.dev.about.sections[$data.currentSection].info, (folder, key, index) => {
      _push(`<div class="grid grid-cols-2 items-center my-2 font-fira_regular text-menu-text"><div class="flex col-span-2 hover:text-white hover:cursor-pointer"><img id="diple"${ssrRenderAttr("src", _imports_1)} alt="" class="${ssrRenderClass({ open: $options.isOpen(folder.title) })}"><img${ssrRenderAttr("src", "/icons/folder" + (index + 1) + ".svg")} alt="" class="mr-3"><p${ssrRenderAttr("id", folder.title)} class="${ssrRenderClass({ active: $options.isActive(folder.title) })}">${key != null ? key : ""}</p></div>`);
      if (folder.files !== void 0) {
        _push(`<div class="col-span-2"><!--[-->`);
        ssrRenderList(folder.files, (file, key2) => {
          _push(`<div class="hover:text-white hover:cursor-pointer flex my-2"><img${ssrRenderAttr("src", _imports_2)} alt="" class="ml-8 mr-3"><p>${ssrInterpolate(key2)}</p></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    });
    _push(`<!--]--></div><div id="section-content-title" class="hidden lg:flex items-center min-w-full border-top"><img id="section-arrow-menu"${ssrRenderAttr("src", _imports_0)} alt="" class="section-arrow mx-3 open"><p class="font-fira_regular text-white text-sm">Resume</p></div><a href="/resume/UchMengly-Resume.pdf" target="_blank" download><div class="grid grid-cols-2 items-center my-2 font-fira_regular text-menu-text"><div class="flex col-span-2 hover:text-white hover:cursor-pointer"><img id="diple"${ssrRenderAttr("src", _imports_1)} alt="" class="${ssrRenderClass({ open: $options.isOpen($data.folder.title) })}"><img${ssrRenderAttr("src", "/icons/folder" + (_ctx.index + 1) + ".svg")} alt="" class="mr-3"><p>my-resume</p></div></div></a><div id="section-content-title-contact" class="flex items-center min-w-full border-top"><img id="section-arrow-menu"${ssrRenderAttr("src", _imports_0)} alt="" class="section-arrow mx-3 open"><p class="font-fira_regular text-white text-sm">${(_b = $setup.config.dev.contacts.direct.title) != null ? _b : ""}</p></div><div id="contact-sources" class="hidden lg:flex lg:flex-col my-2"><!--[-->`);
    ssrRenderList($setup.config.dev.contacts.direct.sources, (source, key) => {
      _push(`<div class="flex items-center mb-2"><img${ssrRenderAttr("src", "/icons/" + key + ".svg")} alt="" class="mx-4"><a href="/" class="font-fira_retina text-menu-text hover:text-white">${source != null ? source : ""}</a></div>`);
    });
    _push(`<!--]--></div></div><div id="section-content" class="lg:hidden w-full font-fira_regular"><!--[-->`);
    ssrRenderList($setup.config.dev.about.sections, (section) => {
      var _a2;
      _push(`<div><div${ssrRenderAttr("src", section.icon)} id="section-content-title" class="flex lg:hidden mb-1"><img${ssrRenderAttr("src", _imports_0)}${ssrRenderAttr("id", "section-arrow-" + section.title)} alt="" class="section-arrow"><p class="text-white text-sm">${(_a2 = section.title) != null ? _a2 : ""}</p></div><div${ssrRenderAttr("id", "folders-" + section.title)} class="hidden"><!--[-->`);
      ssrRenderList($setup.config.dev.about.sections[section.title].info, (folder, key, index) => {
        _push(`<div class="grid grid-cols-2 items-center my-2 font-fira_regular text-menu-text hover:text-white hover:cursor-pointer"><div class="flex col-span-2"><img id="diple"${ssrRenderAttr("src", _imports_1)}><img${ssrRenderAttr("src", "icons/folder" + (index + 1) + ".svg")} alt="" class="mr-3"><p${ssrRenderAttr("id", folder.title)} class="${ssrRenderClass({ active: $options.isActive(folder.title) })}">${key != null ? key : ""}</p></div>`);
        if (folder.files !== void 0) {
          _push(`<div class="col-span-2"><!--[-->`);
          ssrRenderList(folder.files, (file, key2) => {
            _push(`<div class="hover:text-white hover:cursor-pointer flex my-2"><img${ssrRenderAttr("src", _imports_2)} alt="" class="ml-8 mr-3"><p>${ssrInterpolate(key2)}</p></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></div>`);
    });
    _push(`<!--]--><div id="section-content-title" class="flex items-center min-w-full"><img${ssrRenderAttr("src", _imports_0)} alt="" id="section-arrow" class="section-arrow"><p class="font-fira_regular text-white text-sm">${(_c = $setup.config.dev.contacts.direct.title) != null ? _c : ""}</p></div><div id="contacts" class="hidden"><!--[-->`);
    ssrRenderList($setup.config.dev.contacts.direct.sources, (source, key) => {
      _push(`<div class="flex items-center my-2"><img${ssrRenderAttr("src", "/icons/" + key + ".svg")} alt=""><a href="/" class="font-fira_retina text-menu-text hover:text-white ml-4">${source != null ? source : ""}</a></div>`);
    });
    _push(`<!--]--></div></div></div><div class="h-full w-full"><div class="tab-height w-full hidden lg:flex border-bot items-center"><div class="flex items-center border-right h-full"><p class="font-fira_regular text-menu-text text-sm px-3">${(_d = $setup.config.dev.about.sections[$data.currentSection].title) != null ? _d : ""}</p><img${ssrRenderAttr("src", _imports_1$1)} alt="" class="mx-3"></div></div><div id="commented-text" class="flex h-full w-full lg:border-right overflow-hidden"><div class="w-full h-full ml-5 mr-10 lg:my-5 overflow-scroll">`);
    _push(ssrRenderComponent(_component_CommentedText, {
      text: $setup.config.dev.about.sections[$data.currentSection].info[$data.folder].description
    }, null, _parent));
    _push(`</div><div id="scroll-bar" class="h-full border-left hidden lg:flex justify-center py-1"><div id="scroll"></div></div></div></div></main>`);
  } else {
    _push(`<!---->`);
  }
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/about-me.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const aboutMe = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { aboutMe as default };
//# sourceMappingURL=about-me.e9bca42e.mjs.map
