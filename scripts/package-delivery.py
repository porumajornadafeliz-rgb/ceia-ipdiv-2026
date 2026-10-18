"""Empacota a versão atual; pacotes de correções anteriores permanecem históricos."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import json

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'entrega'
PUBLICATION = ROOT / 'dist/publicacao'

def package(name, files):
    with ZipFile(OUT / name, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for target, source in sorted(files.items()):
            info = ZipInfo(target, date_time=(2026, 10, 18, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, source.read_bytes())
    with ZipFile(OUT / name) as archive:
        assert archive.testzip() is None
        for target, source in files.items():
            assert archive.read(target) == source.read_bytes(), target
    print(name, (OUT / name).stat().st_size, 'bytes')

files = {str(p.relative_to(PUBLICATION)): p for p in PUBLICATION.rglob('*') if p.is_file()}
for name in ['PUBLICAR-CEIA-IPDIV-2026.zip', 'PUBLICAR-CEIA-IPDIV-2026-v2.zip']:
    package(name, files)
update = {k: p for k, p in files.items() if k.startswith('PUBLICO/')}
update.update({'LEIA-PRIMEIRO.txt': ROOT / 'docs/ATUALIZAR-PAGAMENTO-SIMPLIFICADO.md', 'LICENCAS.txt': ROOT / 'THIRD_PARTY_NOTICES.md'})
package('ATUALIZAR-PAGAMENTO-SIMPLIFICADO-IPDIV-2026.zip', update)
demo = {'ABRIR-DEMONSTRACAO.html': OUT / 'ABRIR-DEMONSTRACAO.html', 'COMO-ABRIR.txt': OUT / 'COMO-ABRIR.txt', 'LICENCAS.txt': ROOT / 'THIRD_PARTY_NOTICES.md'}
for name in ['DEMONSTRACAO-IPDIV-v12.zip', 'DEMONSTRACAO-IPDIV.zip']:
    package(name, demo)
source = {'ceia-ipdiv-2026/' + name: ROOT / name for name in ['README.md', 'package.json', 'package-lock.json', '.gitignore', 'THIRD_PARTY_NOTICES.md']}
for directory in ['src', 'scripts', 'tests', 'docs', 'assets', 'dist/public', 'dist/admin', 'dist/licenses', 'dist/publicacao']:
    for p in (ROOT / directory).rglob('*'):
        if p.is_file() and '__pycache__' not in p.parts:
            source['ceia-ipdiv-2026/' + str(p.relative_to(ROOT))] = p
source.update({'ceia-ipdiv-2026/' + name: p for name, p in demo.items()})
package('ceia-ipdiv-2026.zip', source)
for folder in ['PUBLICO', 'ADMINISTRACAO']:
    code = (PUBLICATION / folder / 'Code.gs').read_text()
    assert 'function limparTestesAntesDaDivulgacao' not in code
    manifest = json.loads((PUBLICATION / folder / 'appsscript.json').read_text())
    assert manifest['runtimeVersion'] == 'V8'
