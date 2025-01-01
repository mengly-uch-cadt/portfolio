<template>
  <div id="project" :key="projectKey" class="lg:mx-5">
    <span class="flex text-sm my-3">
        <h3 v-if="index == null" class="text-purplefy font-fira_bold mr-3">Project {{ projectKey + 1 }}</h3>
        <h3 v-else class="text-purplefy font-fira_bold mr-3">Project {{ index + 1 }}</h3>
        <h4 class="font-fira_retina text-menu-text"> // {{ project.title }}</h4>
    </span>

    <div id="project-card" class="flex flex-col">
        <div id="window" class="aspect-ratio-container">
            <img id="showcase" :src="project.img" alt="" class="showcase-img">
        </div>

        <div class="pb-8 pt-6 px-6 border-top">
            <p v-html="project.description" class="text-menu-text font-fira_retina text-sm mb-5">
            </p>
            <div class="flex justify-start">
              <a v-if="project.git_url != null" id="view-button" :href="project.git_url" target="_blank" class="text-white font-fira_retina py-2 px-4 mr-5 w-fit text-xs rounded-lg">
                  view-github
              </a>
              <a v-if="project.youtube != null" id="view-button" :href="project.youtube" target="_blank" class="text-white font-fira_retina py-2 px-4 mr-5 w-fit text-xs rounded-lg">
                  video-demo
              </a>
              <a v-if="project.web_url != null" id="view-button" :href="project.web_url" target="_blank" class="text-white font-fira_retina py-2 px-4 w-fit text-xs rounded-lg">
                  website
              </a>
            </div>
        </div>
    </div>
</div>
</template>

<script setup>
const { project, projectKey, index } = defineProps(['project', 'projectKey', 'index'])
</script>

<style scoped>
#project {
  min-width: 400px;
  margin-bottom: 5px;
}

#project-card {
  border: 1px solid #1E2D3D;
  background-color: #011221;
  border-radius: 15px;
  max-width: 400px;
}

#window {
  position: relative;
  overflow: hidden;
}

.aspect-ratio-container {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  position: relative;
}

.showcase-img {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 15px 15px 0 0;
}

@media (max-width: 768px) {
#project {
  min-width: 100%;
}
}

@media (min-width: 768px) {
#project {
  width: 100%;
  min-width: 100%;
  padding-inline: 5px;
}
}

@media (min-width: 1350px) {
#project {
  width: 100%;
  min-width: 100%;
  padding-inline: 20px;
}
}
</style>
