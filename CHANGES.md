2019.1
------
- Improve, fix, and update how to create an executable
- Turn `pyqmix-web` into a proper Python package that can be published on PyPI
- Add entry point script, such that the user can now simply enter `pyqmix-web`
  in their terminal after installation, which will fire up the backend and
  open the browser
- Add versioneer
- Enable user to specify pump configuration directory
- Styling of frontend served via the build
- Update to `react-scripts` 2.1.3

2018.11.07
----------
- Display version number of installed `pyqmix` in the frontend

2018.11.05
----------
- Abort current pump operation if user initiates a new one
- User can terminate current pump routine, but not modify it   
- Only read pyqmix.config during startup

2018.10.21
----------
- Remove superfluous files

2018.10.xx
----------
- Documentation improvements

2018.10.17
----------
First release.
