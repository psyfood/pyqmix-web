import webbrowser
from pyqmix_backend.backend_app import app
import threading
import time
from urllib import request

"""
Start Flask server and open browser window once done.
Approach adopted from https://github.com/pallets/flask/issues/2178#issuecomment-292765792
"""

INDEX_URL = 'http://localhost:5000/pyqmix-web/'


def open_browser_():
    print('server starting...')

    while True:
        try:
            request.urlopen(url=INDEX_URL)
            break
        except Exception as e:
            print(e)
            time.sleep(0.5)
    print('server started !')
    # server started callback
    webbrowser.open(INDEX_URL,
                    new=1, autoraise=True)


def run(open_browser=True):
    if open_browser:
        threading.Thread(target=open_browser_).start()

    # start server
    app.run(host='0.0.0.0')


if __name__ == '__main__':
    run(open_browser=True)
