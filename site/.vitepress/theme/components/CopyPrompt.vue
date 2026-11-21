<script setup>
import { onUnmounted, ref } from 'vue';

const props = defineProps({
  prompt: { type: String, required: true },
});

const labels = {
  idle: 'Copy prompt',
  copied: 'Copied!',
  failed: 'Copy failed',
};

const status = ref('idle');
let resetTimer;

async function copy() {
  try {
    await navigator.clipboard.writeText(props.prompt);
    status.value = 'copied';
  } catch {
    status.value = 'failed';
  }

  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    status.value = 'idle';
  }, 2000);
}

onUnmounted(() => clearTimeout(resetTimer));
</script>

<template>
  <div class="copy-prompt">
    <p class="copy-prompt-text">{{ prompt }}</p>
    <button
      type="button"
      class="copy-prompt-button"
      aria-live="polite"
      @click="copy"
    >
      {{ labels[status] }}
    </button>
  </div>
</template>

<style scoped>
.copy-prompt {
  display: flex;
  flex-wrap: wrap;
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
  min-width: 0;
  overflow-wrap: anywhere;
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

.copy-prompt-button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
</style>
