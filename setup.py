#!/usr/bin/env python

import sys
import versioneer

try:
    from setuptools import setup  #, find_packages
except ImportError:
    raise sys.exit('Could not import setuptools.')

setup(
    version=versioneer.get_version(),
    cmdclass=versioneer.get_cmdclass(),
    packages=['pyqmix_web', 'pyqmix_web.frontend'],
    package_dir={'pyqmix_web': 'pyqmix_backend',
                 'pyqmix_web.frontend': 'pyqmix_frontend'},
    include_package_data=True  # Include files from MANIFEST.in
)
