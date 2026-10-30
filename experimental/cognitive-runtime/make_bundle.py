"""Create reproducible source/data manifest and ZIP without including volatile performance outputs."""
import hashlib,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent
ZIP=ROOT.parent/'semantiq_cognitive_phase6.zip'
files=sorted(f for f in ROOT.rglob('*') if f.is_file() and '__pycache__' not in f.parts and f.suffix!='.pyc' and f.name!='MANIFEST_SHA256.json')
fixed=[f for f in files if 'outputs' not in f.relative_to(ROOT).parts]
manifest={str(f.relative_to(ROOT)):hashlib.sha256(f.read_bytes()).hexdigest() for f in fixed}
(ROOT/'MANIFEST_SHA256.json').write_text(json.dumps({'scope':'fixed source, docs, fixtures, and tests; volatile outputs excluded','files':manifest},indent=2))
files.append(ROOT/'MANIFEST_SHA256.json')
with zipfile.ZipFile(ZIP,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for f in files:z.write(f,arcname=str(Path('semantiq_cognitive_phase6')/f.relative_to(ROOT)))
print(f'{ZIP}: {len(files)} files, {ZIP.stat().st_size} bytes, SHA256 {hashlib.sha256(ZIP.read_bytes()).hexdigest()}')
