import ReactDiffViewer from 'react-diff-viewer-continued'

interface CodeDiffViewerProps {
  oldCode?: string
  newCode?: string
}

const diffStyles = {
  variables: {
    dark: {
      diffViewerBackground: '#020617',
      diffViewerColor: '#e2e8f0',
      addedBackground: 'rgba(16, 185, 129, 0.10)',
      addedColor: '#d1fae5',
      removedBackground: 'rgba(248, 113, 113, 0.12)',
      removedColor: '#fecaca',
      wordAddedBackground: 'rgba(34, 197, 94, 0.26)',
      wordRemovedBackground: 'rgba(239, 68, 68, 0.26)',
      addedGutterBackground: 'rgba(16, 185, 129, 0.18)',
      removedGutterBackground: 'rgba(248, 113, 113, 0.18)',
      gutterBackground: '#020617',
      gutterBackgroundDark: '#020617',
      highlightBackground: 'rgba(99, 102, 241, 0.08)',
      highlightGutterBackground: 'rgba(99, 102, 241, 0.18)',
      codeFoldGutterBackground: '#0f172a',
      codeFoldBackground: '#0f172a',
      emptyLineBackground: '#020617',
      gutterColor: '#64748b',
      addedGutterColor: '#a7f3d0',
      removedGutterColor: '#fca5a5',
      codeFoldContentColor: '#94a3b8',
    },
  },
  diffContainer: {
    border: '1px solid rgba(148, 163, 184, 0.12)',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(2, 6, 23, 0.35)',
  },
  splitView: {
    borderLeft: '1px solid rgba(148, 163, 184, 0.12)',
  },
  line: {
    fontSize: '13px',
    lineHeight: '1.6',
  },
  marker: {
    minWidth: '32px',
  },
  contentText: {
    fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace',
  },
} as const

export function CodeDiffViewer({ oldCode, newCode }: CodeDiffViewerProps) {
  const beforeCode = oldCode?.trim() || '// No current snippet provided'
  const afterCode = newCode?.trim() || '// No suggested fix provided'

  return (
    <div className="overflow-hidden rounded-[22px] bg-slate-950/80">
      <ReactDiffViewer
        oldValue={beforeCode}
        newValue={afterCode}
        splitView
        hideLineNumbers={false}
        showDiffOnly={false}
        extraLinesSurroundingDiff={2}
        leftTitle="Before"
        rightTitle="After"
        useDarkTheme
        styles={diffStyles}
      />
    </div>
  )
}
