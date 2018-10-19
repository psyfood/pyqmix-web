# pyqmix-web
Remote-control interface and web-app for pyqmix

## Operate via executable
The user-visible part of pyqmix-web runs in the web browser. You need a modern browser to run the application. Recent versions of Chrome, Firefox, and Safari work well; Microsoft Internet Explorer is not supported.

- Download the latest pyqmix-web release from https://github.com/psyfood/pyqmix-web/releases (you will want to get the `.exe` file).
- Run the `.exe` file
- Have fun!

## Installation instructions for developers 
- Clone this (pyqmix-web) repository 

### Set up frontend
- Install nodeJS from https://nodejs.org/en/download/
  - Select 'Current Latest Features' 64-bit windows installer (.msi)
  - Accept default settings during installation
- Open the Node.js command prompt 
  - Browse to the 'pyqmix_frontend'-folder in pyqmix-web
  - Type: `npm install`

### Set up backend
- Create a conda virtual environment
- Activate the virtual environment
  - Type: conda install flask
  - Type: pip install flask_restplus
  - Type: pip install pyqmix

