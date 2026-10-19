"""Empacota a versão atual; pacotes de correções anteriores permanecem históricos."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import json
import sys

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'entrega'
PUBLICATION = ROOT / 'dist/publicacao'

def package(name, files, date_time=(2026, 10, 18, 0, 0, 0)):
    with ZipFile(OUT / name, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for target, source in sorted(files.items()):
            info = ZipInfo(target, date_time=date_time)
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, source.read_bytes())
    with ZipFile(OUT / name) as archive:
        assert archive.testzip() is None
        for target, source in files.items():
            assert archive.read(target) == source.read_bytes(), target
    print(name, (OUT / name).stat().st_size, 'bytes')

files = {str(p.relative_to(PUBLICATION)): p for p in PUBLICATION.rglob('*') if p.is_file()}
if '--confirm-checkbox' in sys.argv:
    admin = {k: p for k, p in files.items() if k.startswith('ADMINISTRACAO/')}
    assert set(admin) == {'ADMINISTRACAO/Code.gs', 'ADMINISTRACAO/appsscript.json'}
    assert 'function limparTestesAntesDaDivulgacao' not in (PUBLICATION / 'ADMINISTRACAO/Code.gs').read_text()
    admin.update({'LEIA-PRIMEIRO.txt': ROOT / 'docs/ATUALIZAR-CONFIRMAR.md', 'LICENCAS.txt': ROOT / 'THIRD_PARTY_NOTICES.md'})
    package('ATUALIZAR-CONFIRMAR-IPDIV-2026.zip', admin, date_time=(2026, 10, 19, 0, 0, 0))
    raise SystemExit(0)
if '--guarantee-checkbox' in sys.argv:
    admin = {k: p for k, p in files.items() if k.startswith('ADMINISTRACAO/')}
    assert set(admin) == {'ADMINISTRACAO/Code.gs', 'ADMINISTRACAO/appsscript.json'}
    assert 'function limparTestesAntesDaDivulgacao' not in (PUBLICATION / 'ADMINISTRACAO/Code.gs').read_text()
    admin.update({'LEIA-PRIMEIRO.txt': ROOT / 'docs/ATUALIZAR-CAIXA-VAGA-GARANTIDA.md', 'LICENCAS.txt': ROOT / 'THIRD_PARTY_NOTICES.md'})
    package('ATUALIZAR-CAIXA-VAGA-GARANTIDA-IPDIV-2026.zip', admin, date_time=(2026, 10, 19, 0, 0, 0))
    raise SystemExit(0)
if '--simple-confirmation' in sys.argv:
    update = {k: p for k, p in files.items() if k.startswith(('ADMINISTRACAO/', 'PUBLICO/'))}
    assert set(update) == {'ADMINISTRACAO/Code.gs', 'ADMINISTRACAO/appsscript.json', 'PUBLICO/Code.gs', 'PUBLICO/appsscript.json'}
    for folder in ['PUBLICO', 'ADMINISTRACAO']:
        code = (PUBLICATION / folder / 'Code.gs').read_text()
        assert 'function limparTestesAntesDaDivulgacao' not in code
        assert json.loads((PUBLICATION / folder / 'appsscript.json').read_text())['runtimeVersion'] == 'V8'
    update.update({'LEIA-PRIMEIRO.txt': ROOT / 'docs/ATUALIZAR-CONFIRMACAO-SIMPLES.md', 'LICENCAS.txt': ROOT / 'THIRD_PARTY_NOTICES.md'})
    package('ATUALIZAR-CONFIRMACAO-SIMPLES-IPDIV-2026.zip', update, date_time=(2026, 10, 19, 0, 0, 0))
    raise SystemExit(0)
if '--admin-only' in sys.argv:
    admin = {k: p for k, p in files.items() if k.startswith('ADMINISTRACAO/')}
    assert set(admin) == {'ADMINISTRACAO/Code.gs', 'ADMINISTRACAO/appsscript.json'}
    admin.update({'LEIA-PRIMEIRO.txt': ROOT / 'docs/ATUALIZAR-ADMINISTRACAO.md', 'LICENCAS.txt': ROOT / 'THIRD_PARTY_NOTICES.md'})
    package('ATUALIZAR-ADMINISTRACAO-IPDIV-2026.zip', admin, date_time=(2026, 10, 19, 0, 0, 0))
    raise SystemExit(0)
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
