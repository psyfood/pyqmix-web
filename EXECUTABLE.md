# How to create an executable of a web-application

## This guideline assumes that:
- A `run.py` file has been created. 
Check out the `run.py` file in this repository.
- Flask serves static files from the `pyqmix` sub-directory of an automatically created temporary folder. The exact location of this folder is saved in the environment variabe `_MEIPASS` when the `PyInstaller`-created standalone exectuable is started. Typically it will be located inside the current user's `AppData\Local\Temp` folder.
Check out the `app.py` file in this repository. 
- The frontend and backend are located in neighboring directories

## Prepare the Python virtual environment for the backend
- Create a virtual environment
- Install the required dependencies: `flask`, `flask-restplus`, and, of course, `pyqmix`
- Install `PyInstaller`

## Create a production build of the React frontend
1. Open a terminal
2. Browse to the `pyqmix_frontend` directory
4. Type: `npm run build`

This will create a `build`-folder in the current directory  

## Create a specification file
Specification files can be reused to generate executables so keep the file for the next build. 
Skip this step if you already have a specification file.
1. Open a terminal 
2. Browse to the backend-directory
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

## Build the executable
1. Open a terminal 
2. Browse to the `pyqmix_backend` directory
3. Activate the virtual environment
4. Type: `pyinstaller --clean run.spec`

This generates a `run.exe` file inside the the backend's `dist` folder. 
