# This document is supposed to contain some helpful notes for developers

## Frontend: Ensure development and production builds look the same!

Due to reasons unknown, the production build – which is minified using
`webpack` – may sometimes put load the CSS files in a different order than
the development build, causing the frontend app to look different between
development and production
(see e.g. [this issue](https://github.com/psyfood/pyqmix-web/issues/41)).
Therefore, it is essential to always check
_both_, development and production build, before submitting and merging a
change.

The production build is created via

```
npm run build
```

Now, typically we deliver this build via the Flask backend. But there is also
an easier way to quickly achieve the same thing (which then also avoids
running into Flask configuration errors): We can simply use `serve`. It needs
to be installed once, globally:

```
npm install -g serve
```

Then, from the `pyqmix_frontend` directory, simply invoke

```
serve build/
```
and you're ready to view the app in the browser.