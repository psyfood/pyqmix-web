# pyqmix-web
Remote-control interface and web-app for pyqmix

[![Latest PyPI Release](https://img.shields.io/pypi/v/pyqmix-web.svg)](https://pypi.org/project/pyqmix-web/)
[![Conda Version](https://img.shields.io/conda/vn/conda-forge/pyqmix-web.svg)](https://anaconda.org/conda-forge/pyqmix-web)


## Operate via downloadable executable
The user-visible part of pyqmix-web runs in the web browser. You need a modern browser to run the application. Recent versions of Chrome, Firefox, and Safari work well; Microsoft Internet Explorer is not supported.

- Download the latest pyqmix-web release from https://github.com/psyfood/pyqmix-web/releases (you will want to get the `.exe` file).
- Run the `.exe` file
- Have fun!

## Install into your Python environment
### Install via `conda`
To install into a new environment (recommended) named `pyqmix-web`
  - Type: `conda create -n pyqmix-web -c conda-forge pyqmix-web`

To install into your currently active `conda` environment
  - Type: `conda install -c conda-forge pyqmix-web`

### Install via `pip`
If you are not using `conda`, you may install `pyqmix-web` via `pip`
  - Type: `pip install pyqmix-web`

### Run `pyqmix-web` via executable
The installation automatically creates a `pyqmix-web` executable, which you can run from your terminal
- Open your terminal (e.g., the `Anaconda Prompt` or `cmd.exe`)
- Activate your `pyqmix-web` Python environment
  - Type: `conda activate pyqmix-web` when using `conda`
- Start up `pyqmix-web`
  - Type: `pyqmix-web`

The backend should start, and a browser window should open automatically, displaying the `pyqmix-web` frontend.

### Run `pyqmix-web` from your Python script
```python
import pyqmix_web.run
pyqmix_web.run.run(open_browser=True)
```
## Installation instructions for developers 
- Clone this (`pyqmix-web`) repository 

### Install backend dependencies
- Open the `Anaconda Prompt`
- Type: `conda create -n pyqmix-web -c conda-forge pyqmix flask flask-restplus`
  to create a new environment named `pyqmix-web`

### Run the backend
- Activate the virtual environment
  - Type: `conda activate pyqmix-web`
- Navigate to the `pyqmix-web` folder
- Set the required environment variables
  - Type:
      ```
      FLASK_APP=pyqmix_backend/backend_app.py
      FLASK_ENV=development
      FLASK_DEBUG=1
      ```
- Start up `Flask` to serve the backend
  - Type: `flask run`

`Flask` is now running in debugging mode and will reload `pyqmix-web` whenever you modify the backend code.

### Install frontend dependencies
- Install Node.js from https://nodejs.org/en/download/
  - Select the _Current Latest Features_ 64-bit windows installer (.msi)
  - Accept default settings during installation
- Open your terminal (e.g., `cmd.exe`)
  - Browse to the `pyqmix_frontend` subfolder of `pyqmix-web`
  - Type: `npm install`

### Run the frontend

- Start the `Node.js` development server
    - Type: `npm run start`

`Node.js` is now running in debugging mode and will reload `pyqmix-web` whenever you modify the frontend code.
