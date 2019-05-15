# How to create an executable of a web-application

## This guideline assumes that:
- A `run.py` file has been created. 
Check out the `run.py` file in this repository.
- Flask serves static files from an automatically created temporary folder. The exact location of this folder is saved in the environment variable `_MEIPASS` when the `PyInstaller`-created standalone exectuable is started. Typically it will be located inside the current user's `AppData\Local\Temp` folder.
Check out the `app.py` file in this repository. 
- The frontend and backend are located in neighboring directories

## Prepare the Python virtual environment for the backend
- Create a virtual environment
- Install the required dependencies: ` pip install flask flask-restplus pyqmix`. The executable will only work if flask and flask-restplus are installed via pip. 
- Install PyInstaller: `pip install PyInstaller`
- The newest `jsonschema` module does not work with PyInstaller. Instead, use `jsonchema` in an older version, for example: 2.6.0.    
- Install pyqmix-web: Browse to the `pyqmix-web` root directory and run `pip install .`

## Create a production build of the React frontend
1. Open a terminal
2. Browse to the `pyqmix_frontend` directory
4. Type: `npm run build`

This will create a `build`-folder in the current directory  

## Create a specification file
Specification files can be reused to generate executables so keep the file for the next build. 
Skip this step if you already have a specification file.
1. Open a terminal 
2. Browse to the `pyqmix_backend` directory
3. Activate the virtual environment
4. Type: `pyinstaller --onefile run.py`
This will create a run.spec file in the backend directory. 
5. Open the run.spec file and edit it:
	* Add the following to the top of the script: 
	  ```python
	  import os
	  spec_root = os.path.abspath(SPECPATH)
	  ```
	* Edit pathex to: `pathex=[spec_root]`
	* Edit datas to: `datas=[('../name_of_frontend_folder/build', 'name_of_web_application')]`
    * Optionally, you can add an icon to your standalone. Add `icon='../pyqmix_frontend/public/pyqmixweb_desktop_icon.ico'` to the EXE-section of run.spec.
    
## Build the executable
1. Open a terminal 
2. Browse to the `pyqmix_backend` directory
3. Activate the virtual environment
4. Type: `pyinstaller --clean run.spec`

This generates an `.exe` file inside the backend's `dist` folder. 
