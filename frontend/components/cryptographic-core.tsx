'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Boxes, CheckCircle2, CircleAlert, Database, FileCode2, LockKeyhole, Pause, Play, RotateCcw, ScanLine, ShieldCheck, TriangleAlert, X } from 'lucide-react';

type AssetName = 'MD5' | 'RSA-2048' | 'AES-256-GCM' | 'Hardcoded Secret';
type Tone = 'gold' | 'teal' | 'amber' | 'blue' | 'green';

type Stage = { label: string; eyebrow: string; detail: string; tone: Tone };

const STAGES: Stage[] = [
  { label: 'Source', eyebrow: '01 · SOURCE INTAKE', detail: 'Repository evidence enters a traceable analysis boundary.', tone: 'gold' },
  { label: 'Scan', eyebrow: '02 · SCAN & PARSE', detail: 'ECDAT scans supported source without executing the repository.', tone: 'teal' },
  { label: 'Discover', eyebrow: '03 · CRYPTO DISCOVERY', detail: 'Algorithms, keys, operations, and source evidence are extracted.', tone: 'teal' },
  { label: 'CBOM', eyebrow: '04 · CBOM INVENTORY', detail: 'Evidence is organized into a cryptographic bill of materials.', tone: 'gold' },
  { label: 'Assess', eyebrow: '05 · DUAL RISK ASSESSMENT', detail: 'Current security and quantum exposure are evaluated separately.', tone: 'amber' },
  { label: 'Act', eyebrow: '06 · ACTION OUTPUT', detail: 'Mitigation reduces interim exposure while migration remains the target.', tone: 'blue' },
  { label: 'Verify', eyebrow: '07 · VERIFY & RE-SCAN', detail: 'Re-scan after external remediation; it is not automatic fixing or runtime proof.', tone: 'green' },
];

