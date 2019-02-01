#!/usr/bin/env python

import sys
import pathlib
import versioneer

try:
    from setuptools import setup
except ImportError:
    raise sys.exit('Could not import setuptools.')

if not pathlib.Path('./pyqmix_frontend/build').exists():
    msg = 'Please run `npm build` in the `pyqmix_frontend` directort first.'
    raise RuntimeError(msg)

setup(
    version=versioneer.get_version(),
    cmdclass=versioneer.get_cmdclass(),
    packages=['pyqmix_web', 'pyqmix_web.frontend'],
    package_dir={'pyqmix_web': 'pyqmix_backend',
                 'pyqmix_web.frontend': 'pyqmix_frontend'},
    include_package_data=True  # Include files from MANIFEST.in
)
