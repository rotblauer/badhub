Just serve the plain ol' `index.html`. It should grab in all necessary local deps, and use CDNs otherwise.

Here's a completely unrelated but maybe useful way to fire up a dumb enough server:
```sh
# Python 2+
$ python -m SimpleHTTPServer 8000 .

# Python 3+
$ python -m http.server 8000
```
