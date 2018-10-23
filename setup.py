#!/usr/bin/env python

import sys
import glob

try:
    from setuptools import setup  #, find_packages
except ImportError:
    raise sys.exit('Could not import setuptools.')


files = glob.glob('pyqmix_frontend/build/*')

setup(
    packages=['pyqmix_web', 'pyqmix_web.fronted'],
    package_dir={'pyqmix_web': 'pyqmix_backend',
                 'pyqmix_web.fronted': 'pyqmix_frontend'},
    include_package_data=True  # Include files from MANIFEST.in
)
