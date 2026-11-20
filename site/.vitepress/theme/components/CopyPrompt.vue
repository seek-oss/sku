<script setup>
import { ref } from 'vue';

const props = defineProps({
  prompt: { type: String, required: true },
});

const copied = ref(false);
let resetTimer;

async function copy() {
  await navigator.clipboard.writeText(props.prompt);
  copied.value = true;
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<template>
  <div class="copy-prompt">
    <p class="copy-prompt-text">{{ prompt }}</p>
    <button type="button" class="copy-prompt-button" @click="copy">
      {{ copied ? 'Copied!' : 'Copy prompt' }}
    </button>
  </div>
</template>

<style scoped>
.copy-prompt {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
  padding: 12px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background-color: var(--vp-c-bg);
}

.copy-prompt-text {
  flex: 1;
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
}

.copy-prompt-button {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 6px;
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.25s;
}

.copy-prompt-button:hover {
  background-color: var(--vp-c-brand-2);
}
</style>
