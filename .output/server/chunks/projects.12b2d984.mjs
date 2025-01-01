import { ref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderAttr, ssrRenderList, ssrInterpolate, ssrRenderComponent } from 'vue/server-renderer';
import { u as useRuntimeConfig, _ as _export_sfc } from './server.mjs';
import { _ as _imports_0, a as _imports_1 } from './close.19fba679.mjs';
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
  __name: "ProjectCard",
  __ssrInlineRender: true,
  props: ["project", "projectKey", "index"],
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(`<div${ssrRenderAttrs(mergeProps({
        id: "project",
        key: __props.projectKey,
        class: "lg:mx-5"
      }, _attrs))} data-v-00dfef41><span class="flex text-sm my-3" data-v-00dfef41>`);
      if (__props.index == null) {
        _push(`<h3 class="text-purplefy font-fira_bold mr-3" data-v-00dfef41>Project ${ssrInterpolate(__props.projectKey + 1)}</h3>`);
      } else {
        _push(`<h3 class="text-purplefy font-fira_bold mr-3" data-v-00dfef41>Project ${ssrInterpolate(__props.index + 1)}</h3>`);
      }
      _push(`<h4 class="font-fira_retina text-menu-text" data-v-00dfef41> // ${ssrInterpolate(__props.project.title)}</h4></span><div id="project-card" class="flex flex-col" data-v-00dfef41><div id="window" class="aspect-ratio-container" data-v-00dfef41><img id="showcase"${ssrRenderAttr("src", __props.project.img)} alt="" class="showcase-img" data-v-00dfef41></div><div class="pb-8 pt-6 px-6 border-top" data-v-00dfef41><p class="text-menu-text font-fira_retina text-sm mb-5" data-v-00dfef41>${(_a = __props.project.description) != null ? _a : ""}</p><div class="flex justify-start" data-v-00dfef41>`);
      if (__props.project.git_url != null) {
        _push(`<a id="view-button"${ssrRenderAttr("href", __props.project.git_url)} target="_blank" class="text-white font-fira_retina py-2 px-4 mr-5 w-fit text-xs rounded-lg" data-v-00dfef41> view-github </a>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.project.youtube != null) {
        _push(`<a id="view-button"${ssrRenderAttr("href", __props.project.youtube)} target="_blank" class="text-white font-fira_retina py-2 px-4 mr-5 w-fit text-xs rounded-lg" data-v-00dfef41> video-demo </a>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.project.web_url != null) {
        _push(`<a id="view-button"${ssrRenderAttr("href", __props.project.web_url)} target="_blank" class="text-white font-fira_retina py-2 px-4 w-fit text-xs rounded-lg" data-v-00dfef41> website </a>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ProjectCard.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-00dfef41"]]);
const _sfc_main = {
  __name: "projects",
  __ssrInlineRender: true,
  setup(__props) {
    const config = useRuntimeConfig();
    const techs = ["Laravel", "HTML", "CSS", "JavaScript", "PHP", "MySQL", "Firebase", "Vue", "Nuxt", "Django", "Flutter", "Dart", "AI"];
    const filters = ref(["all"]);
    const showFilters = ref(true);
    const projects = ref(config.public.dev.projects);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_project_card = __nuxt_component_0;
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "flex flex-col flex-auto lg:flex-row overflow-hidden" }, _attrs))}><div id="mobile-page-title"><h2>_projects</h2></div><div id="section-content-title" class="flex lg:hidden"><img class="${ssrRenderClass(showFilters.value ? "section-arrow rotate-90" : "section-arrow")}"${ssrRenderAttr("src", _imports_0)}><span class="font-fira_regular text-white text-sm">projects</span></div>`);
      if (showFilters.value) {
        _push(`<div id="filter-menu" class="w-full flex-col border-right font-fira_regular text-menu-text lg:flex"><div id="section-content-title" class="hidden lg:flex items-center min-w-full"><img id="section-arrow-menu"${ssrRenderAttr("src", _imports_0)} alt="" class="section-arrow mx-3"><p class="font-fira_regular text-white text-sm">projects</p></div><nav id="filters" class="w-full flex-col"><!--[-->`);
        ssrRenderList(techs, (tech) => {
          _push(`<div class="flex items-center py-2"><input type="checkbox"${ssrRenderAttr("id", tech)}><img${ssrRenderAttr("id", "icon-tech-" + tech)}${ssrRenderAttr("src", "/icons/techs/" + tech + ".svg")} alt="icon" class="tech-icon w-5 h-5 mx-4"><span${ssrRenderAttr("id", "title-tech-" + tech)}>${ssrInterpolate(tech)}</span></div>`);
        });
        _push(`<!--]--></nav></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex flex-col w-full overflow-hidden"><div class="tab-height w-full hidden lg:flex border-bot items-center"><div class="flex items-center border-right h-full"><!--[-->`);
      ssrRenderList(filters.value, (filter) => {
        _push(`<p class="font-fira_regular text-menu-text text-sm px-3">${ssrInterpolate(filter)};</p>`);
      });
      _push(`<!--]--><img${ssrRenderAttr("src", _imports_1)} alt="" class="m-3"></div></div><div id="tab" class="flex lg:hidden items-center"><span class="text-white"> // </span><p class="font-fira_regular text-white text-sm px-3">projects</p><span class="text-menu-text"> / </span><!--[-->`);
      ssrRenderList(filters.value, (filter) => {
        _push(`<p class="font-fira_regular text-menu-text text-sm px-3">${ssrInterpolate(filter)};</p>`);
      });
      _push(`<!--]--></div><div id="projects-case" class="grid grid-cols-1 lg:grid-cols-2 max-w-full h-full overflow-scroll lg:self-center"><div id="not-found" class="hidden flex flex-col font-fira_retina text-menu-text my-5 h-full justify-center items-center"><span class="flex justify-center text-4xl pb-3"> X__X </span><span class="text-white flex justify-center text-xl"> No matching projects </span><span class="flex justify-center"> for these technologies </span></div><!--[-->`);
      ssrRenderList(projects.value, (project, key, index) => {
        _push(ssrRenderComponent(_component_project_card, {
          key,
          index,
          project
        }, null, _parent));
      });
      _push(`<!--]--></div></div></main>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/projects.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=projects.12b2d984.mjs.map
