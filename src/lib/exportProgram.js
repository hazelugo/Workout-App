/**
 * Utilities for exporting workout programs in Plaintext and PDF
 */

/**
 * Format a program (built-in or custom) into clean, human-readable plaintext.
 * @param {Object} program - Program object (built-in or custom)
 * @param {Object} [options] - Export options
 * @param {number|null} [options.phaseIndex] - Optional phase index to export only one phase
 * @param {'all'|'home'|'gym'} [options.track] - Track to include for built-in program ('all', 'home', 'gym')
 * @returns {string} Plaintext formatted program
 */
export function formatProgramAsText(program, options = {}) {
  if (!program) return ''

  const { phaseIndex = null, track = 'all' } = options
  const lines = []
  const divider = '='.repeat(50)
  const subDivider = '-'.repeat(50)

  // Check if it is a built-in program (has phases array)
  if (Array.isArray(program.phases)) {
    lines.push(divider)
    lines.push('PROGRAM: Build From Zero (8-Week Program)')
    lines.push('Home & Gym Tracks | 5 days/week | 20-30 min')
    lines.push(divider)
    lines.push('')

    const phasesToExport = phaseIndex !== null && program.phases[phaseIndex]
      ? [{ ...program.phases[phaseIndex], originalIndex: phaseIndex }]
      : program.phases.map((p, idx) => ({ ...p, originalIndex: idx }))

    phasesToExport.forEach((phase, pIdx) => {
      lines.push(`PHASE ${phase.id || pIdx + 1}: ${phase.name.toUpperCase()} (${phase.weeks})`)
      if (phase.subtitle) {
        lines.push(`Focus: ${phase.subtitle}`)
      }
      lines.push(subDivider)
      lines.push('')

      if (Array.isArray(phase.days)) {
        phase.days.forEach((day) => {
          lines.push(`* ${day.day.toUpperCase()} - ${day.label}`)

          // Home track
          if (track === 'all' || track === 'home') {
            const homeExercises = day.home || []
            if (homeExercises.length > 0) {
              if (track === 'all' && day.gym) lines.push('  [Home Track]')
              homeExercises.forEach((ex, exIdx) => {
                lines.push(`  ${exIdx + 1}. ${ex.name} - ${ex.sets} sets x ${ex.reps}`)
                if (ex.note) {
                  lines.push(`     Note: ${ex.note}`)
                }
              })
            }
          }

          // Gym track
          if (track === 'all' || track === 'gym') {
            const gymExercises = day.gym || []
            if (gymExercises.length > 0) {
              if (track === 'all') lines.push('  [Gym Track]')
              gymExercises.forEach((ex, exIdx) => {
                lines.push(`  ${exIdx + 1}. ${ex.name} - ${ex.sets} sets x ${ex.reps}`)
                if (ex.note) {
                  lines.push(`     Note: ${ex.note}`)
                }
              })
            }
          }

          lines.push('')
        })
      }
      lines.push('')
    })
  } else {
    // Custom program format
    const programName = program.name || 'Custom Workout Program'
    lines.push(divider)
    lines.push(`PROGRAM: ${programName.toUpperCase()}`)
    lines.push(divider)
    lines.push('')

    const days = program.custom_program_days || program.days || []
    if (days.length === 0) {
      lines.push('No workouts saved in this program.')
    } else {
      // Sort days in natural weekday order if possible
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const sortedDays = [...days].sort((a, b) => {
        const idxA = dayOrder.indexOf(a.day_name || a.day)
        const idxB = dayOrder.indexOf(b.day_name || b.day)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        return 0
      })

      sortedDays.forEach((day) => {
        const dayName = day.day_name || day.day || 'Workout'
        const dayTitle = day.title || day.label || ''
        lines.push(`* ${dayName.toUpperCase()}${dayTitle ? ` - ${dayTitle}` : ''}`)
        lines.push(subDivider)

        const exercises = day.exercises || []
        if (exercises.length === 0) {
          lines.push('  (Rest / No exercises programmed)')
        } else {
          exercises.forEach((ex, exIdx) => {
            const sets = ex.sets ? `${ex.sets} sets` : ''
            const reps = ex.reps ? `${ex.reps} reps` : ''
            const setRepStr = [sets, reps].filter(Boolean).join(' x ')
            lines.push(`  ${exIdx + 1}. ${ex.name}${setRepStr ? ` - ${setRepStr}` : ''}`)
            if (ex.note) {
              lines.push(`     Note: ${ex.note}`)
            }
          })
        }
        lines.push('')
      })
    }
  }

  return lines.join('\n').trim()
}