const ASSETS: Record<AssetName, { status: string; detail: string; kind: 'critical' | 'warning' | 'success' }> = {
  MD5: { status: 'BROKEN', detail: 'MD5 is broken for security-sensitive use. Replace it with a modern hash construction.', kind: 'critical' },
  'RSA-2048': { status: 'QUANTUM VULNERABLE', detail: 'RSA-2048 may be acceptable today, yet needs a migration plan for quantum exposure.', kind: 'warning' },
  'AES-256-GCM': { status: 'RETAIN', detail: 'Retain AES-256-GCM when correctly implemented, with nonce and key-management controls.', kind: 'success' },
  'Hardcoded Secret': { status: 'ROTATE', detail: 'Rotate the credential and remove it from source control.', kind: 'critical' },
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

function AssetChip({ asset, onSelect }: { asset: AssetName; onSelect: (asset: AssetName) => void }) {
  const { kind } = ASSETS[asset];
  return <button type="button" className={`pipeline-asset pipeline-asset-${kind}`} onClick={() => onSelect(asset)}>{asset}</button>;
}

export default function CryptographicCore() {
  const root = useRef<HTMLElement>(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [visible, setVisible] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);
  const [selected, setSelected] = useState<AssetName | null>(null);
  const stage = STAGES[stageIndex];
  const isPlaying = playing && !reducedMotion;

  useEffect(() => {
    if (!root.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .08 });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isPlaying || !visible) return;
    const timer = window.setInterval(() => setStageIndex(index => (index + 1) % STAGES.length), 3000);
    return () => window.clearInterval(timer);
  }, [isPlaying, visible]);

  const selectAsset = useCallback((asset: AssetName) => setSelected(asset), []);
  const seek = (index: number) => { setStageIndex(index); setPlaying(false); };
  const replay = () => { setSelected(null); setStageIndex(0); setPlaying(!reducedMotion); };

  return <section ref={root} className="cryptographic-core pipeline-core" data-stage={stageIndex} aria-label="ECDAT guided cryptographic scan workflow">
    <header className="pipeline-header">
      <div className="pipeline-caption"><span className={`pipeline-caption-dot pipeline-caption-${stage.tone}`} /><div><p>{stage.eyebrow}</p><strong>{stage.detail}</strong></div></div>
      <div className="pipeline-controls" aria-label="Guided scan animation controls">
        <button type="button" onClick={() => setPlaying(value => !value)} aria-pressed={isPlaying}>{isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}<span>{isPlaying ? 'Pause' : 'Play'}</span></button>
        <button type="button" onClick={replay}><RotateCcw aria-hidden="true" /><span>Replay</span></button>
      </div>
    </header>

    <div className="pipeline-workspace">
      <div className="pipeline-intake">
        <div className="pipeline-source-block pipeline-phase-source">
          <div className="pipeline-block-label"><FileCode2 aria-hidden="true" /> Source repository</div>
          <div className="pipeline-file-stack">
            <span>auth.py <i>Python</i></span><span>crypto_service.js <i>JavaScript</i></span><span>CryptoHelper.java <i>Java</i></span>
          </div>
        </div>
        <div className="pipeline-connector pipeline-phase-scan" aria-hidden="true"><span /></div>
        <div className="pipeline-scanner pipeline-phase-scan">
          <div className="pipeline-block-label"><ScanLine aria-hidden="true" /> Scan &amp; parse</div>
          <div className="pipeline-scan-window"><span className="pipeline-scan-beam" /><code>parse · classify · evidence</code></div>
        </div>
      </div>

      <div className="pipeline-middle-row">
        <div className="pipeline-discovery pipeline-phase-discovery">
          <div className="pipeline-block-label"><LockKeyhole aria-hidden="true" /> Crypto discovery</div>
          <div className="pipeline-assets"><AssetChip asset="RSA-2048" onSelect={selectAsset} /><AssetChip asset="AES-256-GCM" onSelect={selectAsset} /><AssetChip asset="MD5" onSelect={selectAsset} /><AssetChip asset="Hardcoded Secret" onSelect={selectAsset} /></div>
        </div>
        <div className="pipeline-connector pipeline-connector-short pipeline-phase-cbom" aria-hidden="true"><span /></div>
        <div className="pipeline-cbom pipeline-phase-cbom">
          <div className="pipeline-block-label"><Boxes aria-hidden="true" /> CBOM inventory</div>
          <div className="pipeline-cbom-table"><span><b>Algorithm</b><b>Operation</b></span><span><em>RSA-2048</em><i>Key establishment</i></span><span><em>AES-256-GCM</em><i>AEAD encryption</i></span><span><em>MD5</em><i>Hashing</i></span></div>
        </div>
      </div>

      <div className="pipeline-assessment pipeline-phase-assess">
        <div className="pipeline-assess-lane pipeline-current"><div><CircleAlert aria-hidden="true" /><span>Current security</span></div><p><b>MD5</b><em>Broken</em></p><p><b>Hardcoded Secret</b><em>Rotate</em></p></div>
        <div className="pipeline-assess-lane pipeline-quantum"><div><Database aria-hidden="true" /><span>Quantum risk</span></div><p><b>RSA-2048</b><em>Vulnerable</em></p><p><b>AES-256-GCM</b><em>Low concern</em></p></div>
      </div>

      <div className="pipeline-actions pipeline-phase-action">
        <div className="pipeline-action pipeline-mitigate"><TriangleAlert aria-hidden="true" /><div><strong>Mitigate</strong><span>Interim controls</span></div></div>
        <ArrowRight className="pipeline-action-arrow" aria-hidden="true" />
        <div className="pipeline-action pipeline-migrate"><ShieldCheck aria-hidden="true" /><div><strong>Migrate</strong><span>ML-KEM/hybrid · ML-DSA</span></div></div>
        <ArrowRight className="pipeline-action-arrow" aria-hidden="true" />
        <div className="pipeline-action pipeline-verify"><CheckCircle2 aria-hidden="true" /><div><strong>Verify</strong><span>Re-scan after change</span></div></div>
      </div>
    </div>

    {selected && <aside className="core-asset-drawer" aria-label={`${selected} guidance`}><button type="button" className="core-drawer-close" onClick={() => setSelected(null)} aria-label="Close asset guidance"><X aria-hidden="true" /></button><span>DISCOVERED CRYPTOGRAPHIC ASSET</span><strong>{selected}</strong><em>{ASSETS[selected].status}</em><p>{ASSETS[selected].detail}</p></aside>}

    <nav className="core-stage-tabs" aria-label="Guided scan stages">{STAGES.map((item, index) => <button key={item.label} type="button" aria-current={index === stageIndex ? 'step' : undefined} onClick={() => seek(index)} className={index === stageIndex ? 'is-active' : ''}><i>{String(index + 1).padStart(2, '0')}</i><span>{item.label}</span></button>)}</nav>
    <p className="sr-only" aria-live="polite">Stage {stageIndex + 1} of {STAGES.length}: {stage.detail}</p>
  </section>;
}
