# -*- mode: python -*-


# See:
# https://stackoverflow.com/a/50402636/1944216
# https://pythonhosted.org/PyInstaller/spec-files.html#globals-available-to-the-spec-file
block_cipher = None
import os
spec_root = os.path.abspath(SPECPATH)

a = Analysis(['run.py'],
             pathex=[spec_root],
             binaries=[],
             datas=[('../pyqmix_frontend/build', 'pyqmix-web')],
             hiddenimports=[],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher,
             noarchive=False)

pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          [],
          name='pyqmix-web',
          debug=False,
          bootloader_ignore_signals=False,
          strip=False,
          upx=True,
          runtime_tmpdir=None,
          console=True,
          icon='../pyqmix_frontend/public/pyqmixweb_desktop_icon.ico')
