<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="export-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        @click.self="close"
        @keydown.esc="close"
      >
        <div class="export-sheet">
          <!-- Header -->
          <div class="export-header">
            <div>
              <span class="export-eyebrow">Export Program</span>
              <h2 id="export-modal-title" class="export-title">
                {{ programTitle }}
              </h2>
            </div>
            <button
              class="export-close-btn"
              aria-label="Close export modal"
              @click="close"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <!-- Body -->
          <div class="export-body">
            <!-- Options for built-in program -->
            <div v-if="isBuiltIn" class="export-options-group">
              <div class="option-row">
                <label class="option-label" for="export-scope-select">Scope</label>
                <select
                  id="export-scope-select"
                  v-model="selectedScope"
                  class="export-select"
                >
                  <option value="all">Full 8-Week Program (All Phases)</option>
                  <option
                    v-for="(p, idx) in program.phases"
                    :key="p.id"
                    :value="idx"
                  >
                    Phase {{ p.id }}: {{ p.name }} ({{ p.weeks }})
                  </option>
                </select>
              </div>

              <div class="option-row">
                <label class="option-label" for="export-track-select">Track</label>
                <select
                  id="export-track-select"
                  v-model="selectedTrack"
                  class="export-select"
                >
                  <option value="all">Both Tracks (Home &amp; Gym)</option>
                  <option value="home">Home Track Only (No equipment)</option>
                  <option value="gym">Gym Track Only</option>
                </select>
              </div>
            </div>

            <!-- Plaintext Preview -->
            <div class="preview-section">
              <div class="preview-header">
                <span class="preview-label">Plaintext Preview</span>
                <span class="preview-meta">{{ lineCount }} lines</span>
              </div>
              <textarea
                class="preview-textarea"
                readonly
                :value="formattedText"
                aria-label="Export plaintext preview"
              />
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="export-footer">
            <button
              class="btn-action btn-copy"
              :class="{ copied: isCopied }"
              @click="handleCopy"
            >
              <span v-if="isCopied" aria-hidden="true">✓ </span>
              <span>{{ isCopied ? 'Copied to Clipboard' : 'Copy Text' }}</span>
            </button>

            <button
              class="btn-action btn-download"
              @click="handleDownload"
            >
              <span>Download .txt</span>
            </button>

            <button
              class="btn-action btn-pdf"
              @click="handlePdf"
            >
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  formatProgramAsText,
  copyTextToClipboard,
  downloadTextFile,
  exportProgramToPdf,
} from '@/lib/exportProgram'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  program: {
    type: Object,
    default: null,
  },
  initialPhaseIndex: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['close'])

const isBuiltIn = computed(() => Array.isArray(props.program?.phases))
const programTitle = computed(() => {
  if (!props.program) return 'Workout Program'
  if (isBuiltIn.value) return 'Build From Zero (8-Week Program)'
  return props.program.name || 'Custom Program'
})

const selectedScope = ref(props.initialPhaseIndex !== null ? props.initialPhaseIndex : 'all')
const selectedTrack = ref('all')
const isCopied = ref(false)
let copyTimer = null

watch(
  () => props.initialPhaseIndex,
  (val) => {
    if (val !== null) selectedScope.value = val
  },
)

const formattedText = computed(() => {
  if (!props.program) return ''
  const phaseIndex = selectedScope.value === 'all' ? null : Number(selectedScope.value)
  return formatProgramAsText(props.program, {
    phaseIndex,
    track: selectedTrack.value,
  })
})

const lineCount = computed(() => {
  if (!formattedText.value) return 0
  return formattedText.value.split('\n').length
})

function close() {
  emit('close')
}

async function handleCopy() {
  const success = await copyTextToClipboard(formattedText.value)
  if (success) {
    isCopied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      isCopied.value = false
    }, 2500)
  }
}

