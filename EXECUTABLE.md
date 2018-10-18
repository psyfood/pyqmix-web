# How to create an executable of a web-application

## This guideline assumes that:
- A run.py file has been created. 
Check out the run.py file in this repository. 
- That Flask serves static files from ...\AppData\Local\Temp\name_of_meipass_folder
when it is run via pyinstaller. 
Check out the app.py file in this repository. 
- The frontend and backend are located in neighboring directories

## Prepare a virtual environment 
- Create a virtual environment
- Install packages that are necessary for the web-application
- Flask must be installed via pip, and not conda
- Install pyinstaller

## Create a build of the frontend
1. Open a terminal
2. Browse to the frontend-directory
3. Activate the virtual environment created in the previous step
4. Write: ``` npm run build ```

This will create a 'build'-folder in the frontend directory  

## Create a specification file
Specification files can be reused to generate executables so keep the file for the next build. 
Skip this step if you already have a specification file.
1. Open a terminal 
2. Browse to the backend-directory
3. Activate the virtual environment
4. Type: ``` pyinstaller --onefile run.py ```
This will create a run.spec file in the backend directory. 
5. Open the run.spec file and edit it:
	* Add the following to the top of the script: import os
	* Add the following to the top of the script: spec_root = os.path.abspath(SPECPATH)
	* Edit pathex to: pathex=[spec_root]
	* Edit datas to: datas=[('../name_of_frontend_folder/build', 'name_of_web_application')]

## Build the executable
1. Open a terminal 
2. Browse to the backend-directory
3. Activate the virtual environment
4. Type: ``` pyinstaller --clean run.spec ```

The web-application can now be run via the run.exe file in the backend's 'dist'-folder. 