/**
 * Copy text content to clipboard with fallback.
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export async function copyTextToClipboard(text) {
  if (!text) return false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    textArea.remove()
    return successful
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

/**
 * Trigger a browser download of a plain text file.
 * @param {string} filename 
 * @param {string} content 
 */
export function downloadTextFile(filename, content) {
  const safeFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = safeFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate a print-ready HTML page and trigger browser PDF printing.
 * @param {Object} program - Program object (built-in or custom)
 * @param {Object} [options] - Options
 */
export function exportProgramToPdf(program, options = {}) {
  const isBuiltIn = Array.isArray(program.phases)
  const programTitle = isBuiltIn
    ? 'Build From Zero — 8 Week Program'
    : (program.name || 'Custom Workout Program')

  const { phaseIndex = null, track = 'all' } = options

  let contentHtml = ''

  if (isBuiltIn) {
    const phasesToExport = phaseIndex !== null && program.phases[phaseIndex]
      ? [{ ...program.phases[phaseIndex], originalIndex: phaseIndex }]
      : program.phases.map((p, idx) => ({ ...p, originalIndex: idx }))

    contentHtml = phasesToExport.map((phase) => `
      <section class="phase-section">
        <div class="phase-header">
          <h2>${escapeHtml(phase.name)} <span class="weeks-badge">${escapeHtml(phase.weeks)}</span></h2>
          ${phase.subtitle ? `<p class="subtitle">${escapeHtml(phase.subtitle)}</p>` : ''}
        </div>
        <div class="days-grid">
          ${(phase.days || []).map((day) => `
            <div class="day-box">
              <div class="day-title-row">
                <h3>${escapeHtml(day.day)}</h3>
                <span class="day-label">${escapeHtml(day.label)}</span>
              </div>

              ${(track === 'all' || track === 'home') && day.home?.length ? `
                <div class="track-group">
                  ${track === 'all' && day.gym ? '<div class="track-name">Home Track</div>' : ''}
                  <table class="workout-table">
                    <thead>
                      <tr>
                        <th>Exercise</th>
                        <th class="text-center">Sets</th>
                        <th class="text-center">Reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${day.home.map((ex) => `
                        <tr>
                          <td>
                            <strong>${escapeHtml(ex.name)}</strong>
                            ${ex.note ? `<div class="note">${escapeHtml(ex.note)}</div>` : ''}
                          </td>
                          <td class="text-center"><strong>${escapeHtml(String(ex.sets || ''))}</strong></td>
                          <td class="text-center">${escapeHtml(String(ex.reps || ''))}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              ${(track === 'all' || track === 'gym') && day.gym?.length ? `
                <div class="track-group">
                  ${track === 'all' ? '<div class="track-name">Gym Track</div>' : ''}
                  <table class="workout-table">
                    <thead>
                      <tr>
                        <th>Exercise</th>
                        <th class="text-center">Sets</th>
                        <th class="text-center">Reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${day.gym.map((ex) => `
                        <tr>
                          <td>
                            <strong>${escapeHtml(ex.name)}</strong>
                            ${ex.note ? `<div class="note">${escapeHtml(ex.note)}</div>` : ''}
                          </td>
                          <td class="text-center"><strong>${escapeHtml(String(ex.sets || ''))}</strong></td>
                          <td class="text-center">${escapeHtml(String(ex.reps || ''))}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `).join('')
  } else {
    // Custom program
    const days = program.custom_program_days || program.days || []
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const sortedDays = [...days].sort((a, b) => {
      const idxA = dayOrder.indexOf(a.day_name || a.day)
      const idxB = dayOrder.indexOf(b.day_name || b.day)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      return 0
    })

    contentHtml = `
      <div class="days-grid">
        ${sortedDays.map((day) => `
          <div class="day-box">
            <div class="day-title-row">
              <h3>${escapeHtml(day.day_name || day.day || 'Workout')}</h3>
              ${day.title ? `<span class="day-label">${escapeHtml(day.title)}</span>` : ''}
            </div>
            ${(day.exercises || []).length === 0 ? `
              <p class="empty-day">Rest / No exercises programmed</p>
            ` : `
              <table class="workout-table">
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th class="text-center">Sets</th>
                    <th class="text-center">Reps</th>
                  </tr>
                </thead>
                <tbody>
                  ${(day.exercises || []).map((ex) => `
                    <tr>
                      <td>
                        <strong>${escapeHtml(ex.name || '')}</strong>
                        ${ex.note ? `<div class="note">${escapeHtml(ex.note)}</div>` : ''}
                      </td>
                      <td class="text-center"><strong>${escapeHtml(String(ex.sets || ''))}</strong></td>
                      <td class="text-center">${escapeHtml(String(ex.reps || ''))}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        `).join('')}
      </div>
    `
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to export as PDF.')
    return
  }

  const printDocumentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(programTitle)} - Workout Export</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111;
      background: #fff;
      font-size: 10pt;
      line-height: 1.4;
      padding: 10px;
    }
    header {
      border-bottom: 2pt solid #111;
      padding-bottom: 8px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    h1 {
      font-family: Georgia, serif;
      font-size: 18pt;
      font-weight: 700;
      color: #000;
      letter-spacing: -0.5px;
    }
    .header-meta {
      font-size: 8.5pt;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .phase-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .phase-header {
      margin-bottom: 10px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
    }
    .phase-header h2 {
      font-size: 13pt;
      font-weight: 700;
      display: inline-block;
      margin-right: 8px;
    }
    .weeks-badge {
      font-size: 9pt;
      font-weight: normal;
      color: #555;
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .subtitle {
      font-size: 9pt;
      color: #666;
      font-style: italic;
      margin-top: 2px;
    }
    .days-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .day-box {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px 12px;
      background: #fafafa;
      page-break-inside: avoid;
    }
    .day-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
    }
    .day-title-row h3 {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .day-label {
      font-size: 8pt;
      font-weight: 700;
      background: #e5e5e5;
      padding: 2px 6px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .track-name {
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #444;
      margin: 6px 0 4px;
    }
    .workout-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 6px;
    }
    .workout-table th {
      text-align: left;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      border-bottom: 1px solid #ccc;
      padding: 4px 6px;
    }
    .workout-table td {
      padding: 5px 6px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    .workout-table tr:last-child td {
      border-bottom: none;
    }
    .text-center {
      text-align: center !important;
    }
    .note {
      font-size: 8pt;
      color: #666;
      font-style: italic;
      margin-top: 2px;
    }
    .empty-day {
      font-size: 9pt;
      color: #777;
      font-style: italic;
      padding: 6px 0;
    }
    footer {
      margin-top: 20px;
      border-top: 1px solid #ccc;
      padding-top: 6px;
      font-size: 8pt;
      color: #888;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(programTitle)}</h1>
      <div class="header-meta">Workout Training Plan Export</div>
    </div>
    <div class="header-meta">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
  </header>

  ${contentHtml}

  <footer>
    <span>Generated by Workout App</span>
    <span>Ready for training</span>
  </footer>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 300);
    });
  </script>
</body>
</html>`;

  printWindow.document.open()
  printWindow.document.write(printDocumentHtml)
  printWindow.document.close()
}

function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