function handleDownload() {
  const baseName = isBuiltIn.value
    ? selectedScope.value === 'all'
      ? 'Build-From-Zero-8-Week-Program'
      : `Build-From-Zero-Phase-${Number(selectedScope.value) + 1}`
    : (props.program?.name || 'Custom-Program').replace(/[^a-zA-Z0-9_-]/g, '_')

  downloadTextFile(`${baseName}.txt`, formattedText.value)
}

function handlePdf() {
  const phaseIndex = selectedScope.value === 'all' ? null : Number(selectedScope.value)
  exportProgramToPdf(props.program, {
    phaseIndex,
    track: selectedTrack.value,
  })
}
</script>

<style scoped>
.export-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(6px);
  z-index: 150;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

@media (min-width: 600px) {
  .export-backdrop {
    align-items: center;
    padding: 24px;
  }
}

.export-sheet {
  width: 100%;
  max-width: 580px;
  background: oklch(11% 0.01 45);
  border: 1px solid oklch(20% 0.008 45);
  border-radius: 16px 16px 0 0;
  padding: 24px 20px clamp(24px, 5vw, 32px);
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.7);
}

@media (min-width: 600px) {
  .export-sheet {
    border-radius: 14px;
    padding: 28px 24px;
    max-height: 84dvh;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
  }
}

.export-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid oklch(16% 0.008 45);
}

.export-eyebrow {
  display: block;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.6875rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #a3a3a3;
  margin-bottom: 4px;
}

.export-title {
  font-family: Georgia, serif;
  font-size: 1.25rem;
  font-weight: 400;
  color: #f5f5f5;
  margin: 0;
}

.export-close-btn {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #a3a3a3;
  cursor: pointer;
  font-size: 26px;
  line-height: 1;
  padding: 0;
  border-radius: 6px;
  transition: color 150ms;
}

.export-close-btn:hover {
  color: #ffffff;
}

.export-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.export-options-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: oklch(9% 0.012 45);
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid oklch(16% 0.008 45);
}

.option-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (min-width: 480px) {
  .option-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.option-label {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #a3a3a3;
}

.export-select {
  min-height: 42px;
  padding: 8px 12px;
  background: oklch(12% 0.008 45);
  border: 1px solid oklch(22% 0.008 45);
  border-radius: 6px;
  color: #f5f5f5;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.8125rem;
  cursor: pointer;
}

.export-select:focus {
  outline: none;
  border-color: #a78bfa;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-label {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.6875rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #a3a3a3;
  font-weight: 600;
}

.preview-meta {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.6875rem;
  color: #737373;
}

.preview-textarea {
  width: 100%;
  height: 180px;
  padding: 12px 14px;
  background: oklch(8% 0.012 45);
  border: 1px solid oklch(18% 0.008 45);
  border-radius: 8px;
  color: #d4d4d4;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
}

.preview-textarea:focus {
  outline: none;
  border-color: oklch(26% 0.008 45);
}

.export-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid oklch(16% 0.008 45);
}

.btn-action {
  flex: 1;
  min-width: 130px;
  min-height: 48px;
  padding: 10px 16px;
  border-radius: 8px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 160ms ease-out;
}

.btn-copy {
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(24% 0.008 45);
  color: #f5f5f5;
}

.btn-copy:hover {
  background: oklch(18% 0.008 45);
}

.btn-copy.copied {
  background: #15803d;
  border-color: #22c55e;
  color: #ffffff;
}

.btn-download {
  background: oklch(14% 0.008 45);
  border: 1px solid oklch(24% 0.008 45);
  color: #f5f5f5;
}

.btn-download:hover {
  background: oklch(18% 0.008 45);
}

.btn-pdf {
  background: #ffffff;
  border: 1px solid #ffffff;
  color: #000000;
  font-weight: 700;
}

.btn-pdf:hover {
  background: #e5e5e5;
}

/* ── Modal Fade Animation ────────────────────────────────── */
.modal-fade-enter-active {
  transition: opacity 180ms ease-out;
}
.modal-fade-leave-active {
  transition: opacity 140ms ease-in;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
