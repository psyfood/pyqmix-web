#!/usr/bin/env python

import sys

try:
    from setuptools import setup  #, find_packages
except ImportError:
    raise sys.exit('Could not import setuptools.')


setup(packages=['pyqmix_web'],
      package_dir={'pyqmix_web': 'pyqmix_backend'})
